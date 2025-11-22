/*
  validate.js — refatorado (preserva lógica original, adiciona UI/UX)
  Coloque este arquivo em: /js/validate.js (substitui o existente)
*/
(function () {
  'use strict';

  // --- Elementos principais ---
  const splashScreen = document.getElementById('splash-screen');
  const mainContent = document.getElementById('main-content');
  const greetingEl = document.getElementById('greeting');
  const greetingEmoji = document.getElementById('greeting-emoji');
  const cardHeader = document.querySelector('.card-header');
  const cardDescription = document.getElementById('card-description');
  const tsidForm = document.getElementById('tsid-form');
  const cpfForm = document.getElementById('cpf-form');
  const tsidInput = document.getElementById('tsid');
  const cpfInput = document.getElementById('cpf');
  const resultEl = document.getElementById('result');
  const successState = document.getElementById('success-state');
  const logoutBtn = document.getElementById('logout-btn');
  const cardHeaderTitle = document.getElementById('card-header-title');
  const validationCard = document.getElementById('validation-card');

  const dots = document.getElementById('dots');

  // --- Constantes e variáveis ---
  const QR_VERSION_PATH = '/v3';
  const TSID_PREFIX = 'TS3-';
  const MIN_SPLASH_TIME = 8000;
  let splashStartTime = Date.now();
  let currentTsid = null;

  // --- Helpers de logging ---
  function log(...args) {
    console.log(`[validate.js][${(new Date()).toISOString()}]`, ...args);
  }


// --- NOVO: Sincronização com QR Scanner ---
function setupQRCodeSync() {
    // Listener para evento de TS-ID validado via QR Code
    window.addEventListener('tsid:validated', function(event) {
        const tsid = event.detail.tsid;
        console.log('📱 TS-ID recebido do QR Scanner:', tsid);
        
        // Definir currentTsid
        currentTsid = tsid;
        
        // Garantir que a classe de validação está aplicada
        validationCard.classList.add('tsid-validated');
        
        // Mostrar formulário CPF
        showCpfForm();
        
        // Atualizar botão para "Validar CPF"
        const cpfBtn = findSubmitButton(cpfForm);
        if (cpfBtn) {
            cpfBtn.innerHTML = `<span class="btn-content"><i class="fas fa-check-circle"></i> Validar CPF</span>`;
        }
        
        console.log('✅ Fluxo QR Code sincronizado com sucesso');
    });
}

// --- NOVO: Restaurar TS-ID do sessionStorage ---
function restoreTsidFromStorage() {
    const storedTsid = sessionStorage.getItem('currentTsid');
    if (storedTsid && !currentTsid) {
        currentTsid = storedTsid;
        console.log('📦 TS-ID restaurado do sessionStorage:', currentTsid);
    }
}


  // --- UI helpers (buttons / inputs) ---
  function findSubmitButton(formEl) {
    if (!formEl) return null;
    return formEl.querySelector('button[type="submit"].btn-primary') || formEl.querySelector('.btn-primary');
  }

  function setButtonLoading(btn, label) {
    if (!btn) return;
    // guarde conteúdo original para restaurar
    if (!btn.dataset.originalHtml) btn.dataset.originalHtml = btn.innerHTML;
    btn.classList.add('loading');
    btn.setAttribute('aria-busy', 'true');
    btn.disabled = true;
    btn.style.pointerEvents = 'none';

    // conteúdo padronizado com span.btn-content para compatibilidade com CSS
    const icon = '<i class="fas fa-check-circle"></i>';
    const loadingLabel = escapeHtml(label || 'Validando');
    btn.innerHTML = `<span class="btn-content">${icon} ${loadingLabel}<span class="loading-text" style="margin-left:8px;"></span></span>`;
  }

  function restoreButton(btn) {
    if (!btn) return;
    btn.classList.remove('loading');
    btn.removeAttribute('aria-busy');
    btn.disabled = false;
    btn.style.pointerEvents = '';
    if (btn.dataset.originalHtml) {
      btn.innerHTML = btn.dataset.originalHtml;
      // mantém o HTML original caso o markup no HTML seja diferente
    }
  }

  function setInputStatus(inputEl, status, message) {
    // status: 'validating' | 'success' | 'error' | ''
    if (!inputEl) return;
    const group = inputEl.closest('.input-group');
    if (!group) return;
    const hint = group.querySelector('.input-hint');
    const wrapper = group.querySelector('.input-wrapper');

    // limpar classes
    if (hint) {
      hint.classList.remove('status', 'validating', 'success', 'error');
    }
    if (wrapper) {
      wrapper.classList.remove('validating', 'success', 'error');
    }

    if (status === 'validating') {
      if (hint) {
        hint.classList.add('status', 'validating');
        hint.textContent = message || 'Validando — por favor aguarde';
      }
      if (wrapper) wrapper.classList.add('validating');
      inputEl.setAttribute('aria-busy', 'true');
      inputEl.disabled = true;
    } else if (status === 'success') {
      if (hint) {
        hint.classList.add('status', 'success');
        hint.textContent = message || 'Validação concluída';
      }
      if (wrapper) wrapper.classList.add('success');
      inputEl.removeAttribute('aria-busy');
      inputEl.disabled = false;
    } else if (status === 'error') {
      if (hint) {
        hint.classList.add('status', 'error');
        hint.textContent = message || 'Erro durante a validação';
      }
      if (wrapper) wrapper.classList.add('error');
      inputEl.removeAttribute('aria-busy');
      inputEl.disabled = false;
    } else {
      // limpar
      if (hint) {
        hint.classList.remove('status', 'validating', 'success', 'error');
        // restaurar texto padrão se data-default set
        if (hint.dataset && hint.dataset.default) {
          hint.textContent = hint.dataset.default;
        }
      }
      if (wrapper) wrapper.classList.remove('validating', 'success', 'error');
      inputEl.removeAttribute('aria-busy');
      inputEl.disabled = false;
    }
  }

  // Escapa texto simples para evitar XSS (usado apenas em labels)
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  // Find hint element and store its default text (so we can restore)
  function cacheInputHints() {
    const hints = document.querySelectorAll('.input-hint');
    hints.forEach(h => {
      if (!h.dataset.default) h.dataset.default = h.textContent.trim();
    });
  }

  // --- Pequenas utilities usadas pela lógica original ---
  function onlyDigits(str) {
    return (str || '').replace(/\D/g, '');
  }

  // showMessage: mantive o comportamento original, mas agora também ajusta classes de fallback 'processing'
  function showMessage(html, type) {
    resultEl.style.display = 'block';
    resultEl.className = 'result ' + (type === 'error' ? 'error' : (type === 'success' ? 'success' : (type === 'processing' ? 'processing' : '')));
    resultEl.innerHTML = html;
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // --- Funções originais (mantidas) para criar os blocos de dados (copiei a lógica original aqui) ---
  function createDataItem(icon, label, value) {
    return `
      <div class="data-item">
        <div class="data-icon">
          <i class="${icon}"></i>
        </div>
        <div class="data-content">
          <div class="data-label">${label}</div>
          <div class="data-value">${value}</div>
        </div>
      </div>
    `;
  }

  function createColorItem(label, color) {
    return `
      <div class="color-item">
        <div class="color-preview" style="background-color: ${color};"></div>
        <div class="color-info">
          <div class="color-label">${label}</div>
          <div class="color-value">${color}</div>
        </div>
      </div>
    `;
  }

  function createColorDisplay(cfg) {
    if (!cfg || Object.keys(cfg).length === 0) return '';
    const colorItems = [];
    if (cfg.accentStrong) colorItems.push(createColorItem('Cor Principal', cfg.accentStrong));
    if (cfg.accentLight) colorItems.push(createColorItem('Cor Secundária', cfg.accentLight));
    if (cfg.svgColor) colorItems.push(createColorItem('Cor do SVG', cfg.svgColor));
    if (cfg.textColor) colorItems.push(createColorItem('Cor do Texto', cfg.textColor));
    if (cfg.labelColor) colorItems.push(createColorItem('Cor do Rótulo', cfg.labelColor));
    if (colorItems.length === 0) return '';
    return `
      <div class="color-display">
        <h4><i class="fas fa-fill-drip"></i> Cores do Cartão</h4>
        <div class="color-grid">
          ${colorItems.join('')}
        </div>
      </div>
    `;
  }

  function escapeHtmlForPre(s) {
    return String(s || '').replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  // --- Exibir estado de sucesso (mantive a lógica) ---
  function showSuccessState(patientData) {
    validationCard.classList.remove('tsid-validated');
    tsidForm.style.display = 'none';
    cpfForm.style.display = 'none';
    cardHeader.style.display = 'none';

    if (patientData) {
      resultEl.style.display = 'block';
      resultEl.className = 'result success';
      resultEl.innerHTML = patientData;
    }
    successState.style.display = 'block';
  }

// --- Logout / reset (mantive a lógica) ---
function handleLogout() {
  validationCard.classList.remove('tsid-validated');
  
  // *** NOVO: Limpar sessionStorage ***
  sessionStorage.removeItem('currentTsid');
  console.log('🗑️ TS-ID removido do sessionStorage');
  
  // *** NOVO: Reabilitar botão QR Code ***
  const qrCodeButton = document.querySelector('.qr-code-button');
  if (qrCodeButton) {
    qrCodeButton.style.pointerEvents = 'auto';
    qrCodeButton.style.opacity = '1';
    qrCodeButton.style.cursor = 'pointer';
    qrCodeButton.classList.remove('disabled');
  }
  
  // Restaurar greeting original
  setGreeting();
  
  // *** NOVO: Restaurar tagline original ***
  const taglineElement = document.querySelector('.tagline');
  if (taglineElement) {
    taglineElement.innerHTML = `
      <span class="tagline-keyword">Seja bem-vindo(a)</span> à <span class="tagline-company">Ṫ͏͏HEÜSOFT</span>. 
      Seu <span class="tagline-keyword">acesso</span> foi <span class="tagline-keyword">validado</span> com <span class="tagline-keyword">segurança</span> e 
      <span class="tagline-keyword">precisão</span>.
    `;
  }
  
  if (getTsidFromPath()) {
    window.location.href = QR_VERSION_PATH;
  } else {
    currentTsid = null;
    tsidInput.value = '';
    cpfInput.value = '';
    showTsidForm();
    cardDescription.textContent = 'Informe o Ṫ͏͏S-ID para iniciar a validação';
    
    if (cardHeaderTitle) {
      cardHeaderTitle.textContent = 'Validação do Cartão Ṫ͏͏S-ID';
    }
  }
}


  // --- Forms show/hide (mantive) ---
  function showTsidForm() {
    tsidForm.style.display = 'block';
    cpfForm.style.display = 'none';
    successState.style.display = 'none';
    resultEl.style.display = 'none';
    cardHeader.style.display = 'flex';
	
	 if (cardHeaderTitle) {
    cardHeaderTitle.textContent = 'Validação do Cartão Ṫ͏͏S-ID';
  }
  }

  function showCpfForm() {
    tsidForm.style.display = 'none';
    cpfForm.style.display = 'block';
    successState.style.display = 'none';
    resultEl.style.display = 'none';
    cardHeader.style.display = 'flex';
	
	if (cardHeaderTitle) {
    cardHeaderTitle.textContent = 'Validação do CPF do Paciente';
  }
  }

// --- Funções de TSID input / prefix (com hífen automático) ---
function handleTsidInput(e) {
  const input = e.target;
  let value = input.value.trim().toUpperCase();

  if (e.inputType === 'insertFromPaste') {
    if (value && !value.startsWith(TSID_PREFIX) && (/^\d+-\d+$/.test(value) || /^\d+$/.test(value))) {
      input.value = TSID_PREFIX + value.replace(/^TS[0-9]-?/, '');
      return;
    }
  }

  // Comportamento original: adiciona prefixo logo no início
  if (/^\d/.test(value) && !value.startsWith(TSID_PREFIX)) {
    // Remove tudo que não é número para formatação
    let numbersOnly = value.replace(/\D/g, '');
    
    // Adiciona prefixo imediatamente
    if (numbersOnly.length > 0) {
      input.value = TSID_PREFIX + numbersOnly;
      return;
    }
  }

  // Se já tem o prefixo TS3-, formata com hífen automático
  if (value.startsWith(TSID_PREFIX)) {
    const numericPart = value.substring(4); // Remove "TS3-"
    const numbersOnly = numericPart.replace(/\D/g, '');
    
    // Adiciona hífen automaticamente após 12 dígitos
    let formattedValue = TSID_PREFIX;
    if (numbersOnly.length <= 12) {
      formattedValue += numbersOnly;
    } else {
      formattedValue += numbersOnly.substring(0, 12) + '-' + numbersOnly.substring(12, 14);
    }
    
    input.value = formattedValue;
    return;
  }

  // Mantém apenas caracteres válidos (letras, números, hífen)
  input.value = value.replace(/[^A-Z0-9\-]/g, '');
}

function validateTsidPrefix(e) {
  const input = e.target;
  let value = input.value.trim().toUpperCase();

  // Comportamento original: adiciona prefixo se for número puro
  if (value && !value.startsWith(TSID_PREFIX) && /^[A-Z0-9\-]+$/.test(value)) {
    if (/^\d+-\d+$/.test(value) || /^\d+$/.test(value)) {
      input.value = TSID_PREFIX + value.replace(/^TS[0-9]-?/, '');
    }
  }

  // E também formata automaticamente o hífen do dígito verificador
  if (value.startsWith(TSID_PREFIX)) {
    const numericPart = value.substring(4); // Remove "TS3-"
    const numbersOnly = numericPart.replace(/\D/g, '');
    
    // Adiciona hífen antes dos últimos 2 dígitos quando tiver 12+ números
    if (numbersOnly.length >= 12) {
      const formatted = numbersOnly.substring(0, 12) + '-' + numbersOnly.substring(12, 14);
      input.value = TSID_PREFIX + formatted;
    } else if (numbersOnly.length > 0) {
      // Mantém o prefixo mesmo com menos dígitos
      input.value = TSID_PREFIX + numbersOnly;
    }
  }
}



  // --- Formatação CPF (mantive) ---
  function formatCPF(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    e.target.value = value;
  }

  // --- Helper para pequenas pausas visuais (não longas) ---
  function pause(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

// --- Submissão Ṫ͏͏S-ID (AGORA COM POST) ---
async function handleTsidSubmit(ev) {
  ev.preventDefault();
  resultEl.style.display = 'none';

  let tsid = (tsidInput.value || '').trim();

  if (!tsid) {
    showMessage(
      '<div class="error-header"><i class="fas fa-exclamation-triangle"></i><strong>Ṫ͏͏S-ID ausente</strong></div><p>Informe o Ṫ͏͏S-ID do cartão para continuar com a validação.</p>',
      'error'
    );
    setInputStatus(tsidInput, 'error', 'Informe o Ṫ͏͏S-ID para continuar');
    return;
  }

  log('Iniciando verificação de TSID:', tsid);

  const btn = findSubmitButton(tsidForm);
  setButtonLoading(btn, 'Validando Ṫ͏͏S-ID...');
  setInputStatus(tsidInput, 'validating', 'Validando Ṫ͏͏S-ID — iniciando verificação...');
  await pause(3000);

  setInputStatus(tsidInput, 'validating', 'Consultando servidor de verificação segura...');
  await pause(3000);

  setInputStatus(tsidInput, 'validating', 'Verificando assinatura de segurança e integridade dos dados...');
  await pause(3000);

  try {
    // 🔄 MUDANÇA: AGORA É POST
    const url = `/api/sus/check-tsid`;
    log('Fetch POST ->', url);

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tsid })
    });

    // 🔸 só prossegue se status 200
    if (resp.ok) {
  currentTsid = tsid;
  
  // 🔄 NOVO: Sincronizar com ConsentManager
  syncConsentManagerAfterValidation();
  
  showCpfForm();
  cardDescription.textContent = 'Informe o CPF do paciente para validar o cartão de identificação';
  
  if (cardHeaderTitle) {
    cardHeaderTitle.textContent = 'Validação do CPF do Paciente';
  }
  
  validationCard.classList.add('tsid-validated');

      const cpfBtn = findSubmitButton(cpfForm);
      if (cpfBtn) {
        cpfBtn.innerHTML = `<span class="btn-content"><i class="fas fa-check-circle"></i> Validar CPF</span>`;
      }

      setInputStatus(tsidInput, 'success', 'Ṫ͏͏S-ID verificado com sucesso');
      restoreButton(btn);
      log('TSID válido:', tsid);
      resultEl.style.display = 'none';
    } else {
      let errorText = 'O Ṫ͏͏S-ID informado não é válido ou não existe. Verifique o código e tente novamente.';
      try {
        const json = await resp.json();
        if (json && json.error) errorText = json.error;
      } catch {}

      log('TSID inválido:', tsid, 'status:', resp.status);
      showMessage(
        '<div class="error-header"><i class="fas fa-times-circle"></i><strong>Ṫ͏͏S-ID inválido</strong></div><p>' +
          escapeHtml(errorText) +
          '</p>',
        'error'
      );
      setInputStatus(tsidInput, 'error', 'Ṫ͏͏S-ID inválido — verifique e tente novamente');
      restoreButton(btn);
    }
  } catch (err) {
    log('Erro ao verificar TSID:', err);
    showMessage(
      '<div class="error-header"><i class="fas fa-exclamation-triangle"></i><strong>Erro de Comunicação</strong></div><div class="error-details">' +
        escapeHtml(err.message || err) +
        '</div>',
      'error'
    );
    setInputStatus(tsidInput, 'error', 'Erro de comunicação ao verificar Ṫ͏͏S-ID');
    restoreButton(btn);
  } finally {
    restoreButton(btn);
  }
}


// --- Submissão CPF CORRIGIDA (com suporte a QR Code) ---
async function handleCpfSubmit(ev) {
    ev.preventDefault();
    resultEl.style.display = 'none';

    // *** CORREÇÃO AMPLIADA: Verificar TS-ID de múltiplas fontes ***
    
    // 1. Tentar restaurar do sessionStorage (para QR Code)
    function restoreTsidFromStorage() {
        const storedTsid = sessionStorage.getItem('currentTsid');
        if (storedTsid && !currentTsid) {
            currentTsid = storedTsid;
            console.log('📦 TS-ID restaurado do sessionStorage:', currentTsid);
        }
    }
    restoreTsidFromStorage();
    
    // 2. Verificar se temos um TS-ID válido
    const isTsidValidated = validationCard.classList.contains('tsid-validated');
    const hasCurrentTsid = currentTsid && currentTsid.trim() !== '';
    const tsidFromPath = getTsidFromPath();
    
    if (!hasCurrentTsid && !isTsidValidated && !tsidFromPath) {
        showMessage(
            '<div class="error-header"><i class="fas fa-exclamation-triangle"></i><strong>Ṫ͏͏S-ID ausente</strong></div><p>O Ṫ͏͏S-ID não foi encontrado. Recarregue a página e tente novamente.</p>',
            'error'
        );
        setInputStatus(cpfInput, 'error', 'Ṫ͏͏S-ID ausente — recomece o fluxo');
        return;
    }

    const cpfRaw = cpfInput.value || '';
    const cpf = onlyDigits(cpfRaw);

    if (cpf.length !== 11) {
        showMessage(
            '<div class="error-header"><i class="fas fa-exclamation-triangle"></i><strong>CPF inválido</strong></div><p>Informe um CPF válido com 11 dígitos.</p>',
            'error'
        );
        setInputStatus(cpfInput, 'error', 'CPF inválido — precisa ter 11 dígitos');
        return;
    }

    const btn = findSubmitButton(cpfForm);
    setButtonLoading(btn, 'Validando CPF...');
    setInputStatus(cpfInput, 'validating', 'Validando CPF — iniciando verificação...');

    // *** CORREÇÃO: Buscar mensagem personalizada apenas se temos um TS-ID real ***
    let apiResponsePromise = null;
    const tsidForMessage = currentTsid || tsidFromPath;
    if (tsidForMessage) {
        console.log('🚀 Iniciando busca de mensagem personalizada em background...');
        apiResponsePromise = fetchPersonalizedMessage(tsidForMessage)
            .then(response => {
                if (response) {
                    console.log('✅ Mensagem personalizada carregada com sucesso');
                } else {
                    console.log('⚠️ Mensagem personalizada não disponível - usando fallback local');
                }
                return response;
            })
            .catch(err => {
                console.error('❌ Erro crítico ao buscar mensagem personalizada:', err);
                return null;
            });
    }

    // Mensagens próprias para o fluxo do CPF (cada uma 3s)
    const etapasCpf = [
        'Consultando registro nacional do cidadão...',
        'Verificando correspondência entre CPF e Ṫ͏͏S-ID...',
        'Confirmando integridade e assinatura digital dos dados...',
        'Aplicando verificações de segurança criptográfica...'
    ];

    // *** CORREÇÃO: Usar currentTsid OU tsidFromPath ***
    const tsidToValidate = currentTsid || tsidFromPath;
    
    if (!tsidToValidate) {
        showMessage(
            '<div class="error-header"><i class="fas fa-exclamation-triangle"></i><strong>Erro interno</strong></div><p>Não foi possível obter o TS-ID para validação.</p>',
            'error'
        );
        setInputStatus(cpfInput, 'error', 'Erro interno — TS-ID não disponível');
        restoreButton(btn);
        return;
    }

    // Preparar URL e options para validação principal - MESMA ROTA EXISTENTE
    const url = `${QR_VERSION_PATH}/${encodeURIComponent(tsidToValidate)}/validate`;
    const formBody = new URLSearchParams();
    formBody.append('cpf', cpf);
    const fetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody.toString()
    };

    console.log('🌐 Fazendo requisição para:', url);

    // *** CORREÇÃO: Disparar ambas as requisições em paralelo ***
    const validationPromise = attemptFetchWithRetries(url, fetchOptions, 3, 500)
        .then(({ resp, txt }) => ({ resp, txt }))
        .catch(err => ({ error: err }));

    // *** Processar animações enquanto as requisições rodam em background ***
    for (let i = 0; i < etapasCpf.length; i++) {
        const mensagem = etapasCpf[i];
        const etapaStartTime = Date.now();
        
        // Atualiza a mensagem atual
        setInputStatus(cpfInput, 'validating', mensagem);
        
        // Aguarda exatamente 3 segundos para esta mensagem
        await new Promise(resolve => {
            const checkTime = () => {
                const tempoDecorrido = Date.now() - etapaStartTime;
                if (tempoDecorrido >= 3000) {
                    resolve();
                } else {
                    setTimeout(checkTime, 100);
                }
            };
            checkTime();
        });
    }

    // Exibe mensagem de "finalizando" antes de renderizar o resultado final
    setInputStatus(cpfInput, 'validating', 'Finalizando validação...');
    
    // Aguarda 1 segundo para a mensagem final também
    await new Promise(resolve => {
        const finalStartTime = Date.now();
        const checkFinalTime = () => {
            const tempoDecorrido = Date.now() - finalStartTime;
            if (tempoDecorrido >= 1000) {
                resolve();
            } else {
                setTimeout(checkFinalTime, 100);
            }
        };
        checkFinalTime();
    });

    try {
        // *** Aguardar ambas as promises que já estão processando ***
        const [validationResult, apiResponse] = await Promise.all([
            validationPromise,
            apiResponsePromise
        ]);

        if (validationResult.error) throw validationResult.error;

        const resp = validationResult.resp;
        const txt = validationResult.txt || '';

        if (!resp) throw new Error('Resposta indefinida do servidor');

        if (resp.ok && /<h3>\s*SUCESSO/i.test(txt)) {
            const preMatch = txt.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
            let parsed = null;
            if (preMatch && preMatch[1]) {
                try {
                    parsed = JSON.parse(preMatch[1]);
                } catch (e) {
                    log('Aviso: falha ao parsear JSON de resposta (raw):', e);
                }
            }

            if (parsed) {
                const dados = parsed.dados || {};
                const cfg = parsed.config || {};
                const tsidFinal = parsed.tsid || 'N/A';
                const displayTsid = tsidFinal.replace(/_base62.*$/, '');
                
                // --- Expor dados do backend para outros scripts (consent-manager.js) ---
                try {
                    // 1) nome que o backend retornou (fonte de verdade)
                    if (apiResponse && apiResponse.patientName) {
                        document.body.dataset.patientFullName = String(apiResponse.patientName).trim();
                    } else if (parsed && parsed.dados && parsed.dados.nome) {
                        document.body.dataset.patientFullName = String(parsed.dados.nome).trim();
                    }

                    // 2) sinal de paciente especial (VIP)
                    if (typeof apiResponse?.isSpecialPatient !== 'undefined') {
                        document.body.dataset.patientIsSpecial = apiResponse.isSpecialPatient ? '1' : '0';
                    } else {
                        document.body.dataset.patientIsSpecial = document.body.dataset.patientIsSpecial || '0';
                    }

                    // 3) displayName específico vindo do backend
                    let vipDisplay = '';
                    if (apiResponse?.specialPatientInfo?.displayName) {
                        vipDisplay = String(apiResponse.specialPatientInfo.displayName).trim();
                    } else if (apiResponse?.message) {
                        const msg = String(apiResponse.message);
                        const boldMatch = msg.match(/\*\*(.*?)\*\*/);
                        if (boldMatch && boldMatch[1]) {
                            vipDisplay = boldMatch[1].trim();
                        } else {
                            const plain = msg.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                            const nameMatch = plain.match(/([A-ZÀ-Ý][\wÀ-ÿ'´`-]+(?:\s+[A-ZÀ-Ý][\wÀ-ÿ'´`-]+){0,6})/);
                            if (nameMatch && nameMatch[1]) vipDisplay = nameMatch[1].trim();
                        }
                    }

                    if (vipDisplay) {
                        document.body.dataset.patientSpecialDisplayName = vipDisplay;
                    }

                    // 4) gênero (se disponível em parsed.dados)
                    if (parsed?.dados?.genero) {
                        document.body.dataset.patientGender = String(parsed.dados.genero).trim();
                    }
                } catch (e) {
                    console.warn('Falha ao setar document.body.dataset.* (não crítico):', e);
                }

                // === OBTER DATA FORMATADA ===
                const createdAtBR = parsed.createdAtBR || 'Data não disponível';

                // Extrair apenas o primeiro nome do paciente
                const nomeCompleto = dados.nome || '';
                const primeiroNome = nomeCompleto.split(' ')[0] || 'Paciente';
                const genero = dados.genero || null;
                
                updateGreetingWithName(primeiroNome, genero, apiResponse);

                // === ATUALIZAR O HTML PARA INCLUIR A DATA ===
      // === ATUALIZAR O HTML PARA INCLUIR OS NOVOS CAMPOS ===
const patientDataHTML = [
'<div class="validation-success-container">' +
    '<div class="success-content">' +
        '<h3 class="success-title">Validação Concluída com Sucesso!</h3>' +
        '<p class="success-tsid">Ṫ͏͏S-ID: <strong>' + escapeHtml(displayTsid) + '</strong></p>' +
    '</div>' +
'</div>',
'<h4><i class="fas fa-user-circle"></i> Dados do Paciente</h4>',
'<div class="data-grid">',
createDataItem('fas fa-user', 'Nome Completo', escapeHtml(dados.nome || '-').toUpperCase()),
createDataItem('fas fa-id-card', 'CPF', escapeHtml(dados.cpf || '-')),
createDataItem('fas fa-birthday-cake', 'Data de Nascimento', escapeHtml(dados.dataNasc || dados['data-nasc'] || '-')),
createDataItem('fas fa-venus-mars', 'Gênero', escapeHtml(dados.genero || '-').toUpperCase()),
createDataItem('fas fa-female', 'Filiação (Mãe)', escapeHtml(dados.filiacaoMae || '-').toUpperCase()),
createDataItem('fas fa-male', 'Filiação (Pai)', escapeHtml(dados.filiacaoPai || '-').toUpperCase()),
createDataItem('fas fa-hospital', 'CNS', escapeHtml(dados.cns || '-')),
'</div>',
createPriorityDisplay(parsed.prioridades), // NOVO: Prioridades
createColorDisplay(cfg),
createPartnershipDisplay(parsed.parceria), // NOVO: Parceria
'<div class="data-grid" style="margin-top: 20px;">' +
    createDataItem('fas fa-calendar-check', 'Data de Geração:', escapeHtml(createdAtBR)) +
'</div>'
].join('');

setInputStatus(cpfInput, 'success', 'Validação concluída com sucesso');
showSuccessState(patientDataHTML);

// 🔄 NOVO: Sincronizar com ConsentManager
syncConsentManagerAfterValidation();

log('Validação SUCESSO para', tsidToValidate);
				
				
            } else {
                // resposta ok, mas sem JSON parseável
                showMessage('<h3>SUCESSO</h3><pre>' + escapeHtml(txt) + '</pre>', 'success');
                setInputStatus(cpfInput, 'success', 'Validação concluída');
                log('Validação SUCESSO (raw) para', tsidToValidate);
            }
        } else {
            // resp não-ok (4xx/5xx) - extrair motivo se tiver
            const reasonMatch = txt ? txt.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i) : null;
            const reason = reasonMatch ? reasonMatch[1].replace(/<\/?[^>]+(>|$)/g, '').trim() : (txt ? (txt.substring(0, 300) + (txt.length > 300 ? '...' : '')) : 'Falha na validação');
            showMessage(
                '<div class="error-header"><i class="fas fa-times-circle"></i><strong>Falha na Validação ❌</strong></div><div class="error-details">' +
                    escapeHtml(reason) +
                    '</div>',
                'error'
            );
            setInputStatus(cpfInput, 'error', 'Falha na validação — ' + reason);
            log('Validação FALHOU:', reason, 'status:', (resp && resp.status) || 'N/A');
        }
    } catch (err) {
        // Erros de fetch (ex: todas as tentativas falharam)
        log('Erro comunicação na validação (após retries):', err);
        showMessage(
            '<div class="error-header"><i class="fas fa-exclamation-triangle"></i><strong>Erro de Comunicação</strong></div><div class="error-details">' +
                escapeHtml(err.message || err) +
                '</div>',
            'error'
        );
        setInputStatus(cpfInput, 'error', 'Erro de comunicação durante a validação');
    } finally {
        restoreButton(btn);
    }
}

// --- Função para criar display de prioridades ---
function createPriorityDisplay(prioridades) {
    if (!prioridades || !Array.isArray(prioridades) || prioridades.length === 0) return '';

    const tiposPrioridade = {
        idoso: { nome: 'Idoso', fallback: 'fas fa-hand-holding-heart' },
        crianca: { nome: 'Criança', fallback: 'fas fa-child' },
        gestante: { nome: 'Gestante', fallback: 'fas fa-person-pregnant' },
        autista: { nome: 'Autista', fallback: 'fas fa-puzzle-piece' },
        deficiente: { nome: 'Deficiente', fallback: 'fas fa-universal-access' },
        cardiaco: { nome: 'Cardíaco', fallback: 'fas fa-heartbeat' },
        diabetico: { nome: 'Diabético', fallback: 'fas fa-syringe' },
        renal: { nome: 'Renal Crônico', fallback: 'fas fa-stethoscope' },
        oncologico: { nome: 'Oncológico', fallback: 'fas fa-ribbon' },
        auditivo: { nome: 'Auditivo', fallback: 'fas fa-ear-listen' },
        surdez: { nome: 'Surdez', fallback: 'fas fa-ear-deaf' },
        visual: { nome: 'Visual', fallback: 'fas fa-blind' },
        visualMonocular: { nome: 'Visual Monocular', fallback: 'fas fa-low-vision' },
        mudo: { nome: 'Mudo', fallback: 'fas fa-hands-asl-interpreting' },
        emergencia: { nome: 'Emergência', fallback: 'fas fa-ambulance' }
    };

    const priorityItems = prioridades.map(prioridade => {
        const tipo = tiposPrioridade[prioridade];
        if (!tipo) return '';
        
        return `
            <div class="priority-item">
                <div class="priority-icon">
                    <i class="${tipo.fallback}"></i>
                </div>
                <div class="priority-info">
                    <div class="priority-label">${tipo.nome}</div>
                </div>
            </div>
        `;
    }).filter(item => item !== '').join('');

    if (!priorityItems) return '';

    return `
        <div class="priority-display">
            <h4><i class="fas fa-star-of-life"></i> Prioridades do Paciente</h4>
            <div class="priority-grid">
                ${priorityItems}
            </div>
        </div>
    `;
}


// --- Função para criar display de parceria ---
function createPartnershipDisplay(parceria) {
    if (!parceria || !parceria.parceriaAtiva || !parceria.parceiro) return '';

    const parceiro = parceria.parceiro;
    
    // Só mostra campos que têm valor
    const partnershipItems = [];
    
    if (parceiro.titulo && parceiro.titulo.trim() !== '') {
        partnershipItems.push(createDataItem('fas fa-user-tie', 'Título', escapeHtml(parceiro.titulo)));
    }
    
    if (parceiro.nome && parceiro.nome.trim() !== '') {
        partnershipItems.push(createDataItem('fas fa-user', 'Nome', escapeHtml(parceiro.nome)));
    }
    
    if (parceiro.profissao && parceiro.profissao.trim() !== '') {
        partnershipItems.push(createDataItem('fas fa-briefcase', 'Profissão', escapeHtml(parceiro.profissao)));
    }
    
    if (parceiro.comunidade && parceiro.comunidade.trim() !== '') {
        partnershipItems.push(createDataItem('fas fa-users', 'Comunidade', escapeHtml(parceiro.comunidade)));
    }

    if (partnershipItems.length === 0) return '';

    return `
        <div class="partnership-display">
            <h4><i class="fas fa-handshake"></i> Parceria</h4>
            <div class="data-grid">
                ${partnershipItems.join('')}
            </div>
        </div>
    `;
}


// --- Atualizar tagline com mensagem personalizada ---
async function updateTaglineWithGender(genero, tsid = null, cpf = null) {
  const taglineElement = document.querySelector('.tagline');
  if (!taglineElement) return;
  
  let personalizedMessage = null;
  
  // Tenta buscar mensagem personalizada da API
  if (tsid) {
    personalizedMessage = await fetchPersonalizedMessage(tsid);
  }
  
  if (personalizedMessage) {
    // Usa a mensagem personalizada da API já processando os **
    updateTaglineWithPersonalizedMessage(personalizedMessage);
  } else {
    // Fallback: montar texto baseado no gênero
    let tratamento = 'bem-vindo(a)';
    
    if (genero) {
      const generoLower = genero.toLowerCase();
      if (generoLower.includes('feminino') || generoLower.includes('f') || generoLower === 'f') {
        tratamento = 'bem-vinda';
      } else if (generoLower.includes('masculino') || generoLower.includes('m') || generoLower === 'm') {
        tratamento = 'bem-vindo';
      }
    }
    
    // No fallback também usamos ** para consistência
    const taglineHTML = `
      <span class="tagline-keyword">Seja **${tratamento}**</span> à <span class="tagline-company">Ṫ͏͏HEÜSOFT</span>. 
      Seu **acesso** foi **validado** com **segurança** e **precisão**.
    `;
    
    updateTaglineWithPersonalizedMessage(taglineHTML);
  }
}

// --- Função para buscar tagline personalizado do servidor (futura implementação) ---
async function fetchCustomTagline(tsid, cpf, genero) {
  try {
    // TODO: Implementar quando a rota estiver disponível
    // const response = await fetch(`/api/tagline/personalizado`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ tsid, cpf, genero })
    // });
    // 
    // if (response.ok) {
    //   const data = await response.json();
    //   return data.tagline; // Retorna o HTML personalizado do servidor
    // }
    
    // Se a rota não existir ou falhar, retorna null para usar o fallback
    return null;
  } catch (error) {
    console.error('Erro ao buscar tagline personalizado:', error);
    return null;
  }
}

// --- Atualizar greeting com nome do paciente E informações especiais ---
function updateGreetingWithName(primeiroNome, genero = null, apiResponse = null) {
  const hour = new Date().getHours();
  let greeting = '';
  let emoji = '👋';
  
  // *** CORREÇÃO: Verifica se é paciente especial ***
  if (apiResponse && apiResponse.isSpecialPatient && apiResponse.specialPatientInfo) {
    const specialInfo = apiResponse.specialPatientInfo;
    
    // Usa o simpleGreeting para pacientes VIP
    if (hour >= 5 && hour < 12) { 
      greeting = `Bom dia, ${specialInfo.simpleGreeting}!`; 
    }
    else if (hour >= 12 && hour < 18) { 
      greeting = `Boa tarde, ${specialInfo.simpleGreeting}!`; 
    }
    else if (hour >= 18 && hour < 24) { 
      greeting = `Boa noite, ${specialInfo.simpleGreeting}!`; 
    }
    else { 
      greeting = `Boa madrugada, ${specialInfo.simpleGreeting}!`; 
    }
    
    // *** CORREÇÃO: Remove chalk do front-end ***
    console.log(`  → Greeting especial: ${greeting}`);
  } else {
    // Para pacientes normais: lógica original
    const nomeCapitalizado = primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase();
    
    if (hour >= 5 && hour < 12) { 
      greeting = `Bom dia, ${nomeCapitalizado}!`; 
    }
    else if (hour >= 12 && hour < 18) { 
      greeting = `Boa tarde, ${nomeCapitalizado}!`; 
    }
    else if (hour >= 18 && hour < 24) { 
      greeting = `Boa noite, ${nomeCapitalizado}!`; 
    }
    else { 
      greeting = `Boa madrugada, ${nomeCapitalizado}!`; 
    }
  }
  
  greetingEl.textContent = greeting;
  greetingEmoji.textContent = emoji;
  
  // *** CORREÇÃO: Usa a mensagem personalizada da API ***
  if (apiResponse && apiResponse.message) {
    updateTaglineWithPersonalizedMessage(apiResponse.message);
  } else {
    updateTaglineWithGender(genero);
  }
}


// --- Nova função para atualizar tagline com mensagem personalizada processando ** ---
function updateTaglineWithPersonalizedMessage(message) {
  const taglineElement = document.querySelector('.tagline');
  if (!taglineElement) return;
  
  // Processa **texto** para <strong>texto</strong>
  let styledMessage = message.replace(/\*\*(.*?)\*\*/g, '<strong class="highlighted-text">$1</strong>');
  
  taglineElement.innerHTML = styledMessage;
}

/**
 * attemptFetchWithRetries
 * - Tenta o fetch imediatamente e re-tenta em caso de erro de rede ou resposta 5xx/429.
 * - Para 4xx não-429, considera erro definitivo e retorna a resposta (sem retries).
 * - Retorna um objeto { resp, txt } quando obtém resposta do servidor (mesmo não-ok),
 *   ou lança erro se todas as tentativas falharem por rede.
 */
async function attemptFetchWithRetries(url, options = {}, maxAttempts = 3, backoffBase = 500) {
  let attempt = 0;
  let lastErr = null;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      log(`fetch attempt ${attempt} -> ${url}`);
      const resp = await fetch(url, options);
      const txt = await resp.text();

      // Se for 200..299: sucesso imediato
      if (resp.ok) {
        log(`fetch ok (attempt ${attempt}) -> status ${resp.status}`);
        return { resp, txt };
      }

      // Se for 429 (rate limit) ou 5xx: podemos tentar novamente
      const status = resp.status || 0;
      if (status === 429 || (status >= 500 && status < 600)) {
        log(`fetch retryable response (attempt ${attempt}) status=${status}`);
        // esperar antes de repetir (backoff exponencial)
        const wait = backoffBase * Math.pow(2, attempt - 1);
        await pause(wait);
        continue;
      }

      // Para outros 4xx (ex: 400, 401, 404) retornamos o resultado — sem retry
      log(`fetch non-retryable response -> status ${status}`);
      return { resp, txt };
    } catch (err) {
      // Erro de rede - tentamos novamente
      lastErr = err;
      log(`fetch network error (attempt ${attempt}):`, err);
      const wait = backoffBase * Math.pow(2, attempt - 1);
      await pause(wait);
      continue;
    }
  }

  // Se saiu do loop, todas as tentativas falharam
  const message = lastErr ? (lastErr.message || String(lastErr)) : 'Falha ao comunicar com o servidor';
  throw new Error(`fetch failed after ${maxAttempts} attempts: ${message}`);
}


// --- Buscar mensagem personalizada da API (COM RETRY E TIMEOUT ESTENDIDO) ---
async function fetchPersonalizedMessage(tsid) {
  const MAX_RETRIES = 3;
  const INITIAL_TIMEOUT = 10000; // 10 segundos
  const BACKOFF_MULTIPLIER = 2;
  
  let lastError = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const timeout = INITIAL_TIMEOUT * Math.pow(BACKOFF_MULTIPLIER, attempt - 1);
      
      console.log(`🔄 Tentativa ${attempt}/${MAX_RETRIES} para mensagem personalizada (timeout: ${timeout}ms)`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`/api/message/welcome`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tsid }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Mensagem personalizada recebida na tentativa ${attempt}`);
        return data;
      } else if (response.status === 502 || response.status === 504) {
        // Gateway errors - podemos tentar novamente
        lastError = new Error(`Gateway error (${response.status}) - tentativa ${attempt}`);
        console.warn(`⚠️ Gateway error, tentando novamente... (${attempt}/${MAX_RETRIES})`);
      } else {
        // Outros erros não são retryable
        lastError = new Error(`HTTP ${response.status}`);
        break;
      }
      
      // Aguarda antes da próxima tentativa (exponential backoff)
      if (attempt < MAX_RETRIES) {
        const backoffTime = 1000 * Math.pow(2, attempt - 1);
        console.log(`⏳ Aguardando ${backoffTime}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
      
    } catch (error) {
      lastError = error;
      
      if (error.name === 'AbortError') {
        console.warn(`⏰ Timeout na tentativa ${attempt} - tentando novamente...`);
      } else {
        console.error(`❌ Erro na tentativa ${attempt}:`, error.message);
      }
      
      // Aguarda antes da próxima tentativa
      if (attempt < MAX_RETRIES) {
        const backoffTime = 1000 * Math.pow(2, attempt - 1);
        console.log(`⏳ Aguardando ${backoffTime}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
  }
  
  console.error(`❌ Todas as tentativas falharam para mensagem personalizada:`, lastError?.message);
  return null;
}



// --- voltar para TSID ---
function handleBackToTsid() {
  validationCard.classList.remove('tsid-validated');
  currentTsid = null;
  tsidInput.value = '';
  cpfInput.value = '';
  
  // *** NOVO: Limpar sessionStorage ***
  sessionStorage.removeItem('currentTsid');
  console.log('🗑️ TS-ID removido do sessionStorage');
  
  // *** NOVO: Reabilitar botão QR Code ***
  const qrCodeButton = document.querySelector('.qr-code-button');
  if (qrCodeButton) {
    qrCodeButton.style.pointerEvents = 'auto';
    qrCodeButton.style.opacity = '1';
    qrCodeButton.style.cursor = 'pointer';
    qrCodeButton.classList.remove('disabled');
  }
  
  // Restaurar greeting original
  setGreeting();
  
  // *** NOVO: Restaurar tagline original ***
  const taglineElement = document.querySelector('.tagline');
  if (taglineElement) {
    taglineElement.innerHTML = `
      <span class="tagline-keyword">Seja bem-vindo(a)</span> à <span class="tagline-company">Ṫ͏͏HEÜSOFT</span>. 
      Seu <span class="tagline-keyword">acesso</span> foi <span class="tagline-keyword">validado</span> com <span class="tagline-keyword">segurança</span> e 
      <span class="tagline-keyword">precisão</span>.
    `;
  }
  
  showTsidForm();
  cardDescription.textContent = 'Informe o Ṫ͏͏S-ID para iniciar a validação';
  resultEl.style.display = 'none';
}


// --- Parse da URL / path (atualizada) ---
function getTsidFromPath() {
    const path = location.pathname || '';
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2 && parts[0].toLowerCase() === QR_VERSION_PATH.replace('/', '').toLowerCase()) {
        return parts[1];
    }
    const queryTsid = new URLSearchParams(location.search).get('tsid');
    if (queryTsid) {
        setTimeout(() => {
            window.location.href = `${QR_VERSION_PATH}/${encodeURIComponent(queryTsid)}`;
        }, 100);
        return null;
    }
    
    // *** NOVO: Verificar sessionStorage para QR Scanner ***
    const qrTsid = sessionStorage.getItem('qr_validated_tsid');
    if (qrTsid) {
        console.log('🔍 TS-ID encontrado no sessionStorage (QR Scanner):', qrTsid);
        return qrTsid;
    }
    
    return null;
}

  // --- inicialização da página ---
  function setGreeting() {
    const hour = new Date().getHours();
    let greeting = '';
    let emoji = '👋';
    if (hour >= 5 && hour < 12) { greeting = 'Bom dia!'; }
    else if (hour >= 12 && hour < 18) { greeting = 'Boa tarde!'; }
    else if (hour >= 18 && hour < 24) { greeting = 'Boa noite!'; }
    else { greeting = 'Boa madrugada!'; }
    greetingEl.textContent = greeting;
    greetingEmoji.textContent = emoji;
  }


function init() {
  setGreeting();

  // --- NOVO: Configurar sincronização com QR Scanner ---
  function setupQRCodeSync() {
      // Listener para evento de TS-ID validado via QR Code
      window.addEventListener('tsid:validated', function(event) {
          const tsid = event.detail.tsid;
          console.log('📱 TS-ID recebido do QR Scanner:', tsid);
          
          // Definir currentTsid
          currentTsid = tsid;
          
          // Garantir que a classe de validação está aplicada
          validationCard.classList.add('tsid-validated');
          
          // Mostrar formulário CPF
          showCpfForm();
          
          // Atualizar botão para "Validar CPF"
          const cpfBtn = findSubmitButton(cpfForm);
          if (cpfBtn) {
              cpfBtn.innerHTML = `<span class="btn-content"><i class="fas fa-check-circle"></i> Validar CPF</span>`;
          }
          
          console.log('✅ Fluxo QR Code sincronizado com sucesso');
      });
  }

  // --- NOVO: Restaurar TS-ID do sessionStorage ---
  function restoreTsidFromStorage() {
      const storedTsid = sessionStorage.getItem('currentTsid');
      if (storedTsid && !currentTsid) {
          currentTsid = storedTsid;
          console.log('📦 TS-ID restaurado do sessionStorage:', currentTsid);
      }
  }

  setupQRCodeSync();

  // --- splash: agora espera tempo mínimo E carregamento da logo (cache) ---
  const splashTime = Date.now() - splashStartTime;
  const remainingTime = Math.max(0, MIN_SPLASH_TIME - splashTime);

  // Helper: tenta recuperar a splash do cache localStorage (mesma estrutura do cache usado no outro script)
  const getCachedSplashLogo = () => {
    try {
      const raw = localStorage.getItem('theusoft_logos_cache');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // parsed.data expected to have key SPLASH
      if (parsed && parsed.data && typeof parsed.data.SPLASH === 'string' && parsed.data.SPLASH.trim()) {
        return parsed.data.SPLASH;
      }
      return null;
    } catch (e) {
      // falha ao ler/parsar cache — ignora e prossegue
      return null;
    }
  };

  // Função que realiza a lógica sincronizada de tempo + carregamento da imagem
  const handleSplashHideWithLogo = () => {
	  
	 let dotCount = 0;

  setInterval(() => {
    dotCount = (dotCount + 1) % 4; // vai de 0 a 3
    dots.textContent = '.'.repeat(dotCount); // adiciona os pontos
  }, 1000); // a cada 1sg muda  
	  
	  
    const splashImg = document.getElementById('theusoft-logo-splash');
    const cachedLogo = getCachedSplashLogo();

    // Promise que aguarda o tempo restante mínimo de splash
    const timePromise = new Promise(resolve => setTimeout(resolve, remainingTime));

    // Se não há imagem no DOM ou não há cache, apenas aguarda o tempo e esconde
    if (!splashImg || !cachedLogo) {
      // comportamento original: aguarda remainingTime e oculta
      timePromise.then(() => {
        try {
          splashScreen.style.opacity = '0';
          setTimeout(() => {
            splashScreen.style.display = 'none';
            mainContent.style.display = 'block';
          }, 500);
        } catch (e) { /* ignore */ }
      });
      return;
    }

    // Se houver cache e elemento, assegura que o src esteja definido para a Base64 do cache
    try {
      const currentSrc = splashImg.getAttribute('src') || '';
      if (currentSrc !== cachedLogo) {
        // define src via setAttribute (mantém outros atributos e estilos)
        splashImg.setAttribute('src', cachedLogo);
      }
    } catch (e) {
      // se falhar ao setar, apenas logamos e prosseguimos com as promessas
      console.warn('[Splash] falha ao setar src da logo do splash', e);
    }

    // Promise que resolve quando a imagem carregar (ou timeout curto)
    const MAX_IMAGE_WAIT = 1500; // ms — não bloqueia por muito tempo
    const imagePromise = new Promise(resolve => {
      let settled = false;
      const cleanup = () => {
        if (!splashImg) return;
        splashImg.onload = null;
        splashImg.onerror = null;
      };

      const onLoadOrError = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };

      // Se já estiver carregada (browser pode marcar complete)
      try {
        if (splashImg.complete && splashImg.naturalWidth > 0) {
          settled = true;
          resolve();
          return;
        }
      } catch (e) {
        // ignore
      }

      // handlers
      splashImg.onload = onLoadOrError;
      splashImg.onerror = onLoadOrError;

      // fallback timeout para não travar a splash indefinidamente
      setTimeout(() => {
        if (!settled) {
          settled = true;
          cleanup();
          // um aviso leve no console
          console.warn('[Splash] tempo máximo de espera por carregamento da logo excedido; prosseguindo.');
          resolve();
        }
      }, MAX_IMAGE_WAIT);
    });

    // Aguarda ambos: tempo mínimo E imagem carregada (ou timeout)
    Promise.all([timePromise, imagePromise]).then(() => {
      try {
        splashScreen.style.opacity = '0';
        setTimeout(() => {
          splashScreen.style.display = 'none';
          mainContent.style.display = 'block';
        }, 500);
      } catch (e) { /* ignore */ }
    });
  };

  // chama a nova rotina de splash
  handleSplashHideWithLogo();
  // cache default hints
  cacheInputHints();

  // TSID detection in path
  const tsid = getTsidFromPath();
  if (tsid) {
    currentTsid = tsid;
    showCpfForm();
    cardDescription.textContent = 'Informe o CPF do paciente para validar o cartão de identificação';
    
    // *** CORREÇÃO: Atualizar o texto do botão quando TS-ID vem da URL ***
    const cpfBtn = findSubmitButton(cpfForm);
    if (cpfBtn) {
      cpfBtn.innerHTML = `<span class="btn-content"><i class="fas fa-check-circle"></i> Validar CPF</span>`;
    }
    
    if (cardHeaderTitle) {
      cardHeaderTitle.textContent = 'Validação do CPF do Paciente';
    }
    
    validationCard.classList.add('tsid-validated');
  } else {
    // *** NOVO: Tentar restaurar TS-ID do QR Scanner ***
    restoreTsidFromStorage();
    if (currentTsid) {
      showCpfForm();
      cardDescription.textContent = 'Informe o CPF do paciente para validar o cartão de identificação';
      
      const cpfBtn = findSubmitButton(cpfForm);
      if (cpfBtn) {
        cpfBtn.innerHTML = `<span class="btn-content"><i class="fas fa-check-circle"></i> Validar CPF</span>`;
      }
      
      if (cardHeaderTitle) {
        cardHeaderTitle.textContent = 'Validação do CPF do Paciente';
      }
      
      validationCard.classList.add('tsid-validated');
    } else {
      showTsidForm();
      cardDescription.textContent = 'Informe o Ṫ͏͏S-ID para iniciar a validação';
    }
  }

  // listeners
  cpfInput.addEventListener('input', formatCPF);
  tsidInput.addEventListener('input', handleTsidInput);
  tsidInput.addEventListener('blur', validateTsidPrefix);
  tsidForm.addEventListener('submit', handleTsidSubmit);
  cpfForm.addEventListener('submit', handleCpfSubmit);
  logoutBtn.addEventListener('click', handleLogout);

  // accessibility: make sure submit buttons have proper initial data-original-html stored
  const allPrimaryBtns = document.querySelectorAll('.btn-primary');
  allPrimaryBtns.forEach(btn => {
    if (!btn.dataset.originalHtml) btn.dataset.originalHtml = btn.innerHTML;
  });

  // ensure input text alignment (original CSS does center)
  tsidInput.style.textAlign = 'center';
  cpfInput.style.textAlign = 'center';

  log('init complete');
}


// --- NOVA FUNÇÃO: Sincronizar ConsentManager após validação ---
function syncConsentManagerAfterValidation() {
    console.log('🔄 [validate.js] Sincronizando ConsentManager após validação...');
    
    // Aguardar o ConsentManager estar disponível
    const waitForConsentManager = () => {
        if (typeof window.consentManager !== 'undefined' && window.consentManager) {
            console.log('✅ [validate.js] ConsentManager encontrado, atualizando TS-ID...');
            
            // Atualizar TS-ID no ConsentManager
            window.consentManager.currentTsid = currentTsid;
            console.log('📦 [validate.js] TS-ID definido no ConsentManager:', currentTsid);
            
            // Forçar verificação do status do PDF
            setTimeout(() => {
                if (window.consentManager.checkPdfStatusAndUpdateUI) {
                    console.log('🔄 [validate.js] Forçando verificação do PDF...');
                    window.consentManager.checkPdfStatusAndUpdateUI();
                }
            }, 1000);
            
        } else {
            console.log('⏳ [validate.js] ConsentManager não disponível, tentando novamente...');
            setTimeout(waitForConsentManager, 500);
        }
    };
    
    waitForConsentManager();
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

})();
