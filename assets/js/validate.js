/* =========================
   JS: Validador VÆLORÜM - Integração Completa
   ========================= */

/* --- Configurações --- */
const CONFIG = {
  API_BASE: 'https://integrity.theusoft.shop',
  ENDPOINTS: {
    VALIDATE: '/read/'
  },
  VALIDATORS: [
    'https://emn178.github.io/online-tools/sha256_checksum.html',
    'https://passwordsgenerator.net/sha256-hash-generator/',
    'https://xorbin.com/tools/sha256-hash-calculator',
    'https://md5file.com/calculator'
  ]
};

// DEBUG: Verificar se a configuração está correta
console.log('CONFIG carregado:', CONFIG);
console.log('ENDPOINTS.VALIDATE:', CONFIG.ENDPOINTS.VALIDATE);

/* --- Estado da Aplicação --- */
const STATE = {
  currentFile: null,
  currentHash: '',
  validationData: null,
  processing: false,
  logs: []
};


/* --- Sistema de Status da API --- */
/* --- Sistema de Status da API --- */
const StatusManager = {
  apiStatus: null,
  uptimeStart: null,
  statusInterval: null,
  syncInterval: null,
  greetingInterval: null,
  secondsCounter: 0,
  
  async init() {
    await this.checkAPIStatus();
    this.startUptimeAnimation();
    this.startGreetingSync();
    this.startAPISync();
  },
  
// No validate.js, modifique a função checkAPIStatus no StatusManager:

// No validate.js, modifique a função checkAPIStatus no StatusManager:

async checkAPIStatus() {
  // Verificar conectividade primeiro de forma não-bloqueadora
  if (window.ConnectivityManager && 
      (!ConnectivityManager.isOnline || !ConnectivityManager.hasValidCORS)) {
    console.debug('Verificação de API adiada devido a problemas de conectividade');
    return false;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch('https://integrity.theusoft.shop/status', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      this.apiStatus = data;
      
      this.parseUptime(data.uptime);
      this.parseGreeting(data.message);
      this.updateStatusUI('online');
      Logger.info('Status da API verificado', data);
      
      return true;
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    // Log mais limpo - sem stack traces desnecessários
    if (error.name === 'AbortError') {
      Logger.warn('Timeout na verificação de status da API');
    } else {
      Logger.debug('Falha ao verificar status da API, usando fallback');
    }
    this.setFallbackStatus();
    return false;
  }
},
  
  parseUptime(uptimeString) {
    // Exemplo: "1 dias, 16 horas e 46 minutos"
    const daysMatch = uptimeString.match(/(\d+)\s*dias?/);
    const hoursMatch = uptimeString.match(/(\d+)\s*horas?/);
    const minutesMatch = uptimeString.match(/(\d+)\s*minutos?/);
    
    const days = daysMatch ? parseInt(daysMatch[1]) : 0;
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
    
    // Calcular timestamp inicial baseado no uptime
    const totalMinutes = (days * 24 * 60) + (hours * 60) + minutes;
    this.uptimeStart = new Date(Date.now() - (totalMinutes * 60 * 1000));
    this.secondsCounter = 0; // Reset counter
  },
  
  parseGreeting(message) {
    // Extrai a saudação antes da primeira vírgula
    // Exemplo: "Boa tarde, a API AutoIntegrity Engine está ativa..."
    const greetingMatch = message.match(/^([^,]+),/);
    if (greetingMatch && greetingMatch[1]) {
      const greeting = greetingMatch[1].trim();
      this.updateGreetingUI(greeting);
    }
  },
  
  updateGreetingUI(greeting) {
    const greetingEl = document.getElementById('greetingText');
    const iconEl = document.querySelector('.greeting i');
    
    if (!greetingEl) return;
    
    greetingEl.textContent = greeting;
    
    // Define ícone baseado na saudação
    let icon = 'fa-sun';
    if (greeting.includes('noite') || greeting.includes('madrugada')) {
      icon = 'fa-moon';
    } else if (greeting.includes('tarde')) {
      icon = 'fa-sun';
    } else if (greeting.includes('dia')) {
      icon = 'fa-sun';
    }
    
    if (iconEl) {
      iconEl.className = `fa-solid ${icon}`;
    }
  },
  
  setFallbackStatus() {
    // Fallback caso a API não responda
    this.uptimeStart = new Date('2025-11-21'); // Data de início do projeto
    this.secondsCounter = 0;
    this.updateStatusUI('online');
    this.updateGreetingBasedOnTime();
  },
  
  updateGreetingBasedOnTime() {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour >= 5 && hour < 12) {
      greeting = 'Bom dia';
    } else if (hour >= 12 && hour < 18) {
      greeting = 'Boa tarde';
    } else if (hour >= 18 && hour < 23) {
      greeting = 'Boa noite';
    } else {
      greeting = 'Boa madrugada';
    }
    
    this.updateGreetingUI(greeting);
  },
  
  updateStatusUI(status) {
    const statusEl = document.getElementById('systemStatus');
    const dotEl = document.querySelector('.status-dot');
    
    if (!statusEl) return;
    
    switch(status) {
      case 'online':
        if (dotEl) {
          dotEl.style.background = 'var(--success)';
          dotEl.style.animation = 'blink 2s ease-in-out infinite';
        }
        break;
      case 'offline':
        statusEl.textContent = 'Sistema Offline';
        if (dotEl) {
          dotEl.style.background = 'var(--danger)';
          dotEl.style.animation = 'blink 1s ease-in-out infinite';
        }
        break;
      case 'loading':
        statusEl.textContent = 'Carregando status...';
        if (dotEl) {
          dotEl.style.background = 'var(--muted)';
          dotEl.style.animation = 'none';
        }
        break;
    }
  },
  
  calculateCurrentUptime() {
    if (!this.uptimeStart) return 'Calculando...';
    
    const now = new Date();
    const diff = now - this.uptimeStart;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    const parts = [];
    if (days > 0) parts.push(`${days} dia${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hora${hours > 1 ? 's' : ''}`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes} minuto${minutes > 1 ? 's' : ''}`);
    
    return {
      days,
      hours, 
      minutes,
      formatted: parts.join(', ')
    };
  },
  
  startUptimeAnimation() {
    // Atualizar a cada segundo para a animação dos segundos
    this.statusInterval = setInterval(() => {
      this.secondsCounter++;
      
      // Reset a cada 60 segundos
      if (this.secondsCounter >= 60) {
        this.secondsCounter = 0;
      }
      
      const uptime = this.calculateCurrentUptime();
      const statusEl = document.getElementById('systemStatus');
      
      if (statusEl && this.apiStatus) {
        // Formata com segundos animados (00-59)
        const secondsFormatted = this.secondsCounter.toString().padStart(2, '0');
        statusEl.textContent = `Online • ${uptime.formatted} e ${secondsFormatted}s`;
        statusEl.title = `Tempo de atividade: ${uptime.formatted} e ${this.secondsCounter} segundos`;
      }
    }, 1000); // Atualiza a cada segundo
  },
  
  startGreetingSync() {
    // Sincroniza a saudação a cada minuto (caso mude de período)
    this.greetingInterval = setInterval(() => {
      if (!this.apiStatus) {
        this.updateGreetingBasedOnTime();
      }
    }, 60000); // 1 minuto
  },
  
  startAPISync() {
    // Sincroniza com a API a cada 5 minutos para manter consistência
    this.syncInterval = setInterval(async () => {
      const success = await this.checkAPIStatus();
      if (success) {
        Logger.debug('Status sincronizado com API');
      }
    }, 300000); // 5 minutos
  },
  
  destroy() {
    if (this.statusInterval) clearInterval(this.statusInterval);
    if (this.syncInterval) clearInterval(this.syncInterval);
    if (this.greetingInterval) clearInterval(this.greetingInterval);
  }
};


// NOVO: Atualizar estado do layout - VERSÃO CORRIGIDA COM SCROLL
function updateLayoutState() {
  const mainContainer = document.querySelector('.main-container');
  const wrap = document.querySelector('.wrap');
  const colLeft = document.querySelector('.col-left');
  const hasResults = resultGrid && !resultGrid.classList.contains('hidden');
  
  if (!hasResults) {
    // Estado inicial - centralizar sem scroll
    mainContainer.classList.add('initial-state');
    mainContainer.classList.remove('has-content');
    wrap.classList.add('initial-state');
    wrap.classList.remove('has-content');
    if (colLeft) {
      colLeft.classList.add('centered');
    }
  } else {
    // Estado com conteúdo - permitir scroll
    mainContainer.classList.remove('initial-state');
    mainContainer.classList.add('has-content');
    wrap.classList.remove('initial-state');
    wrap.classList.add('has-content');
    if (colLeft) {
      colLeft.classList.remove('centered');
    }
  }
}

// Substitua a função antiga por esta (coloque em validate.js no lugar da função existente)
function alignResultGridHeight() {
  const resultGrid = document.getElementById('resultGrid');
  const metaCard = document.getElementById('metaCard');

  if (!resultGrid || !metaCard || metaCard.classList.contains('hidden')) {
    if (resultGrid) resultGrid.style.minHeight = '';
    return;
  }

  // Tentar calcular usando offsetTop/offsetHeight (relativo ao mesmo offsetParent)
  const parent = resultGrid.offsetParent || document.body;

  const resultTop = resultGrid.offsetTop;
  const metaTop = metaCard.offsetTop;
  const metaBottom = metaTop + metaCard.offsetHeight;

  // altura necessária para que a base do resultGrid alcance a base do metaCard
  let neededHeight = metaBottom - resultTop;

  // Se por algum motivo o cálculo deu negativo, usar boundingClientRect como fallback
  if (neededHeight <= 0) {
    const metaRect = metaCard.getBoundingClientRect();
    const resultRect = resultGrid.getBoundingClientRect();
    neededHeight = (metaRect.bottom - resultRect.top);
  }

  // adicionar pequeno padding para evitar cortes (opcional)
  const padding = 8;
  neededHeight = Math.max(0, Math.ceil(neededHeight) + padding);

  resultGrid.style.minHeight = `${neededHeight}px`;
}

/* --- Gerenciador da Seção de Apresentação --- */
const ProjectIntroManager = {
  init() {
    this.setupAnimations();
    // A saudação agora é gerenciada pelo StatusManager
  },
  
  setupAnimations() {
    // Animação contínua dos ícones de features
    const featureIcons = document.querySelectorAll('.feature-icon');
    featureIcons.forEach((icon, index) => {
      icon.style.animationDelay = `${index * 0.2}s`;
    });
  },
  
  show() {
    const introEl = document.getElementById('projectIntro');
    if (introEl) {
      introEl.classList.remove('hidden');
    }
  },
  
  hide() {
    const introEl = document.getElementById('projectIntro');
    if (introEl) {
      introEl.classList.add('hidden');
    }
  }
};

/* --- Gerenciador de Estado da UI --- */
const UIStateManager = {
  updateLayoutState() {
    const wrap = document.querySelector('.wrap');
    const colLeft = document.querySelector('.col-left');
    const colRight = document.querySelector('.col-right');
    const resultGrid = document.getElementById('resultGrid');
    const metaCard = document.getElementById('metaCard');
    
    // Verificar se há conteúdo para mostrar
    const hasResults = resultGrid && !resultGrid.classList.contains('hidden');
    const hasMeta = metaCard && !metaCard.classList.contains('hidden');
    
    if (!hasResults && !hasMeta) {
      // Estado inicial - centralizar verticalmente
      wrap.classList.add('initial-state');
      wrap.classList.remove('has-content');
      
      if (colLeft) {
        colLeft.classList.add('centered');
        colLeft.classList.remove('has-content');
      }
      
      if (colRight) {
        colRight.classList.add('centered');
        colRight.classList.remove('has-content', 'stretch');
      }
    } else {
      // Tem conteúdo - layout normal
      wrap.classList.remove('initial-state');
      wrap.classList.add('has-content');
      
      if (colLeft) {
        colLeft.classList.remove('centered');
        colLeft.classList.add('has-content');
      }
      
      if (colRight) {
        colRight.classList.remove('centered');
        
        if (hasMeta) {
          colRight.classList.add('stretch');
          colRight.classList.add('has-content');
        } else {
          colRight.classList.remove('stretch');
        }
      }
    }
  }
};
// NOVO: Função para calcular altura dinâmica COM SCROLL
function updateWrapHeight() {
  const wrap = document.querySelector('.wrap');
  const topbar = document.querySelector('.ts-topbar');
  const footer = document.querySelector('.ts-footer');
  
  if (wrap && topbar && footer) {
    const topbarHeight = topbar.offsetHeight;
    const footerHeight = footer.offsetHeight;
    
    wrap.style.marginTop = `${topbarHeight}px`;
    // Remover min-height fixa para permitir expansão
    wrap.style.minHeight = 'auto';
  }
}
// NOVO: Observar mudanças no DOM para atualizar o layout
const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.type === 'attributes' && 
        (mutation.target.id === 'resultGrid' || mutation.target.id === 'metaCard')) {
      UIStateManager.updateLayoutState();
    }
  });
});

// NOVO: Inicializar observador quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
  const targetNodes = [
    document.getElementById('resultGrid'),
    document.getElementById('metaCard')
  ];
  
  targetNodes.forEach(node => {
    if (node) {
      observer.observe(node, {
        attributes: true,
        attributeFilter: ['class']
      });
    }
  });
  
  // Atualizar altura inicial
  updateWrapHeight();
  UIStateManager.updateLayoutState();
});

// NOVO: Atualizar altura quando a janela for redimensionada
window.addEventListener('resize', function() {
  updateWrapHeight();
  UIStateManager.updateLayoutState();
});

// NOVO: Atualizar altura quando o DOM estiver completamente carregado
window.addEventListener('load', function() {
  updateWrapHeight();
  UIStateManager.updateLayoutState();
});


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
    
    // Notificar o sistema de logs
    if (window.logModalSystem && window.logModalSystem.getInstance()) {
        window.logModalSystem.addLog(levelStr, message, data);
    }
    
    if (level <= this.currentLevel) {
      const consoleMethod = level === this.levels.ERROR ? 'error' : 
                           level === this.levels.WARN ? 'warn' : 'log';
      console[consoleMethod](`[${levelStr}] ${message}`, data || '');
    }
  },
  
  updateLogDisplay() {
    // Atualizar APENAS o sistema de logs com todos os logs
    if (window.logModalSystem) {
        window.logModalSystem.updateLogs(STATE.logs);
    }
    
    // REMOVA completamente esta parte que atualiza o logArea original
    // if (logArea) {
    //     const visibleLogs = STATE.logs.slice(0, 10);
    //     logArea.innerHTML = visibleLogs.map(log => 
    //       `<div style="margin-bottom: 8px; border-left: 3px solid ${
    //         log.level === 'ERROR' ? '#ff6b6b' : 
    //         log.level === 'WARN' ? '#ffa500' : '#66e07b'
    //       }; padding-left: 8px;">
    //         <span style="color: var(--muted); font-size: 11px;">${log.timestamp}</span><br>
    //         <span style="color: ${
    //           log.level === 'ERROR' ? '#ff6b6b' : 
    //           log.level === 'WARN' ? '#ffa500' : '#e6eef8'
    //         };">[${log.level}] ${log.message}</span>
    //       </div>`
    //     ).join('');
    // }
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

    const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.VALIDATE}${hash}`;
   
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeout);

      // Tratar 404 como "hash não encontrado" em vez de erro
      if (response.status === 404) {
        const errorData = await response.json();
        return { 
          valid: false, 
          message: 'Hash não encontrado no registro',
          details: errorData
        };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      Logger.info('Resposta da API recebida', data);
      
      // CORREÇÃO: Retornar todos os dados da API para comparação completa
      return {
        valid: true,
        data: data,
        validation: data.validation,
        metadata: data.metadata
      };

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Timeout: A validação excedeu o tempo limite de 10 segundos');
      }
      throw error;
    }
  }
};

/* --- Comparador de Validação Completo --- */
const ValidationComparator = {
  compareWithBlock(apiData, blockData) {
    const discrepancies = [];
    
    if (!apiData || !blockData) {
      return { valid: false, discrepancies: ['Dados da API ou bloco não disponíveis'] };
    }

    // Mapeamento de campos entre API e bloco
    const fieldMapping = {
      'ENTITY': 'entity',
      'CREATOR_UA': 'creator_ua', 
      'TIMESTAMP_BR': 'timestamp_br',
      'SHA256_BASE': 'sha256_base',
      'BYTES_BASE': 'bytes_base',
      'MB_BASE': 'mb_base',
      'CHAR_COUNT_BASE': 'char_count_base',
      'BYTES_FINAL': 'bytes_final',
      'MB_FINAL': 'mb_final',
      'CHAR_COUNT_FINAL': 'char_count_final',
      'EXTRA': 'extra',
      'BRAND': 'brand'
    };

    // Comparar cada campo
    Object.entries(fieldMapping).forEach(([blockKey, apiKey]) => {
      const blockValue = blockData[blockKey];
      const apiValue = apiData[apiKey];
      
      if (blockValue !== undefined && apiValue !== undefined) {
        if (String(blockValue).trim() !== String(apiValue).trim()) {
          discrepancies.push({
            field: blockKey,
            blockValue: blockValue,
            apiValue: apiValue
          });
        }
      } else if (blockValue !== undefined && apiValue === undefined) {
        discrepancies.push({
          field: blockKey,
          message: `Campo presente no bloco mas não na API`,
          blockValue: blockValue
        });
      }
    });

    // Verificar hashes principais
    if (apiData.sha256_base && blockData.SHA256_BASE) {
      if (apiData.sha256_base.toLowerCase() !== blockData.SHA256_BASE.toLowerCase()) {
        discrepancies.push({
          field: 'SHA256_BASE',
          message: 'Hashes base não coincidem',
          blockValue: blockData.SHA256_BASE,
          apiValue: apiData.sha256_base
        });
      }
    }

    return {
      valid: discrepancies.length === 0,
      discrepancies: discrepancies,
      summary: {
        totalFieldsCompared: Object.keys(fieldMapping).length,
        fieldsWithDiscrepancies: discrepancies.length,
        allFieldsMatch: discrepancies.length === 0
      }
    };
  },

formatComparisonResult(comparison) {
  if (comparison.valid) {
    return '<div style="text-align: left; line-height: 1.4; width: 100%;">' +
      '<div style="margin: 8px 0; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 6px; font-size: 12px; color: var(--muted); border-left: 3px solid var(--success); text-align: left;">' +
      `<div style="margin-bottom: 4px;"><strong>Campos verificados:</strong> ${comparison.summary.totalFieldsCompared}</div>` +
      `<div style="margin-bottom: 4px;"><strong>Discrepâncias:</strong> ${comparison.summary.fieldsWithDiscrepancies}</div>` +
      '<div><strong>Status:</strong> Todas as informações coincidem</div>' +
      '</div>' +
      '<div style="color: var(--success); font-size: 11px; margin-top: 8px; text-align: left; padding: 6px 10px; background: rgba(102,224,123,0.08); border-radius: 4px; border: 1px solid rgba(102,224,123,0.2);">' +
      '<i class="fa-solid fa-shield-check" style="margin-right: 6px;"></i>' +
      '✓ Documento íntegro e autenticado' +
      '</div>' +
      '</div>';
  } else {
    const discrepancyMessages = comparison.discrepancies.map(d => 
      `<div style="margin: 4px 0; padding: 6px 8px; background: rgba(255,107,107,0.05); border-radius: 4px; border-left: 2px solid var(--danger); font-size: 11px; font-family: ui-monospace, monospace;">` +
      `<strong style="color: var(--danger);">${d.field}:</strong> Bloco="${d.blockValue}" ≠ API="${d.apiValue}"` +
      '</div>'
    ).join('');
    
    return '<div style="text-align: left; line-height: 1.4; width: 100%;">' +
      '<div style="margin: 8px 0; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 6px; font-size: 12px; color: var(--muted); border-left: 3px solid var(--danger); text-align: left;">' +
      `<div style="margin-bottom: 4px;"><strong>Campos verificados:</strong> ${comparison.summary.totalFieldsCompared}</div>` +
      `<div style="margin-bottom: 4px;"><strong>Discrepâncias encontradas:</strong> ${comparison.discrepancies.length}</div>` +
      '<div><strong>Status:</strong> Dados inconsistentes</div>' +
      '</div>' +
      '<div style="margin: 12px 0 8px 0; font-size: 12px; color: var(--muted); font-weight: 600;">' +
      '<i class="fa-solid fa-triangle-exclamation" style="color: var(--danger); margin-right: 6px;"></i>' +
      'Detalhes das discrepâncias:' +
      '</div>' +
      '<div class="discrepancies-container">' +
      discrepancyMessages +
      '</div>' +
      '<div style="color: var(--danger); font-size: 11px; margin-top: 8px; text-align: left; padding: 6px 10px; background: rgba(255,107,107,0.08); border-radius: 4px; border: 1px solid rgba(255,107,107,0.2);">' +
      '<i class="fa-solid fa-shield-exclamation" style="margin-right: 6px;"></i>' +
      '⚠️ Possível alteração ou corrupção no documento' +
      '</div>' +
      '</div>';
  }
}

};

/* ===== PDFProcessor (refatorado para Worker inline) ===== */
const PDFProcessor = {
  worker: null,
  workerUrl: null,
  ready: false,

  _makeWorkerBlobUrl() {
    // COLE AQUI O CÓDIGO DO pdf-worker.js COMO STRING (entre crases)
    // Para manter o snippet enxuto aqui, vamos montar dinamicamente:
    const workerCode = `

${/* <<< INÍCIO DO CÓDIGO DO WORKER - cole exatamente o conteúdo de pdf-worker.js entre estas crases >>> */''}

${(/* copia literal do pdf-worker.js acima: */ '')}
`; // <- substitua por código do worker se preferir arquivo separado

    // Se você quiser evitar copiar manualmente: em produção, salve pdf-worker.js e crie Worker('/path/pdf-worker.js')
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
  },

async initWorker() {
  if (!this.worker) {
    this.worker = new Worker('assets/js/pdf-worker.js');
  }
  return this.worker;
},


  async processPDF(file, { onProgress = null, chunkSize } = {}) {
    Logger.info(`Processando PDF via Worker: ${file.name}`, { size: file.size });

    // Attempt worker
    try {
      const arrayBuffer = await file.arrayBuffer();
      const worker = await this.initWorker();

      return await new Promise((resolve, reject) => {
        const tid = setTimeout(() => {
          // Timeout -> terminate worker and reject
          try { if (this.worker) { this.worker.terminate(); URL.revokeObjectURL(this.workerUrl); } } catch (e) {}
          this.worker = null;
          reject(new Error('Timeout no processamento do PDF (60s)'));
        }, 60000); // 60s timeout - você pode ajustar

        const handleMessage = (ev) => {
          const d = ev.data || {};
          if (d.type === 'progress') {
            if (typeof onProgress === 'function') onProgress(d.progress);
          } else if (d.type === 'result') {
            clearTimeout(tid);
            worker.removeEventListener('message', handleMessage);
            resolve(d.result);
          } else if (d.type === 'error') {
            clearTimeout(tid);
            worker.removeEventListener('message', handleMessage);
            reject(new Error(d.error || 'Erro desconhecido no worker'));
          }
        };

        worker.addEventListener('message', handleMessage);

        worker.onerror = (err) => {
          clearTimeout(tid);
          worker.removeEventListener('message', handleMessage);
          reject(new Error(`Worker error: ${err && err.message ? err.message : String(err)}`));
        };

        // Post with transferable ArrayBuffer to avoid copy
        try {
          worker.postMessage({ type: 'processPDF', fileBuffer: arrayBuffer, chunkSize }, [arrayBuffer]);
        } catch (postErr) {
          // Some browsers disallow re-using the ArrayBuffer after transfer; that's expected.
          // Reject and let caller fallback.
          clearTimeout(tid);
          worker.removeEventListener('message', handleMessage);
          reject(postErr);
        }
      });
    } catch (workerErr) {
      Logger.warn('Worker indisponível — usando fallback síncrono', { error: workerErr.message || workerErr });
      return await this.processPDFFallback(file);
    }
  },

  // Fallback (sync, no worker) — mantém compatibilidade
  async processPDFFallback(file) {
    Logger.warn('Usando fallback síncrono para processamento de PDF');

    const arrayBuffer = await file.arrayBuffer();

    // hash with (uses subtle.digest - good enough for fallback)
    const digest = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashWith = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');

    // remove block
    const { found, blockBytes, cleanedBuffer } = (function removeValidationBlockBytesLocal(arrayBuffer) {
      const startMarker = new TextEncoder().encode('% === VALIDATION BLOCK ===');
      const endMarker = new TextEncoder().encode('% === END VALIDATION BLOCK ===');
      const bytes = new Uint8Array(arrayBuffer);

      function indexOfSubarray(hay, needle, from = 0) {
        outer: for (let i = from; i <= hay.length - needle.length; i++) {
          for (let j = 0; j < needle.length; j++) {
            if (hay[i + j] !== needle[j]) continue outer;
          }
          return i;
        }
        return -1;
      }

      const startIdx = indexOfSubarray(bytes, startMarker, 0);
      if (startIdx === -1) return { found: false, blockBytes: null, cleanedBuffer: arrayBuffer };

      const endIdx = indexOfSubarray(bytes, endMarker, startIdx + startMarker.length);
      const endPos = (endIdx === -1) ? bytes.length : (endIdx + endMarker.length);

      const blockBytes = bytes.slice(startIdx, endPos);
      const before = bytes.slice(0, startIdx);
      const after = bytes.slice(endPos);
      const cleaned = new Uint8Array(before.length + after.length);
      cleaned.set(before, 0);
      cleaned.set(after, before.length);

      return { found: true, blockBytes, cleanedBuffer: cleaned.buffer };
    })(arrayBuffer);

    if (!found) {
      return {
        hashWith,
        hashWithout: null,
        blockData: null,
        blockFound: false
      };
    }

    // parse block
    const parseValidationBlockLocal = (blockBytes) => {
      try {
        const text = new TextDecoder().decode(blockBytes);
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const fields = {};
        const EXCLUDE_KEYS = new Set(['=== VALIDATION BLOCK ===', '=== END VALIDATION BLOCK ===', 'HASH_ENDPOINT']);
        lines.forEach(line => {
          if (!line.startsWith('%')) return;
          const content = line.replace(/^%\s?/, '');
          const separator = content.indexOf(':');
          if (separator === -1) {
            fields[content] = '';
          } else {
            const key = content.substring(0, separator).trim();
            const value = content.substring(separator + 1).trim();
            if (!EXCLUDE_KEYS.has(key)) fields[key] = value;
          }
        });
        return fields;
      } catch (err) {
        return { error: 'Falha ao decodificar bloco' };
      }
    };

    const blockData = parseValidationBlockLocal(blockBytes);
    const digest2 = await crypto.subtle.digest('SHA-256', cleanedBuffer);
    const hashWithout = Array.from(new Uint8Array(digest2)).map(b => b.toString(16).padStart(2, '0')).join('');

    return {
      hashWith,
      hashWithout,
      blockData,
      blockFound: true,
      cleanedBuffer
    };
  },

  destroy() {
    try {
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
      if (this.workerUrl) {
        URL.revokeObjectURL(this.workerUrl);
        this.workerUrl = null;
      }
      this.ready = false;
    } catch (err) {
      // ignore
    }
  }
};

/* --- Gerenciador de UI --- */
const UIManager = {

setLoading(loading) {
    STATE.processing = loading;
    
    if (loading) {
      // Desabilitar apenas durante o processamento
      btnQuery.disabled = true;
      btnQuery.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Validando';
      dropZone.style.opacity = '0.6';
      dropZone.style.pointerEvents = 'none';
    } else {
      // SEMPRE reabilitar quando não estiver processando
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
  
  // CORREÇÃO: Permitir HTML e garantir largura total
  compareText.innerHTML = '<div style="width: 100%;">' + message + '</div>';
  compareText.style.textAlign = 'left';
  
  compareBadge.style.display = 'inline-flex';
},
  
populateMetaList(data) {
    console.log('🎯 populateMetaList CHAMADA - dados:', data);
    
    metaList.innerHTML = '';
    
    if (!data || Object.keys(data).length === 0) {
        console.log('❌ Dados vazios ou não fornecidos');
        return;
    }
    
    // ⭐⭐ CORREÇÃO: Usar as chaves em MAIÚSCULAS que vêm do bloco de validação ⭐⭐
    const fieldOrder = [
        'ENTITY', 'CREATOR_UA', 'TIMESTAMP_BR', 'SHA256_BASE', 
        'BYTES_BASE', 'MB_BASE', 'CHAR_COUNT_BASE', 'BYTES_FINAL', 
        'MB_FINAL', 'CHAR_COUNT_FINAL', 'EXTRA', 'BRAND'
    ];
    
    // Mapeamento de nomes para exibição (já está correto)
    const displayNames = {
        'ENTITY': 'ENTITY',
        'CREATOR_UA': 'CREATOR_UA',
        'TIMESTAMP_BR': 'TIMESTAMP_BR',
        'SHA256_BASE': 'SHA256_BASE',
        'BYTES_BASE': 'BYTES_BASE',
        'MB_BASE': 'MB_BASE',
        'CHAR_COUNT_BASE': 'CHAR_COUNT_BASE',
        'BYTES_FINAL': 'BYTES_FINAL',
        'MB_FINAL': 'MB_FINAL',
        'CHAR_COUNT_FINAL': 'CHAR_COUNT_FINAL',
        'EXTRA': 'EXTRA',
        'BRAND': 'BRAND'
    };

    // ⭐⭐ CORREÇÃO: Usar grupos com chaves em MAIÚSCULAS ⭐⭐
    const fieldGroups = [
        ['ENTITY', 'CREATOR_UA'],
        ['TIMESTAMP_BR', 'SHA256_BASE'],
        ['BYTES_BASE', 'BYTES_FINAL'],
        ['MB_BASE', 'MB_FINAL'],
        ['CHAR_COUNT_BASE', 'CHAR_COUNT_FINAL'],
        ['EXTRA', 'BRAND']
    ];

    let itemsCreated = 0;

    fieldGroups.forEach(group => {
        const groupContainer = document.createElement('div');
        groupContainer.className = 'meta-group';
        
        group.forEach(key => {
            if (!(key in data)) {
                console.log(`➡️ Campo ${key} não encontrado nos dados`);
                return;
            }
            
            const value = data[key];
            const displayKey = displayNames[key] || key;
            const icon = iconMap[displayKey] || 'fa-tag';
            
            console.log(`✅ Criando item: ${displayKey} = ${value}`);
            
            const itemContainer = document.createElement('div');
            itemContainer.className = 'meta-item-container';
            
            itemContainer.innerHTML = `
                <div class="meta-icon">
                    <i class="fa-solid ${icon}"></i>
                </div>
                <div class="meta-item">
                    <div class="meta-item-header">
                        <div class="key">${displayKey.replace(/_/g, ' ')}</div>
                    </div>
                    <div class="meta-item-content">
                        <div class="val">${value}</div>
                    </div>
                </div>
            `;
            
            groupContainer.appendChild(itemContainer);
            itemsCreated++;
        });
        
        if (groupContainer.children.length > 0) {
            metaList.appendChild(groupContainer);
        }
    });
    
    console.log('🎯 populateMetaList FINALIZADA - elementos criados:', itemsCreated);
    
    // Mostrar a metaCard
    show(metaCard);
    
    // Alinhar altura após renderizar metadados
    setTimeout(alignResultGridHeight, 100);
},

resetUI() {
  // CORREÇÃO: Esconder a seção de resultados completamente
  hide(resultGrid);
  hide(metaCard);
  metaList.innerHTML = '';
  hashWithEl.textContent = '—';
  hashWithoutEl.textContent = '—';
  hashRegisteredEl.textContent = '—';
  compareText.textContent = '';
  compareBadge.className = 'badge hidden';
  
  // REMOVER o log daqui para evitar duplicação
  // this.showInfo('Pronto para validar');
  
  // NOVO: Mostrar seção de apresentação
  ProjectIntroManager.show();
  
  updateLayoutState();
  
  // CORREÇÃO: Reabilitar o botão Validar APENAS quando limpar
  btnQuery.disabled = false;
  btnQuery.style.cssText = ''; // ← REMOVER ESTILOS INLINE
  btnQuery.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Validar';
  console.log('Botão reabilitado no reset');
  
  // ATUALIZAÇÃO: Atualizar estado do layout
  UIStateManager.updateLayoutState();
},

    showResults() {
    show(resultGrid);
	show(metaCard);
   // show(logCard);
	// NOVO: Esconder seção de apresentação
  ProjectIntroManager.hide();
  updateLayoutState(); 
  
    // Alinhar altura após um pequeno delay para o DOM renderizar
  setTimeout(alignResultGridHeight, 100);
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
  'BRAND': 'fa-copyright',
  // Adicionar mapeamento para campos da API
  'entity': 'fa-building-columns',
  'creator_ua': 'fa-user-pen',
  'timestamp_br': 'fa-clock',
  'sha256_base': 'fa-fingerprint',
  'bytes_base': 'fa-database',
  'mb_base': 'fa-weight-hanging',
  'char_count_base': 'fa-font',
  'bytes_final': 'fa-database',
  'mb_final': 'fa-weight-hanging',
  'char_count_final': 'fa-font',
  'extra': 'fa-tag',
  'brand': 'fa-copyright'
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
  fileInput.value = '';
  STATE.currentFile = null;
  STATE.currentHash = '';
  STATE.validationData = null;
  STATE.blockData = null; 
  
  // Limpar todos os logs - CORREÇÃO
  STATE.logs = [];
  
  // NOVO: Limpar logs no modal de forma consistente
  if (window.logModalSystem && window.logModalSystem.getInstance()) {
    window.logModalSystem.clearLogs();
  }
  
  // Atualizar display de logs
  Logger.updateLogDisplay();
  
  UIManager.resetUI();
  enableClearButton();
  
  // REMOVER completamente qualquer log aqui para evitar duplicação
});

btnClear.addEventListener('click', () => {
  externalHashInput.value = '';
  STATE.currentFile = null;
  STATE.currentHash = '';
  STATE.validationData = null;
  
  // Limpar todos os logs
  STATE.logs = [];
  
  // NOVO: Resetar o contador de logs no botão
  if (window.logModalSystem && window.logModalSystem.getInstance()) {
    window.logModalSystem.clearLogs();
  }
  
  // Atualizar display de logs
  Logger.updateLogDisplay();
  
  UIManager.resetUI();
  enableClearButton();
  
  // REMOVER: Não logar mais aqui para evitar duplicação
  // Logger.info('Interface reiniciada');
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
  
  // CORREÇÃO: Desabilitar o botão IMEDIATAMENTE ao clicar
  console.log('Desabilitando botão...');
  btnQuery.disabled = true;
  btnQuery.style.cssText = 'cursor: not-allowed !important; opacity: 0.7 !important; pointer-events: none !important;';
  btnQuery.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Validando';
  
  console.log('Botão desabilitado:', btnQuery.disabled);
  
  validateHash(hash);
});

/* Upload de arquivo - COM ESTIMATIVA DE TEMPO */
async function handleFileUpload(file) {
  if (file.type !== 'application/pdf') {
    UIManager.showError('Por favor, selecione um arquivo PDF');
    return;
  }
  
  if (file.size > 500 * 1024 * 1024) {
    UIManager.showError('Arquivo muito grande. Tamanho máximo: 50MB');
    return;
  }
  
  Logger.info(`Upload de arquivo: ${file.name}`, { size: file.size });
  UIManager.setLoading(true);
  
  // CORREÇÃO: Variáveis para cálculo de estimativa
  let startTime = Date.now();
  let lastProcessed = 0;
  let lastTime = startTime;
  
  // CORREÇÃO: Mostrar feedback inicial com estimativa
  const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
  const estimatedTime = Math.max(1, Math.ceil(fileSizeMB / 5)); // Estimativa: 5MB por segundo
  UIManager.showInfo(`Processando PDF (${fileSizeMB} MB) - Estimativa: ~${estimatedTime}s`);
  
  try {
    // CORREÇÃO CRÍTICA: Resetar estado COMPLETAMENTE antes de qualquer processamento
    STATE.currentFile = file;
    STATE.currentHash = '';
    STATE.validationData = null;
    STATE.blockData = null;
    STATE.processing = true;
    
    // CORREÇÃO: Resetar também a interface visual
    UIManager.updateHashDisplays({
      hashWith: '—',
      hashWithout: '—', 
      registeredHash: '—'
    });
    
    // CORREÇÃO: Limpar resultado anterior
    compareText.textContent = '';
    compareBadge.className = 'badge hidden';
    
    // CORREÇÃO: Garantir que o botão está habilitado
    btnQuery.disabled = false;
    btnQuery.style.cssText = '';
    btnQuery.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Validar';
    
    // Mostrar resultados (mas com estado limpo)
    UIManager.showResults();
    
    // CORREÇÃO: Configurar listener de progresso com estimativa
    let progressListener = null;
    const worker = await PDFProcessor.initWorker();
    
    progressListener = (event) => {
      const data = event.data || {};
      if (data.type === 'progress') {
        const percent = data.progress;
        const stage = data.stage || 'Processando';
        const processedMB = (data.processed / (1024 * 1024)).toFixed(1);
        const totalMB = (data.total / (1024 * 1024)).toFixed(1);
        
        // CORREÇÃO: Cálculo de estimativa de tempo restante
        const currentTime = Date.now();
        const elapsedSeconds = (currentTime - startTime) / 1000;
        
        let timeRemaining = '—';
        if (percent > 5 && elapsedSeconds > 0.5) { // Esperar um pouco para cálculo estável
          const processedSinceLast = data.processed - lastProcessed;
          const timeSinceLast = (currentTime - lastTime) / 1000;
          
          if (processedSinceLast > 0 && timeSinceLast > 0) {
            const speedMBps = (processedSinceLast / (1024 * 1024)) / timeSinceLast;
            const remainingMB = (data.total - data.processed) / (1024 * 1024);
            const estimatedSeconds = Math.max(1, Math.ceil(remainingMB / speedMBps));
            timeRemaining = `~${estimatedSeconds}s`;
          }
          
          lastProcessed = data.processed;
          lastTime = currentTime;
        }
        
        // CORREÇÃO: Mensagem mais compacta e informativa
        UIManager.showInfo(`${stage} ${percent}% • ${processedMB}/${totalMB}MB • ${timeRemaining}`);
        
        // CORREÇÃO: Atualizar barra de progresso se existir
        updateProgressBar(percent);
      }
    };
    
    worker.addEventListener('message', progressListener);
    
    // CORREÇÃO: Usar chunk size maior para mais velocidade
    const result = await PDFProcessor.processPDF(file, {
      onProgress: (percent) => {
        // Fallback para progresso (já tratado pelo listener acima)
      },
      chunkSize: 2 * 1024 * 1024 // 2MB chunks para maior velocidade
    });
    
    // CORREÇÃO: Remover listener após conclusão
    if (progressListener) {
      worker.removeEventListener('message', progressListener);
    }
    
    // CORREÇÃO: Feedback de conclusão rápida
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    UIManager.showSuccess(`Processamento concluído em ${totalTime}s`);
    
    // ... resto do código permanece igual
    STATE.currentHash = result.hashWithout || result.hashWith;
    STATE.blockData = result.blockData;
    
	// ⭐⭐ NOVO: MOSTRAR METADADOS IMEDIATAMENTE SE HOUVER BLOCO ⭐⭐
if (result.blockFound && result.blockData) {
  UIManager.populateMetaList(result.blockData);
}
	
 // ⭐⭐ NOVO: MOSTRAR HASH CALCULADO IMEDIATAMENTE ⭐⭐
UIManager.updateHashDisplays({
  hashWith: result.hashWith,
  hashWithout: result.hashWithout || '— (sem bloco)',
  registeredHash: '— (validando...)'
});

// Feedback visual imediato
UIManager.showSuccess('PDF processado - calculando hash...');

// Pequeno delay para usuário ver o feedback
await new Promise(resolve => setTimeout(resolve, 300));

UIManager.showSuccess('Bloco de validação processado');
	
	
   if (result.blockFound && result.blockData) {
      // Preencher metadados do bloco do PDF
      UIManager.populateMetaList(result.blockData);
      
      // Pequeno delay para usuário ver o feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      
      UIManager.showSuccess('Bloco de validação processado');
      
      // Buscar automaticamente na API usando o hash do bloco
      const hashFromBlock = result.blockData.SHA256_BASE;
      if (hashFromBlock && /^[0-9a-f]{64}$/i.test(hashFromBlock)) {
        // CORREÇÃO: Limpar input antes de preencher
        externalHashInput.value = '';
        
        // Pequeno delay para garantir limpeza
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Preencher o input com o hash do bloco
        externalHashInput.value = hashFromBlock;
        
        // CORREÇÃO: Feedback rápido antes da validação
        UIManager.showInfo('Validando na API...');
        
        // CORREÇÃO: Delay mínimo antes da validação automática
        setTimeout(async () => {
          try {
            await validateHash(hashFromBlock);
          } catch (error) {
            Logger.error('Erro na validação automática', { error: error.message });
          }
        }, 200);
      } else {
        UIManager.updateValidationResult(
          false,
          '<strong style="color: var(--danger); display: block; margin-bottom: 12px; font-size: 14px;">✗ BLOCO DE VALIDAÇÃO INVÁLIDO</strong>' +
          '<div style="margin: 8px 0; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px; font-size: 12px; color: var(--muted); border-left: 4px solid var(--danger); text-align: left; width: 100%;">' +
          `<div style="margin-bottom: 6px;"><strong>Arquivo:</strong> ${file.name}</div>` +
          `<div style="margin-bottom: 6px;"><strong>Tamanho:</strong> ${(file.size / (1024 * 1024)).toFixed(2)} MB</div>` +
          '<div><strong>Status:</strong> Hash do bloco é inválido</div>' +
          '</div>' +
          '<div style="color: var(--danger); font-size: 11px; margin-top: 12px; text-align: left; padding: 8px 12px; background: rgba(255,107,107,0.08); border-radius: 6px; border: 1px solid rgba(255,107,107,0.2); width: 100%;">' +
          '<i class="fa-solid fa-file-circle-xmark" style="margin-right: 8px;"></i>' +
          'O bloco de validação contém um hash inválido' +
          '</div>'
        );
        UIManager.showError('Hash do bloco de validação é inválido');
      }
      
    } else {
      // Esconder metadados se não há bloco
      hide(metaCard);
      UIManager.updateValidationResult(
        false,
        '<div style="text-align: left; line-height: 1.4; width: 100%;">' +
        '<div style="margin: 8px 0; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 6px; font-size: 12px; color: var(--muted); border-left: 3px solid var(--danger); text-align: left;">' +
        `<div style="margin-bottom: 4px;"><strong>Arquivo:</strong> ${file.name}</div>` +
        `<div style="margin-bottom: 4px;"><strong>Tamanho:</strong> ${(file.size / (1024 * 1024)).toFixed(2)} MB</div>` +
        '<div><strong>Status:</strong> Sem bloco de validação</div>' +
        '</div>' +
        '<div style="color: var(--danger); font-size: 11px; margin-top: 8px; text-align: left; padding: 6px 10px; background: rgba(255,107,107,0.08); border-radius: 4px; border: 1px solid rgba(255,107,107,0.2);">' +
        '<i class="fa-solid fa-file-circle-xmark" style="margin-right: 6px;"></i>' +
        'Este PDF não contém um bloco de validação VÆLORÜM' +
        '</div>' +
        '</div>'
      );
      UIManager.showInfo('Nenhum bloco de validação detectado');
    }
    
  } catch (error) {
    UIManager.updateValidationResult(
      false,
      '<div style="text-align: left; line-height: 1.4;">' +
      '<strong style="color: var(--danger); display: block; margin-bottom: 8px;">✗ ERRO NO PROCESSAMENTO</strong>' +
      '<div style="margin: 8px 0; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 6px; font-size: 12px; color: var(--muted); border-left: 3px solid var(--danger); text-align: left;">' +
      `<div><strong>Arquivo:</strong> ${file.name}</div>` +
      `<div><strong>Erro:</strong> ${error.message}</div>` +
      '<div><strong>Status:</strong> Falha no processamento</div>' +
      '</div>' +
      '<div style="color: var(--danger); font-size: 11px; margin-top: 8px; text-align: left;">Não foi possível processar o arquivo PDF</div>' +
      '</div>'
    );
    UIManager.showError('Erro ao processar arquivo');
    Logger.error('Falha no processamento', { error: error.message });
  } finally {
    // CORREÇÃO CRÍTICA: Resetar o file input para permitir selecionar o mesmo arquivo novamente
    fileInput.value = '';
    
    // CORREÇÃO: Resetar barra de progresso se existir
    resetProgressBar();
    
    // CORREÇÃO: Sempre reabilitar o botão após o processamento
    UIManager.setLoading(false);
    STATE.processing = false;
    btnQuery.disabled = false;
    btnQuery.style.cssText = '';
    btnQuery.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Validar';
    enableClearButton();
  }
}


// CORREÇÃO: Funções auxiliares para barra de progresso (opcional)
function updateProgressBar(percent) {
  // Se você tiver uma barra de progresso visual, atualize-a aqui
  const progressBar = document.getElementById('progressBar');
  if (progressBar) {
    progressBar.style.width = percent + '%';
    progressBar.textContent = percent + '%';
  }
}

function resetProgressBar() {
  const progressBar = document.getElementById('progressBar');
  if (progressBar) {
    progressBar.style.width = '0%';
    progressBar.textContent = '';
  }
}
/* Validação via API - VERSÃO CORRIGIDA COM METADADOS */
async function validateHash(hash) {
  STATE.currentFile = null;
  
  UIManager.setLoading(true);
  UIManager.showInfo('Validando hash...');
  UIManager.showResults();
  
  try {
    const result = await API.validateHash(hash);
    
    if (result && result.valid) {
      // Hash encontrado na API - mostrar todos os dados
      const apiData = result.data;
      const validationData = result.validation;
      
      // CORREÇÃO: Atualizar todos os hashes da API
      UIManager.updateHashDisplays({
        hashWith: apiData.hash_final || '—',
        hashWithout: validationData.sha256_base || '—',
        registeredHash: validationData.sha256_base || hash
      });
      
      // Preencher metadados da API
      // UIManager.populateMetaList(validationData);
      UIManager.showSuccess('Hash encontrado no registro VÆLORÜM');
      
      // Se temos um arquivo carregado, fazer comparação completa
      if (STATE.currentFile && STATE.blockData) {
        const comparison = ValidationComparator.compareWithBlock(validationData, STATE.blockData);
        
        UIManager.updateValidationResult(
          comparison.valid,
          ValidationComparator.formatComparisonResult(comparison)
        );
        
        if (!comparison.valid) {
          Logger.warn('Discrepâncias encontradas na validação', comparison);
        } else {
          UIManager.updateValidationResult(
            true,
            '<div style="text-align: left; line-height: 1.4;">' +
            '<strong style="color: var(--success); display: block; margin-bottom: 8px;">✓ VALIDAÇÃO COMPLETA BEM-SUCEDIDA</strong>' +
            '<div style="margin: 8px 0; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 6px; font-size: 12px; color: var(--muted); border-left: 3px solid var(--success); text-align: left;">' +
            `<div><strong>Entidade:</strong> ${validationData.entity || 'N/A'}</div>` +
            `<div><strong>Data de criação:</strong> ${validationData.timestamp_br || 'N/A'}</div>` +
            `<div><strong>Tamanho do documento:</strong> ${validationData.mb_base || 'N/A'} MB</div>` +
            `<div><strong>Caracteres:</strong> ${validationData.char_count_base || 'N/A'}</div>` +
            `<div><strong>Hash canônico:</strong> ${validationData.sha256_base ? validationData.sha256_base.substring(0, 24) + '...' : 'N/A'}</div>` +
            '</div>' +
            '<div style="color: var(--success); font-size: 11px; margin-top: 8px; text-align: left;">✓ Documento íntegro e autenticado</div>' +
            '</div>'
          );
          Logger.info('Validação completa bem-sucedida', comparison.summary);
        }
      } else {
UIManager.updateValidationResult(
  true,
  '<div style="text-align:left; width: 100%;">' +
  '<div style="display: flex; align-items: center; margin-bottom: 16px; padding: 12px; background: linear-gradient(135deg, rgba(255,182,193,0.15), rgba(173,216,230,0.15)); border-radius: 8px; border: 1px solid rgba(255,182,193,0.4);">' +
  '<i class="fa-solid fa-shield-check" style="color: #9370DB; font-size: 24px; margin-right: 12px;"></i>' +
  '<div>' +
  '<strong style="background: linear-gradient(135deg, #FF69B4, #4169E1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size:16px; display: block;">DOCUMENTO VÁLIDO E REGISTRADO</strong>' +
  '<span style="color: var(--muted); font-size: 13px;">Integridade verificada e autenticada</span>' +
  '</div>' +
  '</div>' +
  
  '<div style="margin: 16px 0; padding: 16px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(255,182,193,0.3);">' +
  
  '<div style="display: flex; align-items: center; margin-bottom: 16px; padding: 8px 12px; background: linear-gradient(135deg, rgba(255,182,193,0.1), rgba(173,216,230,0.1)); border-radius: 6px;">' +
  '<i class="fa-solid fa-circle-info" style="color: #9370DB; margin-right: 8px;"></i>' +
  '<span style="background: linear-gradient(135deg, #FF69B4, #4169E1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 13px; font-weight: 600;">INFORMAÇÕES DO REGISTRO</span>' +
  '</div>' +
  
  '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">' +
  '<div style="padding: 10px; background: linear-gradient(135deg, rgba(255,182,193,0.08), rgba(173,216,230,0.08)); border-radius: 6px; border-left: 3px solid #9370DB;">' +
  '<div style="font-size: 11px; color: var(--muted); margin-bottom: 4px;">ENTIDADE</div>' +
  '<div style="font-size: 13px; color: #9370DB; font-weight: 600;">' + (validationData.entity || 'N/A') + '</div>' +
  '</div>' +
  '<div style="padding: 10px; background: linear-gradient(135deg, rgba(255,182,193,0.08), rgba(173,216,230,0.08)); border-radius: 6px; border-left: 3px solid #9370DB;">' +
  '<div style="font-size: 11px; color: var(--muted); margin-bottom: 4px;">DATA CRIAÇÃO</div>' +
  '<div style="font-size: 13px; color: #9370DB; font-weight: 600;">' + (validationData.timestamp_br || 'N/A') + '</div>' +
  '</div>' +
  '</div>' +
  
  '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">' +
  '<div style="padding: 10px; background: linear-gradient(135deg, rgba(255,182,193,0.08), rgba(173,216,230,0.08)); border-radius: 6px; border-left: 3px solid #9370DB;">' +
  '<div style="font-size: 11px; color: var(--muted); margin-bottom: 4px;">TAMANHO</div>' +
  '<div style="font-size: 13px; color: #9370DB; font-weight: 600;">' + (validationData.mb_base || 'N/A') + ' MB</div>' +
  '</div>' +
  '<div style="padding: 10px; background: linear-gradient(135deg, rgba(255,182,193,0.08), rgba(173,216,230,0.08)); border-radius: 6px; border-left: 3px solid #9370DB;">' +
  '<div style="font-size: 11px; color: var(--muted); margin-bottom: 4px;">HASH CANÔNICO</div>' +
  '<div style="font-size: 13px; color: #9370DB; font-weight: 600;">' + (validationData.sha256_base ? validationData.sha256_base.substring(0, 24) + '...' : 'N/A') + '</div>' +
  '</div>' +
  '</div>' +
  '</div>' +
  
  '<div style="display: flex; gap: 8px; margin-top: 12px;">' +
  '<div style="flex: 1; padding: 10px; background: linear-gradient(135deg, rgba(255,182,193,0.1), rgba(173,216,230,0.1)); border-radius: 6px; text-align: center; border: 1px solid rgba(255,182,193,0.3);">' +
  '<i class="fa-solid fa-file-shield" style="color: #9370DB; margin-right: 6px;"></i>' +
  '<span style="color: #9370DB; font-size: 12px; font-weight: 600;">REGISTRO VÁLIDO</span>' +
  '</div>' +
  '<div style="flex: 1; padding: 10px; background: linear-gradient(135deg, rgba(255,182,193,0.1), rgba(173,216,230,0.1)); border-radius: 6px; text-align: center; border: 1px solid rgba(255,182,193,0.3);">' +
  '<i class="fa-solid fa-database" style="color: #9370DB; margin-right: 6px;"></i>' +
  '<span style="color: #9370DB; font-size: 12px; font-weight: 600;">API CONFIRMADA</span>' +
  '</div>' +
  '</div>' +
  '</div>'
);
Logger.info('Consulta de hash realizada com sucesso', validationData);
      }
      
    } else {
      // Hash não encontrado - resetar hashes
      UIManager.updateHashDisplays({
        hashWith: '—',
        hashWithout: '—',
        registeredHash: hash
      });
      
      UIManager.updateValidationResult(
        false,
        '✗ Hash não encontrado no registro VÆLORÜM'
      );
      UIManager.showInfo(result?.message || 'Hash não consta no registro');
    }
    
  } catch (error) {
    // CORREÇÃO CRÍTICA: Garantir que os metadados sejam exibidos quando houver bloco
    console.log('DEBUG: Erro na API, verificando STATE.blockData:', STATE.blockData);
    
    if (STATE.blockData && Object.keys(STATE.blockData).length > 0) {
      // ⭐⭐ CORREÇÃO: MOSTRAR METADADOS DO BLOCO SEMPRE QUE EXISTIREM ⭐⭐
      console.log('DEBUG: Exibindo metadados do bloco:', STATE.blockData);
      UIManager.populateMetaList(STATE.blockData);
      
      // ⭐⭐ VALIDAÇÃO LOCAL: Comparar hash calculado com hash do bloco ⭐⭐
      const blockHash = STATE.blockData.SHA256_BASE;
      const calculatedHash = STATE.currentHash; // Já calculado durante o processamento
      
      console.log('DEBUG: Hash do bloco:', blockHash);
      console.log('DEBUG: Hash calculado:', calculatedHash);
      
      const hashesMatch = blockHash && calculatedHash && 
                         blockHash.toLowerCase() === calculatedHash.toLowerCase();
      
      console.log('DEBUG: Hashes coincidem?', hashesMatch);
      
      if (hashesMatch) {
        // Documento íntegro - validação local bem-sucedida
		
		  // ⭐⭐ ATUALIZAR OS HASHES NA INTERFACE ⭐⭐
  UIManager.updateHashDisplays({
    hashWithout: calculatedHash, // Hash sem bloco (já calculado)
    registeredHash: blockHash    // Hash do bloco (SHA256_BASE)
  });
		
 UIManager.updateValidationResult(
    true,
    '<div style="text-align:left; width: 100%;">' +
    '<div style="display: flex; align-items: center; margin-bottom: 16px; padding: 12px; background: linear-gradient(135deg, rgba(255,182,193,0.15), rgba(173,216,230,0.15)); border-radius: 8px; border: 1px solid rgba(255,182,193,0.4);">' +
    '<i class="fa-solid fa-shield-check" style="color: #9370DB; font-size: 24px; margin-right: 12px;"></i>' +
    '<div>' +
    '<strong style="background: linear-gradient(135deg, #FF69B4, #4169E1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size:16px; display: block;">VALIDAÇÃO LOCAL BEM-SUCEDIDA</strong>' +
    '<span style="color: var(--muted); font-size: 13px;">Documento autenticado e íntegro</span>' +
    '</div>' +
    '</div>' +
    
    '<div style="margin: 16px 0; padding: 16px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(255,182,193,0.3);">' +
    
    '<div style="display: flex; align-items: center; margin-bottom: 16px; padding: 8px 12px; background: linear-gradient(135deg, rgba(255,182,193,0.1), rgba(173,216,230,0.1)); border-radius: 6px;">' +
    '<i class="fa-solid fa-circle-info" style="color: #9370DB; margin-right: 8px;"></i>' +
    '<span style="background: linear-gradient(135deg, #FF69B4, #4169E1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 13px; font-weight: 600;">INFORMAÇÕES DO DOCUMENTO</span>' +
    '</div>' +
    
    '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">' +
    '<div style="padding: 10px; background: linear-gradient(135deg, rgba(255,182,193,0.08), rgba(173,216,230,0.08)); border-radius: 6px; border-left: 3px solid #9370DB;">' +
    '<div style="font-size: 11px; color: var(--muted); margin-bottom: 4px;">ENTIDADE</div>' +
    '<div style="font-size: 13px; color: #9370DB; font-weight: 600;">' + (STATE.blockData.ENTITY || 'N/A') + '</div>' +
    '</div>' +
    '<div style="padding: 10px; background: linear-gradient(135deg, rgba(255,182,193,0.08), rgba(173,216,230,0.08)); border-radius: 6px; border-left: 3px solid #9370DB;">' +
    '<div style="font-size: 11px; color: var(--muted); margin-bottom: 4px;">DATA CRIAÇÃO</div>' +
    '<div style="font-size: 13px; color: #9370DB; font-weight: 600;">' + (STATE.blockData.TIMESTAMP_BR || 'N/A') + '</div>' +
    '</div>' +
    '</div>' +
    
    '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">' +
    '<div style="padding: 10px; background: linear-gradient(135deg, rgba(255,182,193,0.08), rgba(173,216,230,0.08)); border-radius: 6px; border-left: 3px solid #9370DB;">' +
    '<div style="font-size: 11px; color: var(--muted); margin-bottom: 4px;">TAMANHO</div>' +
    '<div style="font-size: 13px; color: #9370DB; font-weight: 600;">' + (STATE.blockData.MB_BASE || 'N/A') + '</div>' +
    '</div>' +
    '<div style="padding: 10px; background: linear-gradient(135deg, rgba(255,182,193,0.08), rgba(173,216,230,0.08)); border-radius: 6px; border-left: 3px solid #9370DB;">' +
    '<div style="font-size: 11px; color: var(--muted); margin-bottom: 4px;">EXTRA</div>' +
    '<div style="font-size: 13px; color: #9370DB; font-weight: 600;">' + (STATE.blockData.EXTRA || 'N/A') + '</div>' +
    '</div>' +
    '</div>' +
    
    '<div style="padding: 12px; background: linear-gradient(135deg, rgba(255,182,193,0.12), rgba(173,216,230,0.12)); border-radius: 6px; border: 1px solid rgba(255,182,193,0.4);">' +
    '<div style="display: flex; align-items: flex-start;">' +
    '<i class="fa-solid fa-fingerprint" style="color: #9370DB; margin-right: 8px; margin-top: 2px;"></i>' +
    '<div style="flex: 1;">' +
    '<strong style="color: #9370DB; font-size: 13px; display: block; margin-bottom: 4px;">HASH CANÔNICO VERIFICADO</strong>' +
    '<div style="font-family: ui-monospace, monospace; font-size: 12px; color: #9370DB; word-break: break-all; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; margin-top: 6px;">' + 
    blockHash +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    
    '<div style="display: flex; gap: 8px; margin-top: 12px;">' +
    '<div style="flex: 1; padding: 10px; background: linear-gradient(135deg, rgba(255,182,193,0.1), rgba(173,216,230,0.1)); border-radius: 6px; text-align: center; border: 1px solid rgba(255,182,193,0.3);">' +
    '<i class="fa-solid fa-file-shield" style="color: #9370DB; margin-right: 6px;"></i>' +
    '<span style="color: #9370DB; font-size: 12px; font-weight: 600;">DOCUMENTO VÁLIDO</span>' +
    '</div>' +
    '<div style="flex: 1; padding: 10px; background: linear-gradient(135deg, rgba(255,182,193,0.1), rgba(173,216,230,0.1)); border-radius: 6px; text-align: center; border: 1px solid rgba(255,182,193,0.3);">' +
    '<i class="fa-solid fa-check-double" style="color: #9370DB; margin-right: 6px;"></i>' +
    '<span style="color: #9370DB; font-size: 12px; font-weight: 600;">INTEGRIDADE CONFIRMADA</span>' +
    '</div>' +
    '</div>' +
    '</div>'
  );
  UIManager.showSuccess('Validação local bem-sucedida - Documento íntegro');
        
      } else {
        // Documento corrompido - hashes não coincidem
		
		  // ⭐⭐ ATUALIZAR OS HASHES NA INTERFACE MESMO QUANDO INVÁLIDO ⭐⭐
  UIManager.updateHashDisplays({
    hashWithout: calculatedHash || '—',
    registeredHash: blockHash || '—'
  });
		
       UIManager.updateValidationResult(
    false,
    '<div style="text-align:left; width: 100%;">' +
    '<div style="display: flex; align-items: center; margin-bottom: 16px; padding: 12px; background: rgba(255,107,107,0.1); border-radius: 8px; border: 1px solid rgba(255,107,107,0.3);">' +
    '<i class="fa-solid fa-triangle-exclamation" style="color: var(--danger); font-size: 24px; margin-right: 12px;"></i>' +
    '<div>' +
    '<strong style="color:var(--danger); font-size:16px; display: block;">ALERTA DE INTEGRIDADE</strong>' +
    '<span style="color: var(--muted); font-size: 13px;">Possível alteração ou corrupção no documento</span>' +
    '</div>' +
    '</div>' +
    
    '<div style="margin: 16px 0; padding: 16px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(255,107,107,0.2);">' +
    '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">' +
    '<div style="padding: 10px; background: rgba(255,107,107,0.05); border-radius: 6px; border-left: 3px solid var(--danger);">' +
    '<div style="font-size: 11px; color: var(--muted); margin-bottom: 4px;">HASH CALCULADO</div>' +
    '<div style="font-family: ui-monospace, monospace; font-size: 12px; color: var(--danger); word-break: break-all;">' + (calculatedHash || 'N/A') + '</div>' +
    '</div>' +
    '<div style="padding: 10px; background: rgba(255,107,107,0.05); border-radius: 6px; border-left: 3px solid var(--danger);">' +
    '<div style="font-size: 11px; color: var(--muted); margin-bottom: 4px;">HASH DO BLOCO</div>' +
    '<div style="font-family: ui-monospace, monospace; font-size: 12px; color: var(--danger); word-break: break-all;">' + (blockHash || 'N/A') + '</div>' +
    '</div>' +
    '</div>' +
    
    '<div style="padding: 12px; background: rgba(255,107,107,0.08); border-radius: 6px; border: 1px solid rgba(255,107,107,0.3);">' +
    '<div style="display: flex; align-items: flex-start;">' +
    '<i class="fa-solid fa-lightbulb-exclamation" style="color: var(--danger); margin-right: 8px; margin-top: 2px;"></i>' +
    '<div>' +
    '<strong style="color: var(--danger); font-size: 13px; display: block; margin-bottom: 4px;">O QUE ISSO SIGNIFICA?</strong>' +
    '<span style="color: var(--muted); font-size: 12px; line-height: 1.4;">' +
    'O hash calculado do documento não coincide com o hash registrado no bloco de validação. ' +
    'Isso indica que o documento pode ter sido modificado após sua criação.' +
    '</span>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    
    '<div style="display: flex; gap: 8px; margin-top: 12px;">' +
    '<div style="flex: 1; padding: 10px; background: rgba(255,107,107,0.05); border-radius: 6px; text-align: center;">' +
    '<i class="fa-solid fa-file-circle-xmark" style="color: var(--danger); margin-right: 6px;"></i>' +
    '<span style="color: var(--danger); font-size: 12px; font-weight: 600;">DOCUMENTO INVÁLIDO</span>' +
    '</div>' +
    '<div style="flex: 1; padding: 10px; background: rgba(255,107,107,0.05); border-radius: 6px; text-align: center;">' +
    '<i class="fa-solid fa-shield-exclamation" style="color: var(--danger); margin-right: 6px;"></i>' +
    '<span style="color: var(--danger); font-size: 12px; font-weight: 600;">INTEGRIDADE COMPROMETIDA</span>' +
    '</div>' +
    '</div>' +
    '</div>'
  );
  UIManager.showError('Documento corrompido - Hashes não coincidem');
}
      
      Logger.info('Validação local com metadados realizada', STATE.blockData);
      
    } else {
      // Fallback — se não existe bloco no PDF
      UIManager.updateHashDisplays({
        registeredHash: hash
      });

      const localValid = /^[0-9a-f]{64}$/i.test(hash);

      UIManager.updateValidationResult(
        localValid,
        localValid ? 
          '<div style="text-align: left; line-height: 1.4; width: 100%;">' +
          '<strong style="color: var(--success); display: block; margin-bottom: 8px;">✓ VALIDAÇÃO LOCAL REALIZADA</strong>' +
          '<div style="margin: 8px 0; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 6px; font-size: 12px; color: var(--muted); border-left: 3px solid var(--muted); text-align: left;">' +
          '<div><strong>Status:</strong> Hash válido (formato SHA-256)</div>' +
          '<div><strong>Aviso:</strong> API temporariamente indisponível</div>' +
          '</div>' +
          '<div style="color: var(--muted); font-size: 11px; margin-top: 8px; text-align: left;">Recomendação: Tente novamente para validação completa</div>' +
          '</div>'
          :
          '<div style="text-align: left; line-height: 1.4; width: 100%;">' +
          '<strong style="color: var(--danger); display: block; margin-bottom: 8px;">✗ VALIDAÇÃO LOCAL FALHOU</strong>' +
          '<div style="margin: 8px 0; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 6px; font-size: 12px; color: var(--muted); border-left: 3px solid var(--danger); text-align: left;">' +
          '<div><strong>Status:</strong> Hash inválido (formato incorreto)</div>' +
          '<div><strong>Aviso:</strong> API temporariamente indisponível</div>' +
          '</div>' +
          '<div style="color: var(--danger); font-size: 11px; margin-top: 8px; text-align: left;">Verifique o formato do hash (64 caracteres hex)</div>' +
          '</div>'
      );
      
      UIManager.showError('Falha na validação: ' + error.message);
    }
    
    Logger.error('Erro na validação', { hash, error: error.message });
  } finally {
    UIManager.setLoading(false);
    btnQuery.disabled = false;
    btnQuery.style.cssText = '';
    btnQuery.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Validar';
    enableClearButton();
    
    // ⭐⭐ CORREÇÃO: Garantir que a seção de metadados seja visível
    if (STATE.blockData && Object.keys(STATE.blockData).length > 0) {
      const metaCard = document.getElementById('metaCard');
      if (metaCard) {
        metaCard.classList.remove('hidden');
        console.log('DEBUG: MetaCard tornada visível');
      }
      
      // Atualizar layout após mostrar metadados
      setTimeout(() => {
        updateLayoutState();
        alignResultGridHeight();
      }, 100);
    }
  }
}
/* Validação local entre hashes */
function performLocalValidation(registeredHash, computedHash) {
  if (registeredHash.toLowerCase() === computedHash.toLowerCase()) {
    UIManager.updateValidationResult(
      true,
      '<div style="text-align: left; line-height: 1.4;">' +
      '<strong style="color: var(--success); display: block; margin-bottom: 8px;">✓ VALIDAÇÃO LOCAL BEM-SUCEDIDA</strong>' +
      '<div style="margin: 8px 0; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 6px; font-size: 12px; color: var(--muted); border-left: 3px solid var(--success); text-align: left;">' +
      `<div><strong>Hash registrado:</strong> ${registeredHash.substring(0, 24)}...</div>` +
      `<div><strong>Hash calculado:</strong> ${computedHash.substring(0, 24)}...</div>` +
      '<div><strong>Status:</strong> Hashes coincidem perfeitamente</div>' +
      '</div>' +
      '<div style="color: var(--success); font-size: 11px; margin-top: 8px; text-align: left;">✓ Integridade do documento verificada</div>' +
      '</div>'
    );
    Logger.info('Validação local bem-sucedida');
  } else {
    UIManager.updateValidationResult(
      false,
      '<div style="text-align: left; line-height: 1.4;">' +
      '<strong style="color: var(--danger); display: block; margin-bottom: 8px;">✗ FALHA NA VALIDAÇÃO LOCAL</strong>' +
      '<div style="margin: 8px 0; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 6px; font-size: 12px; color: var(--muted); border-left: 3px solid var(--danger); text-align: left;">' +
      `<div><strong>Hash registrado:</strong> ${registeredHash.substring(0, 24)}...</div>` +
      `<div><strong>Hash calculado:</strong> ${computedHash.substring(0, 24)}...</div>` +
      '<div><strong>Status:</strong> Hashes não coincidem</div>' +
      '</div>' +
      '<div style="color: var(--danger); font-size: 11px; margin-top: 8px; text-align: left;">⚠️ Documento pode ter sido alterado ou corrompido</div>' +
      '</div>'
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

window.addEventListener('resize', alignResultGridHeight);

/* ===== INICIALIZAÇÃO ===== */
document.addEventListener('DOMContentLoaded', () => {
	 // NOVO: Inicializar sistema de status (ANTES de tudo)
 StatusManager.init();
	 // NOVO: Inicializar sistema de conectividade
// ConnectivityManager.init();
  // Inicializar logs
  Logger.updateLogDisplay();

  // Configurar interface
  UIManager.resetUI();
  enableClearButton();
  

  ProjectIntroManager.init();
  // Processar URL
  initializeFromURL();
  
  Logger.info('Validador VÆLORÜM inicializado', {
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  });
});