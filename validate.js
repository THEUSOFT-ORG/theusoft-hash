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



