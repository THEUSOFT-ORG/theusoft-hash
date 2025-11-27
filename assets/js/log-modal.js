/* =========================
   JS: Modal de Logs - Versão Atualizada
   ========================= */

class LogModal {
    constructor() {
        console.log('🔧 LogModal: Iniciando construtor');
        this.isMinimized = true;
        this.isMaximized = false;
        this.isVisible = false;
        this.unreadLogs = 0;
        this.allLogs = [];
        this.originalPosition = { x: 0, y: 0 };
        this.originalSize = { width: '', height: '' };
        
        this.init();
    }

init() {
    console.log('🔧 LogModal: Iniciando criação do modal');
    // Referências aos elementos existentes no HTML
    this.modal = document.getElementById('logCard');
    this.toggle = document.getElementById('logToggle');
    this.logArea = document.getElementById('logArea');
    this.minimizeBtn = document.getElementById('logMinimize');
    this.closeBtn = document.getElementById('logClose');
    this.counter = document.getElementById('logCounter');
    this.toggleCounter = document.getElementById('logToggleCounter');

    // Adicionar botão de maximizar se não existir
    this.addMaximizeButton();
    
    // Salvar posição e tamanho original
    this.saveOriginalState();
    
    // Ocultar modal inicialmente
    this.hideModal();
    
    // Configurar visibilidade inicial dos botões
    this.updateButtonVisibility();
    
    this.bindEvents();
    console.log('✅ LogModal: Modal inicializado com sucesso');
}

 addMaximizeButton() {
        const modalActions = this.modal.querySelector('.modal-actions');
        const existingMaximizeBtn = document.getElementById('logMaximize');
        
        if (!existingMaximizeBtn && modalActions) {
            const maximizeBtn = document.createElement('button');
            maximizeBtn.id = 'logMaximize';
            maximizeBtn.className = 'modal-btn';
            maximizeBtn.title = 'Maximizar';
            maximizeBtn.innerHTML = '<i class="fa-solid fa-window-maximize"></i>';
            
            // Inserir antes do botão de fechar
            const closeBtn = document.getElementById('logClose');
            if (closeBtn) {
                modalActions.insertBefore(maximizeBtn, closeBtn);
            } else {
                modalActions.appendChild(maximizeBtn);
            }
            
            this.maximizeBtn = maximizeBtn;
        } else {
            this.maximizeBtn = existingMaximizeBtn;
        }
    }

    saveOriginalState() {
        if (this.modal) {
            const rect = this.modal.getBoundingClientRect();
            this.originalPosition = {
                x: rect.left,
                y: rect.top
            };
            this.originalSize = {
                width: this.modal.style.width || '500px',
                height: this.modal.style.height || '400px'
            };
        }
    }

    bindEvents() {
        console.log('🔧 LogModal: Configurando eventos');
        
        // Toggle do modal
        if (this.toggle) {
            this.toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showModal();
            });
        }

        // Botões do modal
        if (this.minimizeBtn) {
            this.minimizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.minimize();
            });
        }

        if (this.maximizeBtn) {
            this.maximizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMaximize();
            });
        }

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hideModal();
            });
        }

        // Drag do modal
        this.setupDrag();

        // Duplo clique no header para maximizar/restaurar
        this.setupDoubleClickMaximize();

        // Redimensionar janela para ajustar limites
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });

        console.log('✅ LogModal: Eventos configurados');
    }

    setupDrag() {
        const header = this.modal.querySelector('.modal-header');
        if (!header) {
            console.error('❌ LogModal: Header não encontrado para drag');
            return;
        }

        let isDragging = false;
        let startX, startY, initialX = 0, initialY = 0;

        const dragStart = (e) => {
            // Não permitir drag quando maximizado
            if (this.isMaximized) return;
            
            isDragging = true;
            startX = e.clientX || e.touches[0].clientX;
            startY = e.clientY || e.touches[0].clientY;
            initialX = this.modal.offsetLeft;
            initialY = this.modal.offsetTop;
            this.modal.style.transition = 'none';
        };

        const drag = (e) => {
            if (!isDragging || this.isMaximized) return;
            e.preventDefault();
            
            const currentX = e.clientX || e.touches[0].clientX;
            const currentY = e.clientY || e.touches[0].clientY;
            
            const deltaX = currentX - startX;
            const deltaY = currentY - startY;
            
            // Calcular nova posição
            let newX = initialX + deltaX;
            let newY = initialY + deltaY;
            
            // Aplicar limites para não vazar da tela
            newX = this.applyHorizontalLimits(newX);
            newY = this.applyVerticalLimits(newY);
            
            this.modal.style.left = `${newX}px`;
            this.modal.style.top = `${newY}px`;
        };

        const dragEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            this.modal.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        };

        header.addEventListener('mousedown', dragStart);
        header.addEventListener('touchstart', dragStart, { passive: true });
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag, { passive: false });
        
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchend', dragEnd);
    }

    applyHorizontalLimits(x) {
        const modalWidth = this.modal.offsetWidth;
        const minX = 25; // Margem mínima da esquerda
        const maxX = window.innerWidth - modalWidth - 25; // Margem mínima da direita
        
        return Math.max(minX, Math.min(maxX, x));
    }

    applyVerticalLimits(y) {
        const modalHeight = this.modal.offsetHeight;
        const topbarHeight = this.getTopbarHeight();
        const footerHeight = this.getFooterHeight();
        const minY = topbarHeight + 10; // Abaixo do topbar
        const maxY = window.innerHeight - modalHeight - footerHeight - 10; // Acima do footer
        
        return Math.max(minY, Math.min(maxY, y));
    }

    getTopbarHeight() {
        const topbar = document.querySelector('.ts-topbar');
        return topbar ? topbar.offsetHeight : 82;
    }

    getFooterHeight() {
        const footer = document.querySelector('.ts-footer');
        return footer ? footer.offsetHeight : 60;
    }

    setupDoubleClickMaximize() {
        const header = this.modal.querySelector('.modal-header');
        if (header) {
            header.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                this.toggleMaximize();
            });
        }
    }

    handleWindowResize() {
        // Se estiver maximizado, ajustar para respeitar os limites
        if (this.isMaximized) {
            this.applyMaximizeConstraints();
        }
        
        // Se estiver em posição normal, garantir que não saia da tela
        if (this.isVisible && !this.isMaximized) {
            this.keepInViewport();
        }
    }

// Controles de visibilidade - CORREÇÃO
showModal() {
    console.log('🔧 LogModal: Mostrando modal');
    this.modal.classList.remove('hidden');
    this.toggle.classList.add('hidden');
    this.isVisible = true;
    
    // SEMPRE abrir o modal (não apenas minimizar/abrir)
    this.open();
}

hideModal() {
    console.log('🔧 LogModal: Ocultando modal');
    this.modal.classList.add('hidden');
    this.toggle.classList.remove('hidden');
    this.isVisible = false;
    
    // Apenas minimizar, não resetar o estado
    this.minimize();
}

// Modifique a função open:
open() {
    console.log('🔧 LogModal: Abrindo modal');
    this.modal.classList.remove('minimized');
    this.isMinimized = false;
    this.markAsRead();
    
    // Atualizar visibilidade dos botões
    this.updateButtonVisibility();
    
    // Verificar e corrigir posição se necessário
    setTimeout(() => {
        this.checkAndReposition();
    }, 100);
    
    // Atualizar logs
    this.updateLogDisplay(this.allLogs);
    
    console.log('✅ LogModal: Modal aberto');
}

// Modifique a função minimize para garantir o comportamento correto:
minimize() {
    console.log('🔧 LogModal: Minimizando modal');
    this.modal.classList.add('minimized');
    this.isMinimized = true;
    this.isMaximized = false; // Garantir que não está maximizado quando minimizar
    
    // Atualizar visibilidade dos botões
    this.updateButtonVisibility();
    
    console.log('✅ LogModal: Modal minimizado');
}

// Modifique a função maximize:
maximize() {
    console.log('🔧 LogModal: Maximizando modal');
    
    // Salvar estado atual antes de maximizar
    if (!this.isMaximized) {
        this.originalPosition = {
            x: this.modal.offsetLeft,
            y: this.modal.offsetTop
        };
        this.originalSize = {
            width: this.modal.style.width || getComputedStyle(this.modal).width,
            height: this.modal.style.height || getComputedStyle(this.modal).height
        };
    }
    
    this.applyMaximizeConstraints();
    this.isMaximized = true;
    this.modal.classList.add('maximized');
    
    // Atualizar visibilidade dos botões
    this.updateButtonVisibility();
    
    console.log('✅ LogModal: Modal maximizado');
}

// Modifique a função restore:
restore() {
    console.log('🔧 LogModal: Restaurando modal');
    
    // Restaurar tamanho e posição
    this.modal.style.width = this.originalSize.width;
    this.modal.style.height = this.originalSize.height;
    this.modal.style.left = `${this.originalPosition.x}px`;
    this.modal.style.top = `${this.originalPosition.y}px`;
    this.modal.style.right = '';
    this.modal.style.bottom = '';
    this.modal.style.maxWidth = '';
    this.modal.style.maxHeight = '';
    
    this.isMaximized = false;
    this.modal.classList.remove('maximized');
    
    // Atualizar visibilidade dos botões
    this.updateButtonVisibility();
    
    console.log('✅ LogModal: Modal restaurado');
}
// Modifique a função toggleMaximize:
toggleMaximize() {
    if (this.isMinimized) {
        // Se está minimizado, abrir primeiro
        this.open();
        // Depois maximizar
        this.maximize();
    } else if (this.isMaximized) {
        this.restore();
    } else {
        this.maximize();
    }
}


applyMaximizeConstraints() {
    const topbarHeight = this.getTopbarHeight();
    const footerHeight = this.getFooterHeight();
    
    // MARGENS CONSISTENTES - SEMPRE POSICIONAR NO TOPO COM MARGEM
    const topMargin = topbarHeight + 15;
    const bottomMargin = footerHeight + 15;
    
    // FORÇAR POSICIONAMENTO CORRETO - ignorar posição atual
    this.modal.style.width = `calc(100vw - 40px)`;
    this.modal.style.height = `calc(100vh - ${topMargin + bottomMargin}px)`;
    this.modal.style.left = '20px';
    this.modal.style.top = `${topMargin}px`;
    this.modal.style.right = 'auto'; // ← GARANTIR que não haja conflito
    this.modal.style.bottom = 'auto'; // ← GARANTIR que não haja conflito
    this.modal.style.maxWidth = 'none';
    this.modal.style.maxHeight = 'none';
    
    console.log('📏 LogModal: Constraints aplicadas - Posicionado em:', {
        top: this.modal.style.top,
        height: this.modal.style.height
    });
}


// Adicione esta função para verificar e corrigir a posição se necessário
checkAndReposition() {
    const footerHeight = this.getFooterHeight();
    const modalBottom = this.modal.offsetTop + this.modal.offsetHeight;
    const viewportHeight = window.innerHeight;
    
    // Se o modal está muito perto do footer, reposicionar
    if (modalBottom > viewportHeight - footerHeight - 10) {
        const newY = viewportHeight - this.modal.offsetHeight - footerHeight - 20;
        this.modal.style.top = `${Math.max(this.getTopbarHeight() + 10, newY)}px`;
        console.log('🔄 LogModal: Reposicionado para evitar footer');
    }
}

    keepInViewport() {
        // Garantir que o modal não saia da viewport
        const currentX = parseInt(this.modal.style.left) || this.originalPosition.x;
        const currentY = parseInt(this.modal.style.top) || this.originalPosition.y;
        
        const newX = this.applyHorizontalLimits(currentX);
        const newY = this.applyVerticalLimits(currentY);
        
        this.modal.style.left = `${newX}px`;
        this.modal.style.top = `${newY}px`;
    }

// Simplifique a função updateMaximizeButton:
updateMaximizeButton() {
    if (this.maximizeBtn) {
        const icon = this.maximizeBtn.querySelector('i');
        
        if (this.isMaximized) {
            // Quando maximizado: botão mostra "Restaurar"
            icon.className = 'fa-solid fa-window-restore';
            this.maximizeBtn.title = 'Restaurar';
        } else {
            // Quando normal ou minimizado: botão mostra "Maximizar"  
            icon.className = 'fa-solid fa-window-maximize';
            this.maximizeBtn.title = 'Maximizar';
        }
    }
}

// Substitua a função updateButtonVisibility por esta versão CORRETA:
updateButtonVisibility() {
    if (this.minimizeBtn && this.maximizeBtn && this.closeBtn) {
        if (this.isMinimized) {
            // MINIMIZADO: ✅ Restaurar | ✅ Maximizar | ✅ Fechar
            this.minimizeBtn.style.display = 'none'; // ❌ Ocultar minimizar
            this.maximizeBtn.style.display = 'flex'; // ✅ Mostrar maximizar
            this.closeBtn.style.display = 'flex';    // ✅ Mostrar fechar
            
            // NOVO: Adicionar botão de restaurar se não existir
            this.addRestoreButton();
            
        } else if (this.isMaximized) {
            // MAXIMIZADO: ✅ Minimizar | ✅ Restaurar | ✅ Fechar  
            this.minimizeBtn.style.display = 'flex'; // ✅ Mostrar minimizar
            this.maximizeBtn.style.display = 'flex'; // ✅ Mostrar restaurar (ícone será atualizado)
            this.closeBtn.style.display = 'flex';    // ✅ Mostrar fechar
            
            // Ocultar botão de restaurar separado se existir
            this.hideSeparateRestoreButton();
            
        } else {
            // NORMAL: ✅ Minimizar | ✅ Maximizar | ✅ Fechar
            this.minimizeBtn.style.display = 'flex'; // ✅ Mostrar minimizar
            this.maximizeBtn.style.display = 'flex'; // ✅ Mostrar maximizar
            this.closeBtn.style.display = 'flex';    // ✅ Mostrar fechar
            
            // Ocultar botão de restaurar separado se existir
            this.hideSeparateRestoreButton();
        }
        
        // SEMPRE atualizar o ícone do botão maximizar/restaurar
        this.updateMaximizeButton();
    }
}

// Adicione estas novas funções para gerenciar o botão de restaurar:
addRestoreButton() {
    // Verificar se já existe um botão de restaurar separado
    let restoreBtn = document.getElementById('logRestore');
    
    if (!restoreBtn) {
        const modalActions = this.modal.querySelector('.modal-actions');
        if (modalActions) {
            restoreBtn = document.createElement('button');
            restoreBtn.id = 'logRestore';
            restoreBtn.className = 'modal-btn';
            restoreBtn.title = 'Restaurar';
            restoreBtn.innerHTML = '<i class="fa-solid fa-window-restore"></i>';
            
            // Inserir antes do botão de maximizar
            const maximizeBtn = document.getElementById('logMaximize');
            if (maximizeBtn) {
                modalActions.insertBefore(restoreBtn, maximizeBtn);
            } else {
                modalActions.appendChild(restoreBtn);
            }
            
            // Adicionar evento de clique
            restoreBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.open();
            });
        }
    }
    
    // Mostrar o botão de restaurar
    if (restoreBtn) {
        restoreBtn.style.display = 'flex';
    }
}
hideSeparateRestoreButton() {
    const restoreBtn = document.getElementById('logRestore');
    if (restoreBtn) {
        restoreBtn.style.display = 'none';
    }
}

  // Sistema de logs
    addLog(level, message, data = null) {
        console.log('🔧 LogModal: Adicionando novo log', { level, message });
        
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            level,
            message,
            data,
            timestamp
        };
        
        this.allLogs.push(logEntry);
        this.notifyNewLog();
    }

notifyNewLog() {
    console.log('🔧 LogModal: Notificando novo log', {
        unreadLogs: this.unreadLogs,
        isMinimized: this.isMinimized,
        isVisible: this.isVisible
    });

    // Se o modal não está visível OU está minimizado, contar como não lido
    if (!this.isVisible || this.isMinimized) {
        this.unreadLogs++;
        this.updateCounters();
        this.animateNotification();
    }

    // Se o modal está visível E aberto (não minimizado), atualizar display
    if (this.isVisible && !this.isMinimized) {
        this.updateLogDisplay(this.allLogs);
    }
}
    animateNotification() {
        console.log('🔧 LogModal: Animando notificação');
        if (this.toggle) {
            this.toggle.classList.add('new-log');
            setTimeout(() => {
                this.toggle.classList.remove('new-log');
            }, 800);
        }
    }

    updateCounters() {
        console.log('🔧 LogModal: Atualizando contadores', {
            totalLogs: this.allLogs.length,
            unreadLogs: this.unreadLogs
        });

        if (this.counter) {
            this.counter.textContent = this.allLogs.length;
        }
        
        if (this.toggleCounter) {
            if (this.unreadLogs > 0) {
                this.toggleCounter.textContent = this.unreadLogs;
                this.toggleCounter.style.display = 'flex';
            } else {
                this.toggleCounter.style.display = 'none';
            }
        }
    }

    markAsRead() {
        console.log('🔧 LogModal: Marcando logs como lidos');
        this.unreadLogs = 0;
        this.updateCounters();
        if (this.toggle) {
            this.toggle.classList.remove('new-log');
        }
    }

    updateLogDisplay(logs) {
        console.log('🔧 LogModal: Atualizando display com', logs.length, 'logs');
        
        if (!this.logArea) {
            console.error('❌ LogModal: Área de logs não encontrada');
            return;
        }

        this.allLogs = logs || [];
        
        if (this.allLogs.length === 0) {
            this.logArea.innerHTML = `
                <div style="color: var(--muted); text-align: center; padding: 40px;">
                    <i class="fa-solid fa-inbox" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <div>Nenhuma atividade registrada</div>
                </div>
            `;
            this.updateCounters();
            return;
        }

        // Ordenar logs do mais recente para o mais antigo
        const sortedLogs = [...this.allLogs].reverse();
        
        const logsHTML = sortedLogs.map(log => {
            const color = this.getLogColor(log.level);
            const icon = this.getLogIcon(log.level);
            
            return `
                <div class="log-entry" style="border-left-color: ${color}">
                    <div class="log-time">${log.timestamp}</div>
                    <div class="log-content">
                        <i class="${icon}" style="color: ${color};"></i>
                        <span class="log-level">[${log.level}]</span>
                        <span class="log-message">${log.message}</span>
                    </div>
                    ${log.data ? `<div class="log-data">${JSON.stringify(log.data, null, 2)}</div>` : ''}
                </div>
            `;
        }).join('');

        this.logArea.innerHTML = logsHTML;
        this.updateCounters();

        // Scroll para o final
        setTimeout(() => {
            this.logArea.scrollTop = this.logArea.scrollHeight;
        }, 100);

        console.log('✅ LogModal: Display atualizado com', this.allLogs.length, 'logs');
    }

    getLogColor(level) {
        const colors = {
            'ERROR': '#ff6b6b',
            'WARN': '#ffa500',
            'INFO': '#66e07b',
            'DEBUG': '#5ac8ff'
        };
        return colors[level] || '#97a0aa';
    }

    getLogIcon(level) {
        const icons = {
            'ERROR': 'fa-solid fa-circle-exclamation',
            'WARN': 'fa-solid fa-triangle-exclamation',
            'INFO': 'fa-solid fa-circle-info',
            'DEBUG': 'fa-solid fa-bug'
        };
        return icons[level] || 'fa-solid fa-circle';
    }

    // Debug
    debug() {
        console.log('🔍 LogModal Debug:');
        console.log('- Modal:', this.modal);
        console.log('- Is visible:', this.isVisible);
        console.log('- Is minimized:', this.isMinimized);
        console.log('- Is maximized:', this.isMaximized);
        console.log('- Total logs:', this.allLogs.length);
        console.log('- Unread logs:', this.unreadLogs);
        console.log('- Original position:', this.originalPosition);
        console.log('- Original size:', this.originalSize);
        console.log('- Log area content length:', this.logArea.innerHTML.length);
    }
}

// Sistema global
window.logModalSystem = {
    instance: null,
    
    init() {
        if (!this.instance) {
            this.instance = new LogModal();
            console.log('🚀 Sistema de logs inicializado');
        }
        return this.instance;
    },
    
	// Adicione este método no logModalSystem se ainda não existir
// Substitua o método clearLogs por esta versão CORRETA:
clearLogs: function() {
    const instance = this.getInstance();
    if (instance) {
        console.log('🧹 LogModal: Limpando todos os logs');
        
        // Limpar todos os logs
        instance.allLogs = [];
        instance.unreadLogs = 0;
        
        // Atualizar display
        instance.updateLogDisplay([]);
        instance.updateCounters();
        
        console.log('✅ LogModal: Todos os logs foram limpos');
    }
},


	
    getInstance() {
        return this.instance;
    },
    
// Método para atualizar logs do sistema principal
updateLogs: function(logs) {
    if (this.instance) {
        console.log('📝 Atualizando logs no modal:', logs.length);
        
        // IMPORTANTE: Não adicionar logs duplicados, apenas atualizar a exibição
        // O array allLogs já é mantido pelo sistema principal (STATE.logs)
        this.instance.updateLogDisplay(logs);
    }
},
    
    // Método para adicionar log individual
    addLog(level, message, data) {
        if (this.instance) {
            this.instance.addLog(level, message, data);
        }
    }
};

// Inicialização automática quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.logModalSystem.init();
    });
} else {
    window.logModalSystem.init();
}

console.log('📦 log-modal.js carregado - Sistema pronto');