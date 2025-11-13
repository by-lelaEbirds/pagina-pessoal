document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURAÇÃO ---
    const BACKEND_URL = "https://portfolio-backend-ts0d.onrender.com"; 

    // --- ELEMENTOS DO DOM ---
    const hackScreen = document.getElementById('hack-screen');
    const loginScreen = document.getElementById('login-screen');
    const portfolioScreen = document.getElementById('portfolio-screen');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    
    const welcomeMessage = document.getElementById('welcome-message');
    const visitorList = document.getElementById('lista-visitantes');

    const typewriterText = document.querySelector('.typewriter');
    const matrixEffectContainer = document.querySelector('.matrix-effect');

    // --- FUNÇÃO PARA INICIAR O EFEITO MATRIX ---
    function startMatrixEffect() {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-=_+[]{}|;:',.<>/?`~";
        const totalColumns = Math.floor(window.innerWidth / 20); // Baseado no tamanho da fonte

        for (let i = 0; i < totalColumns; i++) {
            const column = document.createElement('div');
            column.style.position = 'absolute';
            column.style.left = `${i * 20}px`;
            column.style.top = '0';
            column.style.height = '100%';
            column.style.width = '20px'; // Largura da coluna
            column.style.overflow = 'hidden';

            const charSpan = document.createElement('span');
            charSpan.style.display = 'block';
            charSpan.style.color = '#00ff41'; // Cor verde padrão
            charSpan.style.fontFamily = 'VT323, monospace';
            charSpan.style.fontSize = '1.2rem';
            charSpan.style.lineHeight = '1.2rem';
            charSpan.style.wordBreak = 'break-all'; // Quebra caracteres longos

            // Cria uma sequência aleatória de caracteres para cada coluna
            let columnChars = '';
            const numChars = Math.floor(Math.random() * 50) + 20; // Entre 20 e 70 caracteres por coluna
            for (let j = 0; j < numChars; j++) {
                columnChars += chars.charAt(Math.floor(Math.random() * chars.length)) + '\n';
            }
            charSpan.textContent = columnChars;
            column.appendChild(charSpan);
            matrixEffectContainer.appendChild(column);

            // Animação da coluna
            const animationDuration = Math.random() * 10 + 5; // Duração aleatória entre 5 e 15s
            const startDelay = Math.random() * 5; // Atraso inicial aleatório

            charSpan.style.transition = 'none'; // Desabilita transição inicial
            charSpan.style.transform = `translateY(-${Math.random() * window.innerHeight}px)`; // Posição inicial aleatória

            setTimeout(() => {
                charSpan.style.transition = `transform ${animationDuration}s linear`;
                charSpan.style.transform = `translateY(${window.innerHeight + (numChars * 1.2 * 16)}px)`; // Desce até sair da tela

                charSpan.addEventListener('transitionend', function handler() {
                    // Reinicia a animação quando termina
                    this.style.transition = 'none';
                    this.style.transform = `translateY(-${Math.random() * window.innerHeight}px)`;
                    this.offsetHeight; // Força reflow
                    this.style.transition = `transform ${animationDuration}s linear`;
                    this.style.transform = `translateY(${window.innerHeight + (numChars * 1.2 * 16)}px)`;
                });
            }, startDelay * 1000);
        }
    }


    // --- LÓGICA DE TRANSIÇÃO DA TELA DE HACK ---
    function initApp() {
        hackScreen.style.display = 'flex'; // Garante que a hack screen esteja visível
        loginScreen.style.display = 'none';
        portfolioScreen.style.display = 'none';

        startMatrixEffect(); // Inicia a chuva de caracteres

        // Espera a animação de digitação terminar + um pequeno delay
        const typingDuration = 3000; // Tempo da animação 'typing' em CSS
        const totalHackScreenDuration = typingDuration + 2000; // 3s digitação + 2s de delay

        setTimeout(() => {
            hackScreen.style.opacity = '0';
            hackScreen.style.transition = 'opacity 1s ease-out';
            
            setTimeout(() => {
                hackScreen.style.display = 'none';
                loginScreen.style.display = 'flex'; // Mostra a tela de login
            }, 1000); // Tempo da transição de opacidade
        }, totalHackScreenDuration);
    }

    initApp(); // Chama a função ao carregar a página


    // --- EVENT LISTENER (Formulário de Login) ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.getElementById('nome').value;
        const senha = document.getElementById('senha').value;
        loginError.textContent = '// Aguarde... conectando...';

        try {
            const response = await fetch(`${BACKEND_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nome: nome, senha: senha }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha no login');
            }

            const userData = await response.json();
            welcomeMessage.textContent = `> Bem-vindo, ${userData.nome}`; // Sem underline aqui, o CSS faz

            loginScreen.style.display = 'none';
            portfolioScreen.style.display = 'flex';

            // Carrega a lista de visitantes (incluindo o novo usuário)
            await carregarVisitantes(userData.nome);

        } catch (error) {
            console.error('Erro no login:', error);
            if (error.message.includes("Failed to fetch")) {
                loginError.textContent = `// Erro: Não foi possível conectar ao servidor. (Verifique a URL no script.js)`;
            } else {
                loginError.textContent = `// Erro: ${error.message}`;
            }
        }
    });

    /**
     * Função para buscar a lista de nomes no backend
     * e popular a sidebar.
     */
    async function carregarVisitantes(novoNome = null) {
        visitorList.innerHTML = ''; 
        let nomesExibidos = [];

        // Adiciona o novo usuário (que acabou de logar) IMEDIATAMENTE.
        if (novoNome) {
            const li = document.createElement('li');
            li.textContent = `> ${novoNome}`;
            li.classList.add('new-visitor'); // Adiciona uma classe para destaque
            visitorList.appendChild(li);
            nomesExibidos.push(novoNome);
        }

        try {
            const response = await fetch(`${BACKEND_URL}/visitantes`);
            if (!response.ok) {
                throw new Error('Não foi possível carregar a lista de visitantes (API GET falhou)');
            }
            const nomes = await response.json();

            // Adiciona o resto da lista, pulando duplicatas
            nomes.forEach(nome => {
                if (!nomesExibidos.includes(nome)) {
                    const li = document.createElement('li');
                    li.textContent = `> ${nome}`;
                    visitorList.appendChild(li);
                    nomesExibidos.push(nome);
                }
            });
        } catch (error) {
            console.error('Erro ao carregar visitantes:', error);
            const liError = document.createElement('li');
            liError.textContent = `// Erro ao carregar outros`;
            liError.style.color = "#888"; 
            visitorList.appendChild(liError);
        }
    }
});
