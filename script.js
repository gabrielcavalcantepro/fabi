document.addEventListener('DOMContentLoaded', function() {
    // --- Elementos ---
    const secoes = document.querySelectorAll('.secao');
    const containerBotoes = document.querySelector('.list-botoes');
    let botoes = Array.from(document.querySelectorAll('.botao'));
    const btnBack = document.querySelector('.back');
    const btnNext = document.querySelector('.next');
    
    // --- Configurações ---
    let currentIndex = 0; 
    const SELECTED_CLASS = 'botao-selecionado';
    let isAnimating = false;
    const ANIMATION_DURATION = 500; // Aumentei um pouco para suavizar

    // --- Inicialização ---
    function init() {
        const ordemCorreta = ['Fale', 'E-book', 'Mentoria', 'Consultoria'];
        
        botoes.sort((a, b) => {
            const textA = a.innerText || '';
            const textB = b.innerText || '';
            return ordemCorreta.findIndex(item => textA.includes(item)) - 
                   ordemCorreta.findIndex(item => textB.includes(item));
        });
        
        containerBotoes.innerHTML = '';
        botoes.forEach(botao => containerBotoes.appendChild(botao));

        // Move o último para o começo (para ser o cortado da esquerda)
        const ultimo = botoes.pop();
        botoes.unshift(ultimo);
        containerBotoes.insertBefore(ultimo, containerBotoes.firstChild);

        atualizarClasses();
        mostrarSecao(0);
    }

    // --- Atualização Visual ---
    function atualizarClasses() {
        botoes.forEach(b => b.classList.remove(SELECTED_CLASS));
        // O índice 1 é o visível focado
        if(botoes[1]) botoes[1].classList.add(SELECTED_CLASS);
    }

    function mostrarSecao(indexReal) {
        secoes.forEach((secao, idx) => {
            if (idx === indexReal) {
                secao.style.display = 'flex';
                requestAnimationFrame(() => {
                    secao.classList.remove('secao-saindo');
                    secao.classList.add('secao-entrando');
                });
            } else {
                secao.style.display = 'none';
                secao.classList.remove('secao-entrando');
            }
        });
    }

    function trocarSecaoAnimada(novoIndex) {
        const secaoAtual = secoes[currentIndex];
        const novaSecao = secoes[novoIndex];

        secaoAtual.classList.add('secao-saindo');
        secaoAtual.classList.remove('secao-entrando');

        setTimeout(() => {
            secaoAtual.style.display = 'none';
            secaoAtual.classList.remove('secao-saindo');
            
            novaSecao.style.display = 'flex';
            void novaSecao.offsetWidth; 
            novaSecao.classList.add('secao-entrando');
        }, 500); 

        currentIndex = novoIndex;
    }

    function getCardWidth() {
        const card = botoes[0];
        // Pega o gap computado ou usa 20 como fallback
        const style = window.getComputedStyle(containerBotoes);
        const gap = parseFloat(style.gap) || 20;
        return card.getBoundingClientRect().width + gap;
    }

    // --- Navegação NEXT (Corrigida com Clone Fantasma) ---
    function next() {
        if (isAnimating) return;
        isAnimating = true;

        const moveAmount = getCardWidth();

        // 1. TRUQUE DO FANTASMA: 
        // Clonamos o primeiro botão (que vai sair da esquerda e ir pro final)
        // e o colocamos lá no final AGORA, antes da animação.
        const ghostClone = botoes[0].cloneNode(true);
        ghostClone.classList.remove(SELECTED_CLASS); // Garante que não vá com borda
        ghostClone.classList.add('ghost-clone'); // Classe para controle se precisar
        containerBotoes.appendChild(ghostClone);

        // 2. Desliza tudo para a esquerda (mostrando o clone entrando na direita)
        containerBotoes.style.transition = `transform ${ANIMATION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        containerBotoes.style.transform = `translateX(-${moveAmount}px)`;

        // Lógica da Seção
        const nextBtn = botoes[2]; 
        trocarSecaoAnimada(getIndexByText(nextBtn));

        // 3. Limpeza pós-animação
        setTimeout(() => {
            containerBotoes.style.transition = 'none';
            
            // Remove o clone fantasma
            ghostClone.remove();

            // Move o botão REAL para o final
            const primeiro = botoes.shift();
            botoes.push(primeiro);
            containerBotoes.appendChild(primeiro);

            // Reseta posição instantaneamente (o olho não percebe a troca do clone pelo real)
            requestAnimationFrame(() => {
                containerBotoes.style.transform = 'translateX(0)';
                atualizarClasses();
                isAnimating = false;
            });
        }, ANIMATION_DURATION);
    }

    // --- Navegação BACK ---
    function back() {
        if (isAnimating) return;
        isAnimating = true;

        const moveAmount = getCardWidth();

        // No back o processo é inverso: movemos primeiro, compensamos com transform negativo e deslizamos para 0
        const ultimo = botoes.pop();
        botoes.unshift(ultimo);
        containerBotoes.insertBefore(ultimo, containerBotoes.firstChild);

        containerBotoes.style.transition = 'none';
        containerBotoes.style.transform = `translateX(-${moveAmount}px)`;

        const prevBtn = botoes[1];
        trocarSecaoAnimada(getIndexByText(prevBtn));

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                containerBotoes.style.transition = `transform ${ANIMATION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
                containerBotoes.style.transform = 'translateX(0)';
            });
        });

        setTimeout(() => {
            atualizarClasses();
            isAnimating = false;
        }, ANIMATION_DURATION + 50);
    }

    function getIndexByText(btnElement) {
        const text = btnElement.innerText || '';
        const ordem = ['Fale', 'E-book', 'Mentoria', 'Consultoria'];
        const idx = ordem.findIndex(item => text.includes(item));
        return idx !== -1 ? idx : 0;
    }

    // --- Listeners ---
    containerBotoes.addEventListener('click', (e) => {
        const btnClicado = e.target.closest('.botao');
        if (!btnClicado || isAnimating) return;
        
        if (botoes[1] === btnClicado) return;

        if (botoes[2] === btnClicado) {
            next();
        }
        else if (botoes[0] === btnClicado) {
            back();
        }
        else if (botoes.indexOf(btnClicado) > 1) {
            next();
        }
    });

    btnNext.addEventListener('click', next);
    btnBack.addEventListener('click', back);

    init();
});