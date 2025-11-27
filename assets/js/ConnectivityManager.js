/* =========================
   SISTEMA DE VERIFICAÇÃO DE CONECTIVIDADE E CORS - COM ANIMAÇÃO DE RECONEXÃO
   ========================= */

const ConnectivityManager = {
  isOnline: true,
  hasValidCORS: true,
  checkInterval: null,
  popupVisible: false,
  lastStatusCheck: 0,
  verificationInterval: null,
  cacheKey: 'valorum_connectivity_cache',
  corsChecked: false,
  lastCorsCheck: 0,
  
  // DOMÍNIOS PERMITIDOS para fazer chamadas à API
  allowedDomains: [
    'localhost',
    '127.0.0.1',
    'hash.theusoft.shop',
    'integrity.theusoft.shop'
  ],
  
  // Flag para saber se estamos em domínio permitido
  isAllowedDomain: false,
  
  // NOVO: Controlador de animação de reconexão
  reconnectionAnimation: null,
  
  async init() {
    // Primeiro: verificar se estamos em domínio permitido
    this.checkDomainPermission();
    
    // Carregar estado do cache imediatamente
    this.loadFromCache();
    
    // Verificar conectividade IMEDIATAMENTE antes de qualquer coisa
    await this.checkConnectivity(true);
    
    // Configurar listeners de conectividade do navegador
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Verificar periodicamente (a cada 30 segundos) apenas se for domínio permitido
    if (this.isAllowedDomain) {
      this.checkInterval = setInterval(() => {
        this.checkConnectivity();
      }, 30000);
    }
    
    this.log('Sistema de conectividade inicializado', 'INFO');
  },
  
  // Verificar se está em domínio permitido
  checkDomainPermission() {
    const currentDomain = window.location.hostname;
    this.isAllowedDomain = this.allowedDomains.some(domain => 
      currentDomain === domain || currentDomain.endsWith('.' + domain)
    );
    
    this.log(`Domínio atual: ${currentDomain} - Permitido: ${this.isAllowedDomain}`, 'INFO');
    
    // Se não for domínio permitido, bloquear imediatamente
    if (!this.isAllowedDomain) {
      this.hasValidCORS = false;
      this.corsChecked = true;
      this.lastCorsCheck = Date.now();
      this.saveToCache();
      
      // Mostrar popup de CORS imediatamente
      setTimeout(() => {
        this.handleCORSBlocked();
      }, 500);
    }
  },
  
  async checkConnectivity(initialCheck = false) {
    const now = Date.now();
    
    // Evitar verificações muito frequentes (mínimo 3 segundos)
    if (!initialCheck && now - this.lastStatusCheck < 3000) {
      return;
    }
    
    this.lastStatusCheck = now;
    
    try {
      // Teste de conectividade básica com fallback silencioso
      const connectivityTest = await this.testBasicConnectivity();
      
      if (!connectivityTest) {
        this.handleConnectivityLost('Sem acesso à internet');
        return;
      }
      
      // Só verificar CORS se estiver em domínio permitido
      let corsTest = this.hasValidCORS;
      
      if (this.isAllowedDomain) {
        // Verificar CORS apenas se necessário
        if (!this.corsChecked || (now - this.lastCorsCheck > 60000) || initialCheck) {
          corsTest = await this.testCORS();
          this.corsChecked = true;
          this.lastCorsCheck = now;
        }
      } else {
        // Se não é domínio permitido, CORS sempre bloqueado
        corsTest = false;
      }
      
      if (!corsTest) {
        this.handleCORSBlocked();
        return;
      }
      
      // Tudo funcionando
      if (!this.isOnline || !this.hasValidCORS) {
        this.handleConnectivityRestored();
      }
      
      this.isOnline = true;
      this.hasValidCORS = true;
      this.saveToCache();
      
    } catch (error) {
      this.log(`Erro na verificação de conectividade: ${error.message}`, 'DEBUG');
      this.handleConnectivityLost('Erro na verificação');
    }
  },
  
  async testBasicConnectivity() {
    try {
      // Teste com timeout curto e tratamento silencioso de erros
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      // Usar múltiplas estratégias simultaneamente
      const connectivityTests = await Promise.race([
        this.testEndpoint('https://www.google.com/favicon.ico', controller.signal),
        this.testEndpoint('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css', controller.signal),
        this.testEndpoint('https://integrity.theusoft.shop/status', controller.signal)
      ]);
      
      clearTimeout(timeoutId);
      return true;
      
    } catch (error) {
      // Não mostrar erro no console - falha silenciosa
      return false;
    }
  },
  
  async testEndpoint(url, signal) {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors',
        signal: signal
      });
      return true;
    } catch (error) {
      throw new Error('Endpoint failed');
    }
  },
  
  async testCORS() {
    // Se não é domínio permitido, nem tenta
    if (!this.isAllowedDomain) {
      this.log('Domínio não permitido - pulando verificação de CORS', 'DEBUG');
      return false;
    }
    
    // Se já sabemos que tem CORS bloqueado, não tenta novamente por um tempo
    if (this.hasValidCORS === false && (Date.now() - this.lastCorsCheck < 30000)) {
      this.log('Pulando verificação de CORS (já conhecido como bloqueado)', 'DEBUG');
      return false;
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${CONFIG.API_BASE}/status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-cache',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
      
    } catch (error) {
      // Verificar se é erro de CORS específico sem mostrar no console
      if (error.name === 'TypeError' && 
          (error.message.includes('Failed to fetch') || 
           error.message.includes('NetworkError') ||
           error.message.includes('CORS'))) {
        this.log('CORS bloqueado detectado', 'DEBUG');
        return false;
      }
      // Para outros erros (timeout, etc), assumir que não é problema de CORS
      return true;
    }
  },
  
  handleOnline() {
    this.log('Navegador reportou conexão restaurada', 'INFO');
    // Resetar flag de CORS para forçar nova verificação (apenas se domínio permitido)
    if (this.isAllowedDomain) {
      this.corsChecked = false;
    }
    // Verificar imediatamente
    setTimeout(() => this.checkConnectivity(), 500);
  },
  
  handleOffline() {
    this.log('Navegador reportou perda de conexão', 'WARN');
    this.handleConnectivityLost('Conexão com internet perdida');
  },
  
  handleConnectivityLost(reason) {
    if (this.isOnline === false && this.popupVisible) return;
    
    this.isOnline = false;
    this.saveToCache();
    this.log(`Conectividade perdida: ${reason}`, 'WARN');
    
    this.showConnectivityPopup({
      type: 'no-internet',
      title: 'Conexão Interrompida',
      subtitle: 'Sem acesso à internet',
      message: 'A conexão com a internet foi perdida. A validação de documentos requer acesso à rede para funcionar corretamente.',
      details: [
        { label: 'Motivo', value: reason },
        { label: 'Horário', value: new Date().toLocaleTimeString('pt-BR') },
        { label: 'Status', value: 'Offline' }
      ]
    });
  },
  
handleCORSBlocked() {
  if (!this.hasValidCORS && this.popupVisible) return;
  
  this.hasValidCORS = false;
  this.corsChecked = true;
  this.lastCorsCheck = Date.now();
  this.saveToCache();
  
  // VERIFICAÇÃO CORRIGIDA: usar this.hasValidCORS como referência principal
  const isDomainBlocked = !this.isAllowedDomain;
  
  // Se estamos em domínio permitido mas ainda assim tem CORS bloqueado, 
  // é um problema de configuração real de CORS, não de domínio
  if (this.isAllowedDomain) {
    this.log(`Problema de CORS detectado em domínio permitido: ${window.location.hostname}`, 'ERROR');
    
    this.showConnectivityPopup({
      type: 'cors-error',
      title: 'Erro de Configuração',
      subtitle: 'Problema de CORS na API',
      message: 'O domínio está autorizado, mas a API não está respondendo corretamente às requisições. Isso pode ser um problema temporário do servidor.',
      details: [
        { label: 'Erro', value: 'CORS Policy Blocked' },
        { label: 'Domínio Atual', value: window.location.hostname },
        { label: 'Status', value: 'Em investigação', class: 'cors-warning' }
      ],
      showRetry: true // Permitir tentar novamente em domínio permitido
    });
    
  } else {
    // Domínio realmente não permitido
    this.log(`Bloqueio de CORS - Domínio não permitido: ${window.location.hostname}`, 'ERROR');
    
    this.showConnectivityPopup({
      type: 'cors-error',
      title: 'Domínio Não Autorizado',
      subtitle: 'Uso em Local Proibido',
      message: 'Este sistema não pode ser executado neste domínio. O acesso à API está restrito aos domínios autorizados da Ṫ͏͏HEÜSOFT.',
      details: [
        { label: 'Erro', value: 'Domain Blocked' },
        { label: 'Domínio Atual', value: window.location.hostname },
        { label: 'Domínio Autorizado', value: 'hash.theusoft.shop' },
        { label: 'Severidade', value: 'ALTA', class: 'cors-warning' }
      ],
      showRetry: false
    });
  }
},
// NO handleConnectivityRestored - Mude de 2500 para 4000
handleConnectivityRestored() {
  this.log('Conectividade totalmente restaurada', 'INFO');
  
  // Mostrar animação de reconexão antes de fechar o popup
  this.showReconnectionAnimation();
  
  // Fechar popup após animação (aumentado para 4 segundos)
  setTimeout(() => {
    this.hideConnectivityPopup();
    this.saveToCache();
  }, 4000); // ← Alterado de 2500 para 4000
  
  // Recarregar status da API apenas se for domínio permitido
  if (window.StatusManager && this.isAllowedDomain) {
    setTimeout(() => {
      StatusManager.checkAPIStatus().catch(() => {
        // Silenciosamente ignorar erros na recarga
      });
    }, 4500); // ← Aumentado também para dar tempo da animação
  }
},

// NO retryConnection - Mude de 2500 para 4000
if (hasCORS) {
  // Tudo funcionando - mostrar animação de reconexão
  this.showReconnectionAnimation();
  
  setTimeout(() => {
    this.hideConnectivityPopup();
  }, 4000); // ← Alterado de 2500 para 4000
},
  
  // NOVO: Animação de reconexão bem-sucedida
  showReconnectionAnimation() {
    const popup = document.querySelector('.connectivity-popup');
    if (!popup) return;
    
    const content = popup.querySelector('.connectivity-content');
    if (!content) return;
    
    // Criar elemento de animação
    const animationEl = document.createElement('div');
    animationEl.className = 'reconnection-animation';
    animationEl.innerHTML = `
      <div class="animation-icon">
        <i class="fa-solid fa-wifi"></i>
      </div>
      <div class="animation-text">
        <div class="animation-title">Conexão Restaurada!</div>
        <div class="animation-subtitle">Sistema reconectado com sucesso</div>
      </div>
      <div class="animation-waves">
        <div class="wave"></div>
        <div class="wave"></div>
        <div class="wave"></div>
      </div>
    `;
    
    // Substituir o conteúdo pelo animation
    content.innerHTML = '';
    content.appendChild(animationEl);
    
    // Adicionar classe de animação
    setTimeout(() => {
      animationEl.classList.add('animate');
    }, 100);
    
    // Limpar animação anterior se existir
    if (this.reconnectionAnimation) {
      clearTimeout(this.reconnectionAnimation);
    }
  },
  
  showConnectivityPopup(config) {
    if (this.popupVisible) return;
    
    this.popupVisible = true;
    
    const popup = document.createElement('div');
    popup.className = `connectivity-popup ${config.type === 'no-internet' ? 'connection-lost' : ''}`;
    popup.innerHTML = this.generatePopupHTML(config);
    
    document.body.appendChild(popup);
    
    // Configurar botões
    const retryBtn = popup.querySelector('#connectivityRetry');
    const closeBtn = popup.querySelector('#connectivityClose');
    
    if (retryBtn && this.isAllowedDomain) {
      retryBtn.addEventListener('click', () => this.retryConnection(popup));
    } else if (retryBtn) {
      // Se não for domínio permitido, esconder botão de tentar novamente
      retryBtn.style.display = 'none';
    }
    
    if (closeBtn && config.showRetry !== false) {
      closeBtn.addEventListener('click', () => this.hideConnectivityPopup());
    } else if (closeBtn) {
      // Para CORS, o botão fechar deve redirecionar para domínio correto
      closeBtn.addEventListener('click', () => {
        window.location.href = 'https://hash.theusoft.shop';
      });
      closeBtn.innerHTML = '<i class="fa-solid fa-external-link"></i> Acessar Domínio Correto';
    }
    
    // Adicionar animação de verificação para problemas de internet (apenas se domínio permitido)
    if (config.type === 'no-internet' && this.isAllowedDomain) {
      this.startVerificationAnimation(popup);
    }
  },
  
generatePopupHTML(config) {
  const detailsHTML = config.details.map(detail => `
    <div class="detail-item">
      <span class="detail-label">${detail.label}</span>
      <span class="detail-value ${detail.class || ''}">${detail.value}</span>
    </div>
  `).join('');
  
  // BOTÕES CONDICIONAIS
  let actionsHTML = '';
  
  if (config.type === 'no-internet' && this.isAllowedDomain) {
    // Apenas "Tentar Novamente" centralizado para problemas de internet
    actionsHTML = `
      <button id="connectivityRetry" class="connectivity-btn primary">
        <i class="fa-solid fa-rotate"></i> Tentar Novamente
      </button>
    `;
  } else if (config.showRetry !== false && this.isAllowedDomain) {
    // Para outros casos (se aplicável) manter ambos os botões
    actionsHTML = `
      <button id="connectivityRetry" class="connectivity-btn primary">
        <i class="fa-solid fa-rotate"></i> Tentar Novamente
      </button>
      <button id="connectivityClose" class="connectivity-btn secondary">
        <i class="fa-solid fa-xmark"></i> Fechar
      </button>
    `;
  } else {
    // Para CORS/bloqueio de domínio - apenas botão de redirecionamento
    actionsHTML = `
      <button id="connectivityClose" class="connectivity-btn secondary">
        <i class="fa-solid fa-external-link"></i> Acessar Domínio Correto
      </button>
    `;
  }

  // ÍCONE CONDICIONAL - Internet vs CORS
const iconHTML = config.type === 'no-internet'
  ? '<i class="fa-solid fa-wifi"></i>'
  : `<img src="assets/img/logo/selo/Selo_VÆLORÜM_Branco.svg"
          alt="Selo VÆLORÜM"
          class="connectivity-selo-icon">`;


  return `
    <div class="connectivity-content">
      <div class="connectivity-icon">
        ${iconHTML}
      </div>
      
      <h2 class="connectivity-title">${config.title}</h2>
      <div class="connectivity-subtitle">${config.subtitle}</div>
      
      <div class="connectivity-message">
        ${config.message}
      </div>
      
      <div class="connectivity-details">
        ${detailsHTML}
      </div>
      
      ${config.type === 'no-internet' && this.isAllowedDomain ? `
        <div class="verification-status">
          <div class="verification-dot verifying"></div>
          <span id="verificationText">Verificando conexão automaticamente...</span>
        </div>
      ` : ''}
      
      <div class="connectivity-actions">
        ${actionsHTML}
      </div>
    </div>
  `;
},
  startVerificationAnimation(popup) {
    // Limpar intervalo anterior se existir
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
    }
    
    this.verificationInterval = setInterval(async () => {
      if (!this.popupVisible) {
        clearInterval(this.verificationInterval);
        return;
      }
      
      try {
        const isOnline = await this.testBasicConnectivity();
        
        if (isOnline) {
          const statusDot = popup.querySelector('.verification-dot');
          const statusText = popup.querySelector('#verificationText');
          
          if (statusDot && statusText) {
            statusDot.className = 'verification-dot success';
            statusText.textContent = 'Conexão restaurada!';
          }
          
          setTimeout(() => {
            this.handleConnectivityRestored();
            clearInterval(this.verificationInterval);
          }, 1500);
        }
      } catch (error) {
        // Silenciosamente continuar verificando
      }
    }, 3000);
  },
  
  async retryConnection(popup) {
    if (!popup || !this.isAllowedDomain) return;
    
    const retryBtn = popup.querySelector('#connectivityRetry');
    const statusDot = popup.querySelector('.verification-dot');
    const statusText = popup.querySelector('#verificationText');
    
    if (retryBtn) {
      retryBtn.disabled = true;
      retryBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verificando...';
    }
    
    if (statusDot && statusText) {
      statusDot.className = 'verification-dot verifying';
      statusText.textContent = 'Verificando conexão...';
    }
    
    try {
      // Testar conectividade sem fechar o modal
      const isOnline = await this.testBasicConnectivity();
      
      if (isOnline) {
        // Para CORS, só verifica se realmente necessário
        let hasCORS = this.hasValidCORS;
        if (!this.corsChecked || (Date.now() - this.lastCorsCheck > 30000)) {
          hasCORS = await this.testCORS();
        }
        
        if (hasCORS) {
          // Tudo funcionando - mostrar animação de reconexão
          this.showReconnectionAnimation();
          
          setTimeout(() => {
            this.hideConnectivityPopup();
          }, 2500);
        } else {
          // Tem internet mas CORS bloqueado
          if (statusText) statusText.textContent = 'Internet OK, mas acesso à API bloqueado';
          if (statusDot) statusDot.className = 'verification-dot error';
        }
      } else {
        // Ainda sem internet
        if (statusText) statusText.textContent = 'Ainda sem conexão com a internet';
        if (statusDot) statusDot.className = 'verification-dot error';
      }
      
    } catch (error) {
      if (statusText) statusText.textContent = 'Erro na verificação';
      if (statusDot) statusDot.className = 'verification-dot error';
    } finally {
      if (retryBtn) {
        setTimeout(() => {
          retryBtn.disabled = false;
          retryBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> Tentar Novamente';
        }, 2000);
      }
    }
  },
  
  hideConnectivityPopup() {
    const popup = document.querySelector('.connectivity-popup');
    if (popup) {
      // Limpar intervalo de verificação
      if (this.verificationInterval) {
        clearInterval(this.verificationInterval);
        this.verificationInterval = null;
      }
      
      popup.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => {
        if (popup.parentNode) {
          popup.parentNode.removeChild(popup);
        }
        this.popupVisible = false;
      }, 300);
    }
  },
  
saveToCache() {
  try {
    const cacheData = {
      isOnline: this.isOnline,
      hasValidCORS: this.hasValidCORS,
      corsChecked: this.corsChecked,
      lastCorsCheck: this.lastCorsCheck,
      isAllowedDomain: this.isAllowedDomain,
      currentDomain: window.location.hostname, // ← ADICIONAR ESTA LINHA
      timestamp: Date.now(),
      lastChecked: new Date().toISOString()
    };
    localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    // Silenciosamente ignorar erros de localStorage
  }
},
loadFromCache() {
  try {
    const cached = localStorage.getItem(this.cacheKey);
    if (cached) {
      const cacheData = JSON.parse(cached);
      const cacheAge = Date.now() - cacheData.timestamp;
      
      // Usar cache apenas se tiver menos de 5 minutos E for do mesmo domínio
      const currentDomain = window.location.hostname;
      const cachedDomain = cacheData.currentDomain;
      
      // VERIFICAÇÃO CRÍTICA: Se mudou o domínio, ignorar cache completamente
      if (cacheAge < 5 * 60 * 1000 && cachedDomain === currentDomain) {
        this.isOnline = cacheData.isOnline;
        this.hasValidCORS = cacheData.hasValidCORS;
        this.corsChecked = cacheData.corsChecked || false;
        this.lastCorsCheck = cacheData.lastCorsCheck || 0;
        this.isAllowedDomain = cacheData.isAllowedDomain !== undefined ? cacheData.isAllowedDomain : this.isAllowedDomain;
        
        // Só mostrar popup se realmente estiver offline/CORS bloqueado
        if (!this.isOnline || !this.hasValidCORS) {
          setTimeout(() => {
            if (!this.isOnline) {
              this.handleConnectivityLost('Estado recuperado do cache');
            } else if (!this.hasValidCORS) {
              this.handleCORSBlocked();
            }
          }, 100);
        }
        
        this.log('Estado carregado do cache', 'DEBUG');
      } else {
        this.log('Cache ignorado (expirado ou domínio diferente)', 'DEBUG');
        // Forçar nova verificação se cache é inválido
        this.corsChecked = false;
        this.hasValidCORS = true; // Assume que está OK até verificar
      }
    }
  } catch (error) {
    this.log('Erro ao carregar cache: ' + error.message, 'DEBUG');
    // Em caso de erro, forçar nova verificação
    this.corsChecked = false;
    this.hasValidCORS = true;
  }
},
  // Sistema de logging limpo
  log(message, level = 'INFO') {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const formattedMessage = `[Connectivity] ${message}`;
    
    // Usar o sistema de logs existente se disponível
    if (window.Logger) {
      switch(level) {
        case 'ERROR':
          Logger.error(formattedMessage);
          break;
        case 'WARN':
          Logger.warn(formattedMessage);
          break;
        case 'DEBUG':
          Logger.debug(formattedMessage);
          break;
        default:
          Logger.info(formattedMessage);
      }
    } else {
      // Fallback para console apenas em desenvolvimento
      const isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname.startsWith('192.168.');
      
      if (isDevelopment) {
        const styles = {
          INFO: 'color: #66e07b',
          WARN: 'color: #ffa500', 
          ERROR: 'color: #ff6b6b',
          DEBUG: 'color: #5ac8ff'
        };
        console.log(`%c${timestamp} ${formattedMessage}`, styles[level] || 'color: gray');
      }
    }
  },
  
  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
    }
    if (this.reconnectionAnimation) {
      clearTimeout(this.reconnectionAnimation);
    }
    this.hideConnectivityPopup();
    this.log('Sistema de conectividade finalizado', 'INFO');
  }
};

// Adicionar animações CSS dinamicamente
if (!document.querySelector('#connectivity-animations')) {
  const style = document.createElement('style');
  style.id = 'connectivity-animations';
  style.textContent = `
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    
    /* NOVO: Animações de Reconexão */
    .reconnection-animation {
      text-align: center;
      padding: 40px 20px;
      opacity: 0;
      transform: scale(0.8);
      transition: all 0.5s ease;
    }
    
    .reconnection-animation.animate {
      opacity: 1;
      transform: scale(1);
    }
    
    .animation-icon {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--success), var(--accent3));
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 40px;
      color: white;
      animation: pulseSuccess 2s ease-in-out infinite;
      box-shadow: 0 0 40px rgba(102, 224, 123, 0.4);
      position: relative;
      overflow: hidden;
    }
    
    @keyframes pulseSuccess {
      0%, 100% { 
        transform: scale(1);
        box-shadow: 0 0 40px rgba(102, 224, 123, 0.4);
      }
      50% { 
        transform: scale(1.05);
        box-shadow: 0 0 60px rgba(102, 224, 123, 0.6);
      }
    }
    
    .animation-text {
      margin-bottom: 30px;
    }
    
    .animation-title {
      font-size: 28px;
      font-weight: 700;
      color: var(--success);
      margin-bottom: 8px;
      background: linear-gradient(90deg, var(--success), var(--accent3));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .animation-subtitle {
      font-size: 16px;
      color: var(--muted);
    }
    
    .animation-waves {
      position: relative;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .wave {
      position: absolute;
      width: 120px;
      height: 120px;
      border: 3px solid var(--success);
      border-radius: 50%;
      opacity: 0;
      animation: waveExpand 2s ease-out infinite;
    }
    
    .wave:nth-child(1) {
      animation-delay: 0s;
    }
    
    .wave:nth-child(2) {
      animation-delay: 0.5s;
    }
    
    .wave:nth-child(3) {
      animation-delay: 1s;
    }
    
    @keyframes waveExpand {
      0% {
        transform: scale(0.1);
        opacity: 1;
        border-width: 3px;
      }
      50% {
        opacity: 0.5;
        border-width: 2px;
      }
      100% {
        transform: scale(1.5);
        opacity: 0;
        border-width: 1px;
      }
    }
    
    /* Efeito de partículas */
    .animation-icon::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
      border-radius: 50%;
      animation: rotate 3s linear infinite;
    }
    
    @keyframes rotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

// Inicializar IMEDIATAMENTE - não esperar DOMContentLoaded
(function() {
  // Criar o sistema global imediatamente
  window.ConnectivityManager = ConnectivityManager;
  
  // Inicializar assim que possível
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ConnectivityManager.init();
    });
  } else {
    // DOM já está carregado, inicializar imediatamente
    setTimeout(() => ConnectivityManager.init(), 100);
  }
})();