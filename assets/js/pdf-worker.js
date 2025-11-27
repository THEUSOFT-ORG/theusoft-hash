// pdf-worker.js - Web Worker otimizado para processamento de PDF pesado
// Recebe: { type: 'processPDF', fileBuffer: ArrayBuffer, chunkSize?: number, options?: Object }
// Responde:
//  - { type: 'result', success: true, result: {...} }
//  - { type: 'error', success: false, error: 'mensagem' }
//  - { type: 'progress', progress: 0..100, stage: string }

(function() {
  'use strict';

// Configurações otimizadas para performance - MAIS RÁPIDO
// Configurações ULTRA RÁPIDAS
const WORKER_CONFIG = {
  DEFAULT_CHUNK_SIZE: 4 * 1024 * 1024, // 4MB para velocidade máxima
  MAX_CHUNK_SIZE: 16 * 1024 * 1024, // 16MB máximo
  PROGRESS_INTERVAL_MS: 30, // Atualizações a cada 30ms (máximo)
  YIELD_INTERVAL: 4 * 1024 * 1024, // Yield a cada 4MB
};

  // Cache de instâncias para reutilização
  const sha256Cache = new WeakMap();

  class PDFProcessor {
    constructor() {
      this.abortController = new AbortController();
      this.lastProgressTime = 0;
      this.processedSinceLastYield = 0;
    }

    async processPDF(arrayBuffer, chunkSize = WORKER_CONFIG.DEFAULT_CHUNK_SIZE, options = {}) {
      const signal = this.abortController.signal;
      
      try {
        // Validação de entrada
        this.validateInput(arrayBuffer, chunkSize);
        
        const totalBytes = arrayBuffer.byteLength;
        const optimizedChunkSize = this.optimizeChunkSize(chunkSize, totalBytes);
        
        console.log(`[PDF Worker] Processando PDF: ${totalBytes} bytes, chunk: ${optimizedChunkSize} bytes`);

        // 1) Cálculo de hash com bloco de validação
        const hashWith = await this.calculateHashIncremental(
          arrayBuffer, 
          optimizedChunkSize, 
          totalBytes, 
          signal,
          'Calculando hash original'
        );

        // 2) Detectar e remover bloco de validação
        const extractionResult = this.extractValidationBlock(arrayBuffer);
        
        if (signal.aborted) {
          throw new Error('Processamento cancelado');
        }

        if (!extractionResult.found) {
          self.postMessage({ type: 'progress', progress: 100, stage: 'Finalizado' });
          return this.formatResult(hashWith, null, null, false, null, totalBytes);
        }

        // 3) Parse dos dados do bloco
        const blockData = this.parseValidationBlock(extractionResult.blockBytes);

        // 4) Cálculo de hash sem bloco de validação
        const hashWithout = await this.calculateHashIncremental(
          extractionResult.cleanedBuffer,
          optimizedChunkSize,
          extractionResult.cleanedBuffer.byteLength,
          signal,
          'Calculando hash sem bloco de validação'
        );

        if (signal.aborted) {
          throw new Error('Processamento cancelado');
        }

        self.postMessage({ type: 'progress', progress: 100, stage: 'Finalizado' });

        return this.formatResult(
          hashWith, 
          hashWithout, 
          blockData, 
          true, 
          extractionResult.cleanedBuffer,
          totalBytes
        );

      } catch (error) {
        if (error.name === 'AbortError' || error.message === 'Processamento cancelado') {
          console.log('[PDF Worker] Processamento cancelado pelo usuário');
          throw new Error('Processamento cancelado');
        }
        throw error;
      }
    }

    validateInput(arrayBuffer, chunkSize) {
      if (!arrayBuffer || !(arrayBuffer instanceof ArrayBuffer)) {
        throw new Error('Buffer de arquivo inválido');
      }

      if (arrayBuffer.byteLength === 0) {
        throw new Error('Arquivo vazio');
      }

      if (chunkSize <= 0 || chunkSize > WORKER_CONFIG.MAX_CHUNK_SIZE) {
        throw new Error(`Tamanho de chunk inválido: ${chunkSize}`);
      }
    }

    optimizeChunkSize(requestedSize, totalBytes) {
      let size = Math.min(requestedSize, WORKER_CONFIG.MAX_CHUNK_SIZE);
      
      // Ajusta dinamicamente baseado no tamanho do arquivo
      if (totalBytes > 100 * 1024 * 1024) { // > 100MB
        size = Math.max(size, 2 * 1024 * 1024); // Mínimo 2MB para arquivos muito grandes
      }
      
      // Garante que o chunk size é múltiplo de 64 para alinhamento SHA256
      return Math.floor(size / 64) * 64;
    }

async calculateHashIncremental(arrayBuffer, chunkSize, totalBytes, signal, stage) {
  const bytes = new Uint8Array(arrayBuffer);
  const sha = this.getSHA256Instance();
  
  let processed = 0;
  this.processedSinceLastYield = 0;
  this.lastProgressTime = performance.now();

  // CORREÇÃO: Enviar progresso inicial imediatamente
  await this.updateProgress(0, totalBytes, stage, signal);

  for (let offset = 0; offset < totalBytes; offset += chunkSize) {
    if (signal.aborted) {
      throw new Error('AbortError');
    }

    const end = Math.min(offset + chunkSize, totalBytes);
    const chunk = bytes.subarray(offset, end);
    
    sha.update(chunk);
    processed = end;
    this.processedSinceLastYield += chunk.length;

    // CORREÇÃO: Atualizar progresso a cada chunk processado
    await this.updateProgress(processed, totalBytes, stage, signal);

    // Yield para evitar bloqueio da thread
    if (this.processedSinceLastYield >= WORKER_CONFIG.YIELD_INTERVAL) {
      await this.cooperativeYield();
      this.processedSinceLastYield = 0;
    }
  }

  // CORREÇÃO: Garantir que 100% seja enviado ao finalizar
  await this.updateProgress(totalBytes, totalBytes, `${stage} - Finalizando`, signal);

  return sha.digest();
}
 async updateProgress(processed, total, stage, signal) {
  const currentTime = performance.now();
  const progress = Math.floor((processed / total) * 100);
  
  // CORREÇÃO: Sempre enviar progresso quando for 0% ou 100%
  if (progress === 0 || progress === 100 || 
      currentTime - this.lastProgressTime >= WORKER_CONFIG.PROGRESS_INTERVAL_MS) {
    
    self.postMessage({ 
      type: 'progress', 
      progress, 
      stage,
      processed,
      total
    });

    this.lastProgressTime = currentTime;

    // CORREÇÃO: Yield breve para manter responsividade
    if (signal && !signal.aborted) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}
    async cooperativeYield() {
      // Yield para o event loop manter responsividade
      return new Promise(resolve => {
        setTimeout(resolve, 0);
      });
    }

    getSHA256Instance() {
      // Reutiliza instância se possível, senão cria nova
      let sha = sha256Cache.get(this);
      if (!sha) {
        sha = new Sha256.SHA256();
        sha256Cache.set(this, sha);
      } else {
        sha.reset();
      }
      return sha;
    }

    extractValidationBlock(arrayBuffer) {
      try {
        const startMarker = new TextEncoder().encode('% === VALIDATION BLOCK ===');
        const endMarker = new TextEncoder().encode('% === END VALIDATION BLOCK ===');
        const bytes = new Uint8Array(arrayBuffer);

        const startIdx = this.indexOfSubarrayOptimized(bytes, startMarker);
        if (startIdx === -1) {
          return { found: false, blockBytes: null, cleanedBuffer: arrayBuffer };
        }

        const endIdx = this.indexOfSubarrayOptimized(bytes, endMarker, startIdx + startMarker.length);
        if (endIdx === -1) {
          console.warn('[PDF Worker] Marcador final do bloco de validação não encontrado');
          return { found: false, blockBytes: null, cleanedBuffer: arrayBuffer };
        }

        const endPos = endIdx + endMarker.length;
        const blockBytes = bytes.slice(startIdx, endPos);
        
        // Cria buffer limpo de forma eficiente
        const cleanedBuffer = this.createCleanedBuffer(bytes, startIdx, endPos);

        return { 
          found: true, 
          blockBytes, 
          cleanedBuffer,
          blockStart: startIdx,
          blockEnd: endPos
        };

      } catch (error) {
        console.error('[PDF Worker] Erro na extração do bloco:', error);
        return { found: false, blockBytes: null, cleanedBuffer: arrayBuffer };
      }
    }

    indexOfSubarrayOptimized(haystack, needle, fromIndex = 0) {
      // Implementação otimizada para grandes buffers
      const haystackLength = haystack.length;
      const needleLength = needle.length;
      
      if (needleLength === 0) return fromIndex;
      if (fromIndex >= haystackLength) return -1;
      
      const firstByte = needle[0];
      const maxIndex = haystackLength - needleLength;
      
      for (let i = fromIndex; i <= maxIndex; i++) {
        // Busca rápida do primeiro byte
        if (haystack[i] !== firstByte) {
          continue;
        }
        
        // Verificação completa apenas se primeiro byte coincidir
        let match = true;
        for (let j = 1; j < needleLength; j++) {
          if (haystack[i + j] !== needle[j]) {
            match = false;
            break;
          }
        }
        
        if (match) return i;
      }
      
      return -1;
    }

    createCleanedBuffer(originalBytes, startIdx, endPos) {
      // Cria buffer limpo de forma eficiente sem cópias desnecessárias
      const beforeLength = startIdx;
      const afterLength = originalBytes.length - endPos;
      const totalLength = beforeLength + afterLength;
      
      const cleaned = new Uint8Array(totalLength);
      
      // Copia a parte antes do bloco
      cleaned.set(originalBytes.subarray(0, startIdx), 0);
      // Copia a parte depois do bloco
      cleaned.set(originalBytes.subarray(endPos), beforeLength);
      
      return cleaned.buffer;
    }

    parseValidationBlock(blockBytes) {
      try {
        const text = new TextDecoder('utf-8', { fatal: false }).decode(blockBytes);
        const lines = text.split(/\r?\n/);
        const fields = {};
        const EXCLUDE_KEYS = new Set([
          '=== VALIDATION BLOCK ===', 
          '=== END VALIDATION BLOCK ===', 
          'HASH_ENDPOINT'
        ]);

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('%')) continue;
          
          const content = trimmed.slice(1).trim();
          const separatorIndex = content.indexOf(':');
          
          if (separatorIndex === -1) {
            const key = content;
            if (!EXCLUDE_KEYS.has(key)) {
              fields[key] = '';
            }
          } else {
            const key = content.substring(0, separatorIndex).trim();
            const value = content.substring(separatorIndex + 1).trim();
            if (!EXCLUDE_KEYS.has(key)) {
              fields[key] = value;
            }
          }
        }

        return fields;
      } catch (error) {
        console.error('[PDF Worker] Erro no parse do bloco:', error);
        return { error: 'Falha ao decodificar bloco de validação' };
      }
    }

    formatResult(hashWith, hashWithout, blockData, blockFound, cleanedBuffer, originalSize) {
      return {
        hashWith,
        hashWithout,
        blockData,
        blockFound,
        cleanedBuffer,
        metadata: {
          originalSize,
          cleanedSize: cleanedBuffer ? cleanedBuffer.byteLength : originalSize,
          processedAt: new Date().toISOString()
        }
      };
    }

    abort() {
      this.abortController.abort();
      // Cria novo controller para próximos processamentos
      this.abortController = new AbortController();
    }

    cleanup() {
      sha256Cache.delete(this);
      this.abort();
    }
  }

  /* ------------------------------
     SHA-256 Implementation (mantida do original)
     ------------------------------ */
  const Sha256 = (() => {
    // Constants
    const K = new Uint32Array([
      0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
      0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
      0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
      0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
      0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
      0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    ]);

    function rotr(n, x) { return (x >>> n) | (x << (32 - n)); }

    function toHexWords(words) {
      let out = '';
      for (let i = 0; i < words.length; i++) {
        out += ('00000000' + (words[i] >>> 0).toString(16)).slice(-8);
      }
      return out;
    }

    class SHA256 {
      constructor() {
        this._h = new Uint32Array(8);
        this._buffer = new Uint8Array(64); // 512-bit block buffer
        this._bufferIndex = 0;
        this._count = 0n; // bit count
        this.reset();
      }

      reset() {
        // Initial hash values
        this._h[0] = 0x6a09e667;
        this._h[1] = 0xbb67ae85;
        this._h[2] = 0x3c6ef372;
        this._h[3] = 0xa54ff53a;
        this._h[4] = 0x510e527f;
        this._h[5] = 0x9b05688c;
        this._h[6] = 0x1f83d9ab;
        this._h[7] = 0x5be0cd19;
        this._bufferIndex = 0;
        this._count = 0n;
      }

      // process one 512-bit block (Uint8Array length 64)
      _processBlock(block) {
        const w = new Uint32Array(64);
        // convert bytes to big-endian words
        for (let i = 0; i < 16; i++) {
          w[i] =
            (block[i * 4] << 24) |
            (block[i * 4 + 1] << 16) |
            (block[i * 4 + 2] << 8) |
            (block[i * 4 + 3]);
        }
        for (let i = 16; i < 64; i++) {
          const s0 = (rotr(7, w[i - 15]) ^ rotr(18, w[i - 15]) ^ (w[i - 15] >>> 3)) >>> 0;
          const s1 = (rotr(17, w[i - 2]) ^ rotr(19, w[i - 2]) ^ (w[i - 2] >>> 10)) >>> 0;
          w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
        }

        let a = this._h[0] >>> 0;
        let b = this._h[1] >>> 0;
        let c = this._h[2] >>> 0;
        let d = this._h[3] >>> 0;
        let e = this._h[4] >>> 0;
        let f = this._h[5] >>> 0;
        let g = this._h[6] >>> 0;
        let h = this._h[7] >>> 0;

        for (let i = 0; i < 64; i++) {
          const S1 = (rotr(6, e) ^ rotr(11, e) ^ rotr(25, e)) >>> 0;
          const ch = ((e & f) ^ (~e & g)) >>> 0;
          const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
          const S0 = (rotr(2, a) ^ rotr(13, a) ^ rotr(22, a)) >>> 0;
          const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
          const temp2 = (S0 + maj) >>> 0;

          h = g;
          g = f;
          f = e;
          e = (d + temp1) >>> 0;
          d = c;
          c = b;
          b = a;
          a = (temp1 + temp2) >>> 0;
        }

        this._h[0] = (this._h[0] + a) >>> 0;
        this._h[1] = (this._h[1] + b) >>> 0;
        this._h[2] = (this._h[2] + c) >>> 0;
        this._h[3] = (this._h[3] + d) >>> 0;
        this._h[4] = (this._h[4] + e) >>> 0;
        this._h[5] = (this._h[5] + f) >>> 0;
        this._h[6] = (this._h[6] + g) >>> 0;
        this._h[7] = (this._h[7] + h) >>> 0;
      }

      update(chunk) {
        // chunk: Uint8Array
        let offset = 0;
        const len = chunk.length;
        this._count += BigInt(len) * 8n;

        while (offset < len) {
          const need = 64 - this._bufferIndex;
          const take = Math.min(need, len - offset);
          this._buffer.set(chunk.subarray(offset, offset + take), this._bufferIndex);
          this._bufferIndex += take;
          offset += take;

          if (this._bufferIndex === 64) {
            this._processBlock(this._buffer);
            this._bufferIndex = 0;
          }
        }
      }

      digest() {
        // padding
        const padLen = (this._bufferIndex < 56) ? (56 - this._bufferIndex) : (120 - this._bufferIndex);
        const padding = new Uint8Array(padLen + 8);
        padding[0] = 0x80;
        // append length in bits as big-endian 64-bit
        const bitCount = this._count;
        for (let i = 0; i < 8; i++) {
          padding[padLen + 7 - i] = Number((bitCount >> BigInt(i * 8)) & 0xffn);
        }
        this.update(padding);
        // after padding bufferIndex must be zero (we processed last blocks)
        const hashWords = this._h;
        return toHexWords(hashWords);
      }
    }

    return { SHA256 };
  })();

  // Instância global do processador
  const processor = new PDFProcessor();

  // Message handler principal
  self.addEventListener('message', async (e) => {
    const data = e.data || {};
    
    try {
      switch (data.type) {
        case 'processPDF':
          const chunkSize = data.chunkSize || WORKER_CONFIG.DEFAULT_CHUNK_SIZE;
          const options = data.options || {};
          
          const result = await processor.processPDF(
            data.fileBuffer, 
            chunkSize, 
            options
          );
          
          self.postMessage({ 
            type: 'result', 
            success: true, 
            result,
            id: data.id // Para correlacionar requests
          });
          break;

        case 'abort':
          processor.abort();
          self.postMessage({ 
            type: 'aborted', 
            success: true,
            id: data.id
          });
          break;

        case 'ping':
          self.postMessage({ 
            type: 'pong', 
            worker: 'pdf-processor',
            ready: true
          });
          break;

        default:
          console.warn('[PDF Worker] Tipo de mensagem desconhecido:', data.type);
      }
    } catch (error) {
      console.error('[PDF Worker] Erro:', error);
      self.postMessage({ 
        type: 'error', 
        success: false, 
        error: error.message,
        id: data.id
      });
    }
  });

  // Handler para errors globais
  self.addEventListener('error', (event) => {
    console.error('[PDF Worker] Erro global:', event.error);
    self.postMessage({
      type: 'error',
      success: false,
      error: `Erro global: ${event.error?.message || 'Unknown error'}`
    });
  });

  // Handler para rejeições de promises não tratadas
  self.addEventListener('unhandledrejection', (event) => {
    console.error('[PDF Worker] Promise rejeitada:', event.reason);
    self.postMessage({
      type: 'error',
      success: false,
      error: `Promise rejeitada: ${event.reason?.message || 'Unknown reason'}`
    });
  });

  // Inicialização
  console.log('[PDF Worker] Worker inicializado e pronto');
})();