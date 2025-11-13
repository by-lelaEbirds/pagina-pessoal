document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURAÇÃO ---
    const BACKEND_URL = "https://portfolio-backend-ts0d.onrender.com"; 

    // --- ELEMENTOS DO DOM ---
    const loginScreen = document.getElementById('login-screen');
    const hackScreen = document.getElementById('hack-screen');
    const portfolioScreen = document.getElementById('portfolio-screen');
    
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    
    const welcomeMessage = document.getElementById('welcome-message');
    const visitorList = document.getElementById('lista-visitantes');

    // --- LÓGICA DA CHUVA MATRIX (A PARTE FODA) ---
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');
    let matrixInterval; // Variável para controlar o loop (iniciar/parar)

    function startMatrixRain() {
        // Define o tamanho do canvas para a tela cheia
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Caracteres (Katana é o clássico)
        let katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
        let latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let nums = '0123456789';
        const chars = katakana + latin + nums;

        const fontSize = 16;
        const columns = canvas.width / fontSize;
        const drops = [];

        // Inicializa as "gotas" (uma para cada coluna)
        for (let x = 0; x < columns; x++) {
            drops[x] = 1;
        }

        function drawMatrix() {
            // Fundo preto semi-transparente para criar o efeito de "rastro"
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#00ff41'; // Cor verde
            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                // Reseta a gota para o topo se ela sair da tela
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                
                // Incrementa a posição Y da gota
                drops[i]++;
            }
        }

        // Inicia o loop de animação
        matrixInterval = setInterval(drawMatrix, 33); // 33ms = ~30 FPS
    }

    function stopMatrixRain() {
        // Para o loop de animação para economizar bateria
        clearInterval(matrixInterval);
    }
    
    // --- LÓGICA DE LOGIN (FLUXO ATUALIZADO) ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const nome = document.getElementById('nome').value;
        const senha = document.getElementById('senha').value;
        loginError.textContent = '// Aguarde... conectando...';

        try {
            const response = await fetch(`${BACKEND_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: nome, senha: senha }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha no login');
            }

            const userData = await response.json();
            
            // --- O SHOW COMEÇA AQUI ---

            // 1. Esconde o login
            loginScreen.style.display = 'none';
            
            // 2. Mostra a tela de "HACKED"
            hackScreen.style.display = 'flex';
            startMatrixRain(); // Inicia a chuva de código

            // 3. Espera 5 segundos pelo efeito (3s da digitação + 2s de show)
            await new Promise(resolve => setTimeout(resolve, 5000));

            // 4. Para a animação e esconde a tela de hack
            stopMatrixRain();
            hackScreen.style.display = 'none';

            // 5. Finalmente, mostra o portfólio
            portfolioScreen.style.display = 'flex';
            
            // 6. Preenche os dados do portfólio
            welcomeMessage.textContent = `> Bem-vindo, ${userData.nome}`;
            
            // 7. Carrega a lista de visitantes (com a correção de bug)
            await carregarVisitantes(userData.nome);

        } catch (error) {
            console.error('Erro no login:', error);
            if (error.message.includes("Failed to fetch")) {
                loginError.textContent = `// Erro: Não foi possível conectar ao servidor.`;
            } else {
                loginError.textContent = `// Erro: ${error.message}`;
            }
        }
    });

    /**
     * Função para buscar a lista de nomes no backend
     * e popular a sidebar.
     * (Esta é a versão que corrige o bug da lista)
     */
    async function carregarVisitantes(novoNome = null) {
        visitorList.innerHTML = ''; 
        let nomesExibidos = [];

        // 1. Adiciona o novo usuário IMEDIATAMENTE
        if (novoNome) {
            const li = document.createElement('li');
            li.textContent = `> ${novoNome}`;
            visitorList.appendChild(li);
            nomesExibidos.push(novoNome);
        }

        // 2. Tenta buscar o resto da lista
        try {
            const response = await fetch(`${BACKEND_URL}/visitantes`);
            if (!response.ok) {
                throw new Error('API GET falhou');
            }
            const nomes = await response.json(); // Lista do Airtable

            // 3. Adiciona o resto, pulando duplicatas
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
