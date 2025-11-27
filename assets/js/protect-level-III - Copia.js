/* ============================================================
   PROTECT LEVEL 3 — Ṫ͏͏HEÜSOFT SECURITY LAYER
   - Sistema de proteção totalmente dinâmico
   - Modal auto-contido com estilos injetados
   - Efeito Matrix hacker clássico no background
   - Animação de digitação com tradução progressiva
   ============================================================ */

(function() {
    'use strict';

    console.log("🔒 THEUSOFT PROTECT - NÍVEL 3 MATRIX ATIVADO");

    let devtoolsOpen = false;
    let modalVisible = false;
    let protectModal = null;
    let matrixCanvas = null;
    let matrixAnimation = null;
    let typingAnimations = [];

    // ------------------------------------------
    // SISTEMA MATRIX HACKER CLÁSSICO
    // ------------------------------------------
    function createMatrixBackground() {
        const canvas = document.createElement('canvas');
        canvas.id = 'theusoft-matrix-bg';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 2147483646;
            pointer-events: none;
            opacity: 0;
            transition: opacity 1s ease;
            background: #000001;
        `;
        
        document.body.appendChild(canvas);
        return canvas;
    }

    function startMatrixAnimation(canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Caracteres Matrix - apenas caracteres ocidentais e números
        const latin = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        const numbers = "0123456789";
        const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
        const chars = (latin + numbers + symbols).split("");
        
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        
        // Array para armazenar a posição Y de cada coluna
        const drops = [];
        const speeds = []; // Velocidades diferentes para cada coluna
        const brightness = []; // Brilho diferente para cada coluna

        // Inicialização
        for(let i = 0; i < columns; i++) {
            drops[i] = Math.random() * -100; // Começa em posições aleatórias acima da tela
            speeds[i] = Math.random() * 3 + 2; // Velocidade entre 2 e 5
            brightness[i] = Math.random() * 100 + 155; // Brilho entre 155 e 255
        }

        function draw() {
            // Fundo preto semi-transparente para criar efeito de rastro
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = `bold ${fontSize}px 'Courier New', monospace, 'Lucida Console'`;
            
            for(let i = 0; i < drops.length; i++) {
                // Cor verde Matrix com variação de brilho
                const greenValue = brightness[i];
                ctx.fillStyle = `rgb(0, ${greenValue}, 0)`;
                
                // Caractere aleatório
                const text = chars[Math.floor(Math.random() * chars.length)];
                
                // Posição
                const x = i * fontSize;
                const y = drops[i];
                
                // Desenhar caractere
                ctx.fillText(text, x, y);
                
                // Reiniciar a gota quando chegar no final, com aleatoriedade
                if(y > canvas.height && Math.random() > 0.975) {
                    drops[i] = Math.random() * -100;
                    brightness[i] = Math.random() * 100 + 155;
                }
                
                // Mover a gota na velocidade específica
                drops[i] += speeds[i];
            }
        }

        return setInterval(draw, 33);
    }

    function showMatrixBackground() {
        if (!matrixCanvas) {
            matrixCanvas = createMatrixBackground();
            matrixAnimation = startMatrixAnimation(matrixCanvas);
        }
        
        setTimeout(() => {
            matrixCanvas.style.opacity = '1';
        }, 50);
    }

    function hideMatrixBackground() {
        if (matrixCanvas) {
            matrixCanvas.style.opacity = '0';
            setTimeout(() => {
                if (matrixAnimation) {
                    clearInterval(matrixAnimation);
                    matrixAnimation = null;
                }
                if (matrixCanvas && matrixCanvas.parentNode) {
                    matrixCanvas.parentNode.removeChild(matrixCanvas);
                    matrixCanvas = null;
                }
            }, 1000);
        }
    }

    // ------------------------------------------
    // SISTEMA DE DIGITAÇÃO E TRADUÇÃO
    // ------------------------------------------
    function typeWriter(element, originalText, translatedText, speed = 50, startDelay = 0) {
        return new Promise((resolve) => {
            setTimeout(() => {
                let i = 0;
                const originalChars = originalText.split('');
                const translatedChars = translatedText.split('');
                const maxLength = Math.max(originalChars.length, translatedChars.length);
                
                element.innerHTML = '';
                
                function type() {
                    if (i < maxLength) {
                        // Durante a digitação, mostra caracteres misturados
                        if (i < originalChars.length) {
                            // Fase de "corrupção" - mostra caracteres aleatórios
                            const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
                            const currentChar = Math.random() > 0.3 ? 
                                randomChars[Math.floor(Math.random() * randomChars.length)] : 
                                translatedChars[i] || '';
                            
                            element.innerHTML += currentChar;
                        } else {
                            // Fase final - completa a tradução
                            element.innerHTML += translatedChars[i] || '';
                        }
                        
                        i++;
                        setTimeout(type, speed);
                    } else {
                        // Animação final - piscar o cursor
                        let cursorVisible = true;
                        let blinkCount = 0;
                        const maxBlinks = 3;
                        
                        function blinkCursor() {
                            if (blinkCount < maxBlinks * 2) {
                                element.innerHTML = translatedText + (cursorVisible ? '_' : '');
                                cursorVisible = !cursorVisible;
                                blinkCount++;
                                setTimeout(blinkCursor, 300);
                            } else {
                                element.innerHTML = translatedText;
                                resolve();
                            }
                        }
                        
                        blinkCursor();
                    }
                }
                
                type();
            }, startDelay);
        });
    }

    function stopAllTypingAnimations() {
        typingAnimations.forEach(timeout => clearTimeout(timeout));
        typingAnimations = [];
    }

    // ------------------------------------------
    // INJEÇÃO DINÂMICA DE ESTILOS
    // ------------------------------------------
    function injectProtectStyles() {
        const styleId = 'theusoft-protect-styles';
        
        if (document.getElementById(styleId)) return;
        
        const styles = `
            .theusoft-protect-modal {
                position: fixed;
                inset: 0;
                background: rgba(0, 10, 5, 0.85);
                z-index: 2147483647;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 20px;
                box-sizing: border-box;
                animation: theusoftModalFadeIn 0.5s ease-out;
                font-family: 'Courier New', monospace, 'Lucida Console';
                overflow: hidden;
            }

            @keyframes theusoftModalFadeIn {
                from { 
                    opacity: 0;
                    background: rgba(0, 0, 0, 0);
                }
                to { 
                    opacity: 1;
                    background: rgba(0, 10, 5, 0.85);
                }
            }

            .theusoft-protect-modal.active {
                display: flex;
            }

            .theusoft-protect-content {
                max-width: 500px;
                width: 100%;
                background: rgba(0, 20, 10, 0.9);
                border-radius: 2px;
                padding: 0;
                text-align: center;
                box-shadow: 
                    0 0 0 1px rgba(0, 255, 100, 0.3),
                    0 0 20px rgba(0, 255, 100, 0.2),
                    inset 0 0 20px rgba(0, 255, 100, 0.1);
                border: 1px solid rgba(0, 255, 100, 0.5);
                position: relative;
                animation: theusoftContentSlideUp 0.6s ease-out;
                overflow: hidden;
            }

            .theusoft-protect-content::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, 
                    transparent, 
                    #00ff64, 
                    transparent
                );
                animation: theusoftScanline 2s linear infinite;
            }

            @keyframes theusoftScanline {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }

            @keyframes theusoftContentSlideUp {
                from { 
                    opacity: 0; 
                    transform: translateY(30px);
                }
                to { 
                    opacity: 1; 
                    transform: translateY(0);
                }
            }

            .theusoft-protect-header {
                display: flex;
                justify-content: flex-end;
                padding: 15px 15px 0 15px;
                position: relative;
                z-index: 2;
            }

            .theusoft-close-btn {
                background: rgba(0, 255, 100, 0.1);
                border: 1px solid rgba(0, 255, 100, 0.4);
                width: 32px;
                height: 32px;
                border-radius: 2px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                color: rgba(0, 255, 100, 0.8);
                font-size: 18px;
                font-weight: bold;
                font-family: 'Courier New', monospace;
            }

            .theusoft-close-btn:hover {
                background: rgba(0, 255, 100, 0.2);
                border-color: rgba(0, 255, 100, 0.8);
                color: #00ff64;
                box-shadow: 0 0 10px rgba(0, 255, 100, 0.5);
            }

            .theusoft-protect-body {
                padding: 0 30px 30px 30px;
                position: relative;
                z-index: 2;
            }

            .theusoft-protect-logo {
                width: 200px;
                height: auto;
                margin: 0 auto 20px;
                filter: brightness(0) invert(1) sepia(1) hue-rotate(90deg) saturate(3);
                opacity: 0.9;
            }

            .theusoft-protect-title {
                font-size: 18px;
                margin: 0 0 15px;
                color: #00ff64;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 2px;
                text-shadow: 0 0 10px rgba(0, 255, 100, 0.5);
                font-family: 'Courier New', monospace;
                min-height: 1.5em;
            }

            .theusoft-protect-desc {
                font-size: 14px;
                line-height: 1.4;
                margin: 0 0 20px;
                color: rgba(0, 255, 100, 0.8);
                font-weight: normal;
                font-family: 'Courier New', monospace;
                min-height: 1.4em;
            }

            .theusoft-event-info {
                background: rgba(0, 255, 100, 0.05);
                border-radius: 2px;
                padding: 15px;
                margin: 20px 0 25px;
                border: 1px solid rgba(0, 255, 100, 0.3);
                border-left: 3px solid #00ff64;
            }

            .theusoft-event-type {
                font-size: 12px;
                font-weight: bold;
                color: #00ff64;
                margin-bottom: 5px;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-family: 'Courier New', monospace;
                min-height: 1.3em;
            }

            .theusoft-event-desc {
                font-size: 11px;
                color: rgba(0, 255, 100, 0.7);
                line-height: 1.3;
                font-family: 'Courier New', monospace;
                min-height: 1.3em;
            }

            .theusoft-protect-footer {
                margin-top: 20px;
            }

            .theusoft-protect-btn {
                background: rgba(0, 255, 100, 0.1);
                border: 1px solid rgba(0, 255, 100, 0.5);
                color: #00ff64;
                padding: 12px 30px;
                border-radius: 2px;
                font-size: 12px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-family: 'Courier New', monospace;
            }

            .theusoft-protect-btn:hover {
                background: rgba(0, 255, 100, 0.2);
                border-color: #00ff64;
                box-shadow: 0 0 15px rgba(0, 255, 100, 0.4);
            }

            .theusoft-protect-btn:active {
                transform: translateY(1px);
            }

            /* Efeito de glitch ocasional */
            @keyframes theusoftGlitch {
                0% { transform: translate(0); }
                20% { transform: translate(-2px, 2px); }
                40% { transform: translate(-2px, -2px); }
                60% { transform: translate(2px, 2px); }
                80% { transform: translate(2px, -2px); }
                100% { transform: translate(0); }
            }

            .theusoft-glitch {
                animation: theusoftGlitch 0.3s ease;
            }

            /* Mobile adjustments */
            @media (max-width: 768px) {
                .theusoft-protect-content {
                    max-width: 90%;
                }
                
                .theusoft-protect-body {
                    padding: 0 20px 25px 20px;
                }
                
                .theusoft-protect-logo {
                    width: 200px;
                    height: auto;
                }
                
                .theusoft-protect-title {
                    font-size: 16px;
                }
                
                .theusoft-protect-desc {
                    font-size: 12px;
                }
            }

            /* Print prevention */
            @media print {
                .theusoft-protect-modal {
                    display: flex !important;
                    background: #000 !important;
                }
                
                #theusoft-matrix-bg {
                    display: none !important;
                }
            }
        `;

        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    // ------------------------------------------
    // MENSAGENS PERSONALIZADAS - ESTILO HACKER
    // ------------------------------------------
    const eventMessages = {
        'devtools-detected': {
            originalTitle: "INITIATING_SECURITY_PROTOCOL",
            title: "SISTEMA DE SEGURANÇA ATIVADO",
            originalDesc: "> UNAUTHORIZED_ACCESS::DEV_TOOLS_DETECTED",
            desc: "> ACESSO NÃO AUTORIZADO::FERRA.MTAS_DEV_DETECTADAS",
            originalEventType: "SECURITY_BREACH::CODE_01x7F",
            eventType: "VIOLAÇÃO DE SEGURANÇA::CÓDIGO_01x7F",
            originalEventDesc: "Developer environment access attempt logged",
            eventDesc: "Tentativa de acesso ao ambiente de desenvolvimento registrada"
        },
        'printscreen': {
            originalTitle: "SCREEN_CAPTURE_BLOCKED",
            title: "CAPTURA DE TELA BLOQUEADA",
            originalDesc: "> PRINTSCREEN_COMMAND_INTERCEPTED",
            desc: "> COMANDO PRINTSCREEN_INTERCEPTADO",
            originalEventType: "SECURITY_EVENT::CAP_02xB4",
            eventType: "EVENTO DE SEGURANÇA::CAP_02xB4",
            originalEventDesc: "Screen capture attempt neutralized",
            eventDesc: "Tentativa de captura de tela neutralizada"
        },
        'contextmenu': {
            originalTitle: "CONTEXT_MENU_RESTRICTED",
            title: "MENU CONTEXTUAL RESTRITO",
            originalDesc: "> RIGHT_CLICK_FUNCTIONALITY_DISABLED",
            desc: "> FUNCIONALIDADE_CLIQUE_DIREITO_DESATIVADA",
            originalEventType: "SECURITY_EVENT::MENU_03xC9",
            eventType: "EVENTO DE SEGURANÇA::MENU_03xC9",
            originalEventDesc: "Context menu access blocked by security",
            eventDesc: "Acesso ao menu contextual bloqueado pela segurança"
        },
        'f12': {
            originalTitle: "DEVELOPER_ACCESS_DENIED",
            title: "ACESSO DE DESENVOLVEDOR NEGADO",
            originalDesc: "> F12_KEY_COMMAND_INTERCEPTED",
            desc: "> COMANDO_TECLA_F12_INTERCEPTADO",
            originalEventType: "SECURITY_EVENT::KEY_04xD2",
            eventType: "EVENTO DE SEGURANÇA::TECLA_04xD2",
            originalEventDesc: "Developer shortcut key blocked",
            eventDesc: "Tecla de atalho de desenvolvedor bloqueada"
        },
        'shortcut-U': {
            originalTitle: "SOURCE_VIEW_BLOCKED",
            title: "VISUALIZAÇÃO DE CÓDIGO BLOQUEADA",
            originalDesc: "> SOURCE_CODE_ACCESS_RESTRICTED",
            desc: "> ACESSO_CÓDIGO_FONTE_RESTRITO",
            originalEventType: "SECURITY_EVENT::SRC_05xE8",
            eventType: "EVENTO DE SEGURANÇA::COD_05xE8",
            originalEventDesc: "Page source view attempt blocked",
            eventDesc: "Tentativa de visualização de código fonte bloqueada"
        },
        'shortcut-S': {
            originalTitle: "SAVE_OPERATION_DENIED",
            title: "OPERAÇÃO SALVAR NEGADA",
            originalDesc: "> SAVE_COMMAND_INTERCEPTED",
            desc: "> COMANDO_SALVAR_INTERCEPTADO",
            originalEventType: "SECURITY_EVENT::SAV_06xF1",
            eventType: "EVENTO DE SEGURANÇA::SAL_06xF1",
            originalEventDesc: "Page save attempt prevented",
            eventDesc: "Tentativa de salvamento de página prevenida"
        },
        'shortcut-C': {
            originalTitle: "COPY_OPERATION_RESTRICTED",
            title: "OPERAÇÃO COPIAR RESTRITA",
            originalDesc: "> COPY_COMMAND_BLOCKED",
            desc: "> COMANDO_COPIAR_BLOQUEADO",
            originalEventType: "SECURITY_EVENT::CPY_07xFA",
            eventType: "EVENTO DE SEGURANÇA::COP_07xFA",
            originalEventDesc: "Content copy attempt neutralized",
            eventDesc: "Tentativa de cópia de conteúdo neutralizada"
        },
        'shortcut-X': {
            originalTitle: "CUT_OPERATION_DENIED",
            title: "OPERAÇÃO RECORTAR NEGADA",
            originalDesc: "> CUT_COMMAND_INTERCEPTED",
            desc: "> COMANDO_RECORTAR_INTERCEPTADO",
            originalEventType: "SECURITY_EVENT::CUT_08x03",
            eventType: "EVENTO DE SEGURANÇA::REC_08x03",
            originalEventDesc: "Content cut attempt blocked",
            eventDesc: "Tentativa de recorte de conteúdo bloqueada"
        },
        'shortcut-V': {
            originalTitle: "PASTE_OPERATION_BLOCKED",
            title: "OPERAÇÃO COLAR BLOQUEADA",
            originalDesc: "> PASTE_COMMAND_RESTRICTED",
            desc: "> COMANDO_COLAR_RESTRITO",
            originalEventType: "SECURITY_EVENT::PST_09x0C",
            eventType: "EVENTO DE SEGURANÇA::COL_09x0C",
            originalEventDesc: "Content paste attempt prevented",
            eventDesc: "Tentativa de colagem de conteúdo prevenida"
        },
        'shortcut-P': {
            originalTitle: "PRINT_OPERATION_RESTRICTED",
            title: "OPERAÇÃO IMPRIMIR RESTRITA",
            originalDesc: "> PRINT_COMMAND_INTERCEPTED",
            desc: "> COMANDO_IMPRIMIR_INTERCEPTADO",
            originalEventType: "SECURITY_EVENT::PRT_10x15",
            eventType: "EVENTO DE SEGURANÇA::IMP_10x15",
            originalEventDesc: "Page print attempt blocked",
            eventDesc: "Tentativa de impressão de página bloqueada"
        },
        'default': {
            originalTitle: "SECURITY_VIOLATION_DETECTED",
            title: "VIOLAÇÃO DE SEGURANÇA DETECTADA",
            originalDesc: "> UNAUTHORIZED_ACTION_BLOCKED",
            desc: "> AÇÃO_NÃO_AUTORIZADA_BLOQUEADA",
            originalEventType: "SECURITY_EVENT::DEF_00x00",
            eventType: "EVENTO DE SEGURANÇA::DEF_00x00",
            originalEventDesc: "Security policy violation detected",
            eventDesc: "Violação de política de segurança detectada"
        }
    };

    // ------------------------------------------
    // CRIA MODAL DE PROTEÇÃO DINÂMICO
    // ------------------------------------------
    function createProtectModal() {
        const existingModal = document.getElementById('theusoft-protect-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement("div");
        modal.id = "theusoft-protect-modal";
        modal.className = "theusoft-protect-modal";
        
        modal.innerHTML = `
            <div class="theusoft-protect-content">
                <div class="theusoft-protect-header">
                    <button class="theusoft-close-btn" id="theusoftCloseBtn">X</button>
                </div>
                <div class="theusoft-protect-body">
                    <img src="data:image/png;base64,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" 
                         alt="Selo VÆLORÜM" 
                         class="theusoft-protect-logo"
                         onerror="this.style.display='none'">
                    <h2 class="theusoft-protect-title" id="theusoftModalTitle"></h2>
                    <p class="theusoft-protect-desc" id="theusoftModalDesc"></p>
                    
                    <div class="theusoft-event-info">
                        <div class="theusoft-event-type" id="theusoftEventType"></div>
                        <div class="theusoft-event-desc" id="theusoftEventDesc"></div>
                    </div>
                    
                    <div class="theusoft-protect-footer">
                        <button class="theusoft-protect-btn" id="theusoftModalClose">CONFIRMAR</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('theusoftCloseBtn').addEventListener('click', hideModal);
        document.getElementById('theusoftModalClose').addEventListener('click', hideModal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) hideModal();
        });
        
        return modal;
    }

    async function showModal(reason) {
        if (modalVisible) return;
        
        // Parar animações anteriores
        stopAllTypingAnimations();
        
        injectProtectStyles();
        
        if (!protectModal) {
            protectModal = createProtectModal();
        }
        
        // Iniciar efeito Matrix
        showMatrixBackground();
        
        modalVisible = true;
        
        const messages = eventMessages[reason] || eventMessages['default'];
        
        // Mostrar textos originais em inglês primeiro
        document.getElementById('theusoftModalTitle').textContent = messages.originalTitle;
        document.getElementById('theusoftModalDesc').textContent = messages.originalDesc;
        document.getElementById('theusoftEventType').textContent = messages.originalEventType;
        document.getElementById('theusoftEventDesc').textContent = messages.originalEventDesc;
        
        protectModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Efeito glitch ocasional
        setTimeout(() => {
            document.querySelector('.theusoft-protect-content').classList.add('theusoft-glitch');
            setTimeout(() => {
                document.querySelector('.theusoft-protect-content').classList.remove('theusoft-glitch');
            }, 300);
        }, 100);
        
        // Iniciar animações de digitação sequenciais
        setTimeout(() => {
            // Animação do título
            typeWriter(
                document.getElementById('theusoftModalTitle'),
                messages.originalTitle,
                messages.title,
                40,
                0
            );
            
            // Animação da descrição
            typeWriter(
                document.getElementById('theusoftModalDesc'),
                messages.originalDesc,
                messages.desc,
                30,
                800
            );
            
            // Animação do tipo de evento
            typeWriter(
                document.getElementById('theusoftEventType'),
                messages.originalEventType,
                messages.eventType,
                35,
                1600
            );
            
            // Animação da descrição do evento
            typeWriter(
                document.getElementById('theusoftEventDesc'),
                messages.originalEventDesc,
                messages.eventDesc,
                25,
                2400
            );
            
            // Atualizar texto do botão após todas as animações
            setTimeout(() => {
                document.getElementById('theusoftModalClose').textContent = 'CONFIRMAR';
            }, 3200);
            
        }, 500);
        
        console.log(`[MATRIX PROTECT] Security event: ${reason}`);
    }

    function hideModal() {
        if (!modalVisible || !protectModal) return;
        
        // Parar todas as animações de digitação
        stopAllTypingAnimations();
        
        modalVisible = false;
        protectModal.classList.remove('active');
        
        // Parar efeito Matrix
        hideMatrixBackground();
        
        setTimeout(() => {
            if (!modalVisible) {
                document.body.style.overflow = '';
            }
        }, 300);
    }

    // ... (restante do código de detecção permanece igual)
    function detectDevTools() {
        const threshold = 200;
        const w = window.outerWidth - window.innerWidth;
        const h = window.outerHeight - window.innerHeight;

        if (w > threshold || h > threshold) return true;
        
        try {
            if (window.console && window.console.firebug) return true;
        } catch (e) {}
        
        return false;
    }

    function monitorLoop() {
        const dt = detectDevTools();
        if (dt && !devtoolsOpen) {
            devtoolsOpen = true;
            showModal("devtools-detected");
        }
        if (!dt && devtoolsOpen) {
            devtoolsOpen = false;
            hideModal();
        }
    }

    document.addEventListener("selectstart", e => e.preventDefault());
    document.addEventListener("dragstart", e => e.preventDefault());

    document.addEventListener("keydown", e => {
        if (e.key === "PrintScreen") {
            e.preventDefault();
            try { navigator.clipboard.writeText(""); } catch (err) {}
            showModal("printscreen");
        }
    });

    document.addEventListener("keydown", e => {
        const key = e.key.toUpperCase();
        if (e.ctrlKey && ["U", "S", "C", "X", "V", "P"].includes(key)) {
            e.preventDefault();
            showModal(`shortcut-${key}`);
        }
        if (e.ctrlKey && e.shiftKey && ["I","J","C"].includes(key)) {
            e.preventDefault();
            showModal(`shortcut-ctrl-shift-${key}`);
        }
        if (key === "F12") {
            e.preventDefault();
            showModal("f12");
        }
    });

    document.addEventListener("contextmenu", e => {
        e.preventDefault();
        showModal("contextmenu");
    });

    document.addEventListener('drop', e => e.preventDefault());
    document.addEventListener('dragover', e => e.preventDefault());

    function init() {
        injectProtectStyles();
        setInterval(monitorLoop, 400);
        
        window.addEventListener('beforeunload', function(e) {
            if (devtoolsOpen) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        console.log("✅ MATRIX PROTECTION SYSTEM - Online and monitoring");
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.TheusoftProtect = {
        showModal: showModal,
        hideModal: hideModal,
        version: '3.0.0-MATRIX-TYPING'
    };

})();