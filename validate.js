/* =========================
   JS: Validador VÆLORÜM - Integração Completa
   ========================= */

/* --- Configurações --- */
const CONFIG = {
  API_BASE: 'https://integrity.theusoft.shop', // API real
  VALIDATION_BASE: 'https://hash.theusoft.shop', // Front-end de validação
  ENDPOINTS: {
    STATUS: '/status',
    READ: '/read/'
  },
  VALIDATORS: [
    'https://emn178.github.io/online-tools/sha256_checksum.html',
    'https://passwordsgenerator.net/sha256-hash-generator/',
    'https://xorbin.com/tools/sha256-hash-calculator',
    'https://md5file.com/calculator'
  ]
};

/* --- Estado da Aplicação --- */
const STATE = {
  currentFile: null,
  currentHash: '',
  validationData: null,
  processing: false,
  logs: []
};

/* --- Sistema de Logs --- */
const Logger = {
  levels: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 },
  currentLevel: 2,
    
  log(level, message, data = null) {
    const timestamp = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const levelStr = Object.keys(this.levels).find(key => this.levels[key] === level);
    
    const logEntry = {
      timestamp,
      level: levelStr,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : null
    };
    
    STATE.logs.unshift(logEntry);
    if (STATE.logs.length > 50) STATE.logs.pop();
    
    this.updateLogDisplay();
    
    if (level <= this.currentLevel) {
      const consoleMethod = level === this.levels.ERROR ? 'error' : 
                           level === this.levels.WARN ? 'warn' : 'log';
      console[consoleMethod](`[${levelStr}] ${message}`, data || '');
    }
  },
  
  updateLogDisplay() {
    if (!logArea) return;
    
    const visibleLogs = STATE.logs.slice(0, 10);
    logArea.innerHTML = visibleLogs.map(log => 
      `<div style="margin-bottom: 8px; border-left: 3px solid ${
        log.level === 'ERROR' ? '#ff6b6b' : 
        log.level === 'WARN' ? '#ffa500' : '#66e07b'
      }; padding-left: 8px;">
        <span style="color: var(--muted); font-size: 11px;">${log.timestamp}</span><br>
        <span style="color: ${
          log.level === 'ERROR' ? '#ff6b6b' : 
          log.level === 'WARN' ? '#ffa500' : '#e6eef8'
        };">[${log.level}] ${log.message}</span>
      </div>`
    ).join('');
  },
  
  error(message, data = null) { this.log(this.levels.ERROR, message, data); },
  warn(message, data = null) { this.log(this.levels.WARN, message, data); },
  info(message, data = null) { this.log(this.levels.INFO, message, data); },
  debug(message, data = null) { this.log(this.levels.DEBUG, message, data); }
};

/* --- API Client --- */
const API = {
  async validateHash(hash) {
    if (!/^[0-9a-f]{64}$/i.test(hash)) {
      throw new Error('Hash inválido: deve ter 64 caracteres hexadecimais');
    }

    // CORRETO: https://integrity.theusoft.shop/read/{hash}
    const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.READ}${hash}`;
    Logger.info(`Consultando registro: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      Logger.info(`Status da resposta: ${response.status}`);

      if (response.status === 404) {
        return { 
          valid: false, 
          message: 'Hash não encontrado no registro VÆLORÜM',
          status: 404
        };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Se chegou aqui, o hash existe no registro
      const data = await response.text(); // Pode ser texto ou JSON
      Logger.info('Resposta da API recebida', { data: data.substring(0, 200) });
      
      return { 
        valid: true,
        message: 'Hash registrado no núcleo VÆLORÜM',
        data: data
      };

    } catch (error) {
      Logger.error('Erro na consulta ao registro', { error: error.message });
      
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        throw new Error('Não foi possível acessar o registro VÆLORÜM. Verifique a conexão.');
      }
      
      throw error;
    }
  }
};

/* --- Processador de PDF --- */
const PDFProcessor = {
  async processPDF(file) {
    Logger.info(`Processando PDF: ${file.name}`, { size: file.size });
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Hash original (com bloco)
      const hashWith = await this.sha256Hex(arrayBuffer);
      Logger.debug('Hash com bloco calculado', { hashWith });
      
      // Remover bloco de validação
      const { found, blockBytes, cleanedBuffer } = this.removeValidationBlockBytes(arrayBuffer);
      
      if (!found) {
        Logger.warn('Bloco de validação não detectado');
        return {
          hashWith,
          hashWithout: null,
          blockData: null,
          blockFound: false
        };
      }
      
      // Parsear dados do bloco
      const blockData = this.parseValidationBlock(blockBytes);
      Logger.debug('Bloco parseado', blockData);
      
      // Hash canônico (sem bloco)
      const hashWithout = await this.sha256Hex(cleanedBuffer);
      Logger.debug('Hash sem bloco calculado', { hashWithout });
      
      return {
        hashWith,
        hashWithout,
        blockData,
        blockFound: true,
        cleanedBuffer
      };
      
    } catch (error) {
      Logger.error('Erro no processamento do PDF', { error: error.message });
      throw error;
    }
  },
  
  indexOfSubarray(hay, needle, from = 0) {
    outer: for (let i = from; i <= hay.length - needle.length; i++) {
      for (let j = 0; j < needle.length; j++) { 
        if (hay[i + j] !== needle[j]) continue outer; 
      }
      return i;
    }
    return -1;
  },
  
  removeValidationBlockBytes(arrayBuffer) {
    const startMarker = new TextEncoder().encode('% === VALIDATION BLOCK ===');
    const endMarker = new TextEncoder().encode('% === END VALIDATION BLOCK ===');
    const bytes = new Uint8Array(arrayBuffer);
    
    const startIdx = this.indexOfSubarray(bytes, startMarker, 0);
    if (startIdx === -1) {
      return { found: false, blockBytes: null, cleanedBuffer: arrayBuffer };
    }
    
    const endIdx = this.indexOfSubarray(bytes, endMarker, startIdx + startMarker.length);
    const endPos = (endIdx === -1) ? bytes.length : (endIdx + endMarker.length);
    
    const blockBytes = bytes.slice(startIdx, endPos);
    const before = bytes.slice(0, startIdx);
    const after = bytes.slice(endPos);
    const cleaned = new Uint8Array(before.length + after.length);
    cleaned.set(before, 0);
    cleaned.set(after, before.length);
    
    return { found: true, blockBytes, cleanedBuffer: cleaned.buffer };
  },
  
  async sha256Hex(buffer) {
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  },
  
  parseValidationBlock(blockBytes) {
    try {
      const text = new TextDecoder().decode(blockBytes);
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const fields = {};
      
      lines.forEach(line => {
        if (!line.startsWith('%')) return;
        const content = line.replace(/^%\s?/, '');
        const separator = content.indexOf(':');
        
        if (separator === -1) {
          fields[content] = '';
        } else {
          const key = content.substring(0, separator).trim();
          const value = content.substring(separator + 1).trim();
          if (!this.EXCLUDE_KEYS.has(key)) {
            fields[key] = value;
          }
        }
      });
      
      return fields;
      
    } catch (error) {
      Logger.error('Erro ao parsear bloco', { error: error.message });
      return { error: 'Falha ao decodificar bloco' };
    }
  },
  
  EXCLUDE_KEYS: new Set(['=== VALIDATION BLOCK ===', '=== END VALIDATION BLOCK ===', 'HASH_ENDPOINT'])
};

/* --- Gerenciador de UI --- */
const UIManager = {
  setLoading(loading) {
    STATE.processing = loading;
    
    if (loading) {
      btnQuery.disabled = true;
      btnQuery.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Validando';
      dropZone.style.opacity = '0.6';
      dropZone.style.pointerEvents = 'none';
    } else {
      btnQuery.disabled = false;
      btnQuery.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Validar';
      dropZone.style.opacity = '1';
      dropZone.style.pointerEvents = 'auto';
    }
  },
  
  showError(message) {
    feedback.textContent = message;
    feedback.style.color = 'var(--danger)';
    Logger.error(message);
  },
  
  showSuccess(message) {
    feedback.textContent = message;
    feedback.style.color = 'var(--success)';
    Logger.info(message);
  },
  
  showInfo(message) {
    feedback.textContent = message;
    feedback.style.color = 'var(--muted)';
    Logger.info(message);
  },
  
  updateHashDisplays(hashes) {
    if (hashes.hashWith) hashWithEl.textContent = hashes.hashWith;
    if (hashes.hashWithout) hashWithoutEl.textContent = hashes.hashWithout;
    if (hashes.registeredHash) hashRegisteredEl.textContent = hashes.registeredHash;
  },
  
  updateValidationResult(isValid, message) {
    if (isValid) {
      compareBadge.className = 'badge ok';
      compareBadge.innerHTML = '<i class="fa-solid fa-check"></i>&nbsp;VÁLIDO';
    } else {
      compareBadge.className = 'badge no';
      compareBadge.innerHTML = '<i class="fa-solid fa-xmark"></i>&nbsp;INVÁLIDO';
    }
    compareText.textContent = message;
    compareBadge.style.display = 'inline-flex';
  },
  
  populateMetaList(data) {
    metaList.innerHTML = '';
    const fieldOrder = [
      'ENTITY', 'CREATOR_UA', 'TIMESTAMP_BR', 'SHA256_BASE', 
      'BYTES_BASE', 'MB_BASE', 'CHAR_COUNT_BASE', 'BYTES_FINAL', 
      'MB_FINAL', 'CHAR_COUNT_FINAL', 'EXTRA', 'BRAND'
    ];
    
    fieldOrder.forEach(key => {
      if (!(key in data)) return;
      
      const value = data[key];
      const icon = iconMap[key] || 'fa-tag';
      const item = document.createElement('div');
      item.className = 'meta-item';
      item.innerHTML = `
        <div class="icon"><i class="fa-solid ${icon}"></i></div>
        <div style="flex:1">
          <div class="key">${key.replace(/_/g, ' ')}</div>
          <div class="val">${value}</div>
        </div>
      `;
      metaList.appendChild(item);
    });
    
    show(metaCard);
  },
  
  showResults() {
    show(resultGrid);
    show(logCard);
  },
  
  resetUI() {
    hide(resultGrid);
    hide(metaCard);
    metaList.innerHTML = '';
    hashWithEl.textContent = '—';
    hashWithoutEl.textContent = '—';
    hashRegisteredEl.textContent = '—';
    compareText.textContent = '';
    compareBadge.className = 'badge hidden';
    this.showInfo('Pronto para validar');
  }
};

/* ===== REFERÊNCIAS DOM ===== */
const externalHashInput = document.getElementById('externalHashInput');
const btnQuery = document.getElementById('btnQuery');
const btnPaste = document.getElementById('btnPaste');
const btnClear = document.getElementById('btnClear');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const feedback = document.getElementById('feedback');
const resultGrid = document.getElementById('resultGrid');
const metaCard = document.getElementById('metaCard');
const metaList = document.getElementById('metaList');
const logCard = document.getElementById('logCard');
const logArea = document.getElementById('logArea');
const hashWithEl = document.getElementById('hashWith');
const hashWithoutEl = document.getElementById('hashWithout');
const hashRegisteredEl = document.getElementById('hashRegistered');
const compareBadge = document.getElementById('compareBadge');
const compareText = document.getElementById('compareText');

/* Mapa de ícones */
const iconMap = {
  'ENTITY': 'fa-building-columns',
  'CREATOR_UA': 'fa-user-pen',
  'TIMESTAMP_BR': 'fa-clock',
  'SHA256_BASE': 'fa-fingerprint',
  'BYTES_BASE': 'fa-database',
  'MB_BASE': 'fa-weight-hanging',
  'CHAR_COUNT_BASE': 'fa-font',
  'BYTES_FINAL': 'fa-database',
  'MB_FINAL': 'fa-weight-hanging',
  'CHAR_COUNT_FINAL': 'fa-font',
  'EXTRA': 'fa-tag',
  'BRAND': 'fa-copyright'
};

/* ===== FUNÇÕES AUXILIARES ===== */
function show(element) {
  element.classList.remove('hidden');
}

function hide(element) {
  element.classList.add('hidden');
}

function toast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

function enableClearButton() {
  const hasContent = metaList.children.length > 0 || 
                    externalHashInput.value.trim() !== '' ||
                    STATE.currentFile !== null;
  btnClear.classList.toggle('hidden', !hasContent);
}

/* ===== MANIPULAÇÃO DE EVENTOS ===== */

/* Drag & Drop */
(function setupDragDrop() {
  let dragCounter = 0;
  
  dropZone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    dropZone.classList.add('dragover');
  });
  
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  
  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      dropZone.classList.remove('dragover');
    }
  });
  
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileUpload(file);
  });
  
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
  });
})();

/* Colar da área de transferência */
btnPaste.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      externalHashInput.value = text.trim();
      toast('Hash colado com sucesso');
      Logger.info('Hash colado da área de transferência');
    }
    enableClearButton();
  } catch (error) {
    toast('Não foi possível acessar a área de transferência');
    Logger.error('Falha ao colar', { error: error.message });
  }
});

/* Limpar interface */
btnClear.addEventListener('click', () => {
  externalHashInput.value = '';
  STATE.currentFile = null;
  STATE.currentHash = '';
  STATE.validationData = null;
  UIManager.resetUI();
  enableClearButton();
  Logger.info('Interface reiniciada');
});

/* Validar hash */
btnQuery.addEventListener('click', () => {
  const hash = externalHashInput.value.trim();
  
  if (!hash) {
    UIManager.showError('Por favor, insira um hash para validação');
    return;
  }
  
  if (!/^[0-9a-f]{64}$/i.test(hash)) {
    UIManager.showError('Hash inválido. Deve ser um SHA-256 de 64 caracteres hexadecimais');
    return;
  }
  
  validateHash(hash);
});

/* Upload de arquivo */
async function handleFileUpload(file) {
  if (file.type !== 'application/pdf') {
    UIManager.showError('Por favor, selecione um arquivo PDF');
    return;
  }
  
  if (file.size > 50 * 1024 * 1024) {
    UIManager.showError('Arquivo muito grande. Tamanho máximo: 50MB');
    return;
  }
  
  Logger.info(`Upload de arquivo: ${file.name}`, { size: file.size });
  UIManager.setLoading(true);
  UIManager.showInfo('Processando PDF...');
  
  try {
    UIManager.resetUI();
    
    const result = await PDFProcessor.processPDF(file);
    
    STATE.currentFile = file;
    STATE.currentHash = result.hashWithout || result.hashWith;
    
    // Atualizar interface com resultados
    UIManager.updateHashDisplays({
      hashWith: result.hashWith,
      hashWithout: result.hashWithout || '— (sem bloco)'
    });
    
    if (result.blockFound && result.blockData) {
      UIManager.populateMetaList(result.blockData);
      UIManager.showSuccess('Bloco de validação processado');
    } else {
      hide(metaCard);
      UIManager.showInfo('Nenhum bloco de validação detectado');
    }
    
    UIManager.showResults();
    
    // Validar se há hash registrado
    const registeredHash = externalHashInput.value.trim();
    if (registeredHash && result.hashWithout) {
      performLocalValidation(registeredHash, result.hashWithout);
    }
    
  } catch (error) {
    UIManager.showError('Erro ao processar arquivo');
    Logger.error('Falha no processamento', { error: error.message });
  } finally {
    UIManager.setLoading(false);
    enableClearButton();
  }
}

/* Validação via API */
async function validateHash(hash) {
  UIManager.setLoading(true);
  UIManager.showInfo('Consultando registro VÆLORÜM...');
  UIManager.showResults();
  
  try {
    const result = await API.validateHash(hash);
    
    hashRegisteredEl.textContent = hash;
    
    if (result.valid) {
      UIManager.updateValidationResult(
        true,
        '✓ Hash válido e registrado no sistema VÆLORÜM'
      );
      UIManager.showSuccess('Validação concluída com sucesso');
      
      // Tentar extrair metadados se a resposta contiver dados
      if (result.data && typeof result.data === 'string' && result.data.includes('ENTITY')) {
        try {
          const lines = result.data.split('\n');
          const metadata = {};
          lines.forEach(line => {
            if (line.includes(':')) {
              const [key, value] = line.split(':').map(s => s.trim());
              if (key && value) metadata[key] = value;
            }
          });
          if (Object.keys(metadata).length > 0) {
            UIManager.populateMetaList(metadata);
          }
        } catch (e) {
          Logger.warn('Não foi possível extrair metadados da resposta');
        }
      }
    } else {
      UIManager.updateValidationResult(
        false,
        '✗ Hash não encontrado no registro VÆLORÜM'
      );
      UIManager.showError('Hash não consta no registro');
    }
    
    // Validação local se tiver arquivo carregado
    if (STATE.currentHash) {
      performLocalValidation(hash, STATE.currentHash);
    }
    
  } catch (error) {
    UIManager.showError('Erro na consulta: ' + error.message);
    Logger.error('Falha na consulta do hash', { 
      hash: hash, 
      error: error.message 
    });
    
    // Fallback
    hashRegisteredEl.textContent = hash;
    const isHashFormatValid = /^[0-9a-f]{64}$/i.test(hash);
    UIManager.updateValidationResult(
      isHashFormatValid,
      isHashFormatValid ? 
        '✓ Hash com formato válido (registro indisponível)' : 
        '✗ Hash com formato inválido'
    );
  } finally {
    UIManager.setLoading(false);
    enableClearButton();
  }
}

/* Validação local entre hashes */
function performLocalValidation(registeredHash, computedHash) {
  if (registeredHash.toLowerCase() === computedHash.toLowerCase()) {
    UIManager.updateValidationResult(
      true,
      '✓ Hash canônico corresponde ao calculado. Integridade verificada.'
    );
    Logger.info('Validação local bem-sucedida');
  } else {
    UIManager.updateValidationResult(
      false,
      '✗ Hash canônico NÃO coincide. Documento pode ter sido alterado.'
    );
    Logger.warn('Falha na validação local', { registeredHash, computedHash });
  }
}

/* Botões de copiar */
document.getElementById('cpyWith').addEventListener('click', () => {
  navigator.clipboard.writeText(hashWithEl.textContent || '');
  toast('Hash (com bloco) copiado');
});

document.getElementById('cpyWithout').addEventListener('click', () => {
  navigator.clipboard.writeText(hashWithoutEl.textContent || '');
  toast('Hash (sem bloco) copiado');
});

document.getElementById('cpyRegistered').addEventListener('click', () => {
  navigator.clipboard.writeText(hashRegisteredEl.textContent || '');
  toast('Hash registrado copiado');
});

/* Configurar validadores externos */
CONFIG.VALIDATORS.forEach((link, index) => {
  const validator = document.getElementById(`v${index + 1}`);
  if (validator) {
    validator.href = link;
    validator.title = `Validador externo ${index + 1}`;
  }
});

/* Inicialização a partir da URL */
function initializeFromURL() {
  try {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    const segments = path.split('/');
    
    let hashFromURL = '';
    
    if (segments[0] === 'validate' && segments[1]) {
      hashFromURL = segments[1];
    } else if (segments.length === 1 && /^[0-9a-f]{64}$/i.test(segments[0])) {
      hashFromURL = segments[0];
    }
    
    if (hashFromURL) {
      externalHashInput.value = hashFromURL;
      hashRegisteredEl.textContent = hashFromURL;
      Logger.info(`Hash da URL: ${hashFromURL}`);
      
      // Validar automaticamente se veio da URL
      setTimeout(() => validateHash(hashFromURL), 1000);
    }
    
  } catch (error) {
    Logger.error('Erro na inicialização', { error: error.message });
  }
}
/* Menu Mobile */
function tsMenu() {
  document.getElementById("ts-mobile").classList.toggle("hidden");
}

/* Efeito de scroll no header */
window.addEventListener("scroll", () => {
  const header = document.querySelector(".ts-topbar");
  if (window.scrollY > 30) {
    header.classList.add("active");
  } else {
    header.classList.remove("active");
  }
});

/* ===== INICIALIZAÇÃO ===== */
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar logs
  Logger.updateLogDisplay();
  show(logCard);
  
  // Configurar interface
  UIManager.resetUI();
  enableClearButton();
  
  // Processar URL
  initializeFromURL();
  
  Logger.info('Validador VÆLORÜM inicializado', {
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  });
});
