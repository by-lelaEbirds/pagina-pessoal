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

    const payButton = document.getElementById('pay-button');
    const paymentStatus = document.getElementById('payment-status');
    const countdownEl = document.getElementById('countdown');
    const hackMessageBox = document.getElementById('hack-message-box'); // Pega a caixa de msg

    // --- LÓGICA DA CHUVA MATRIX ---
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');
    let matrixInterval;

    function startMatrixRain() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        let katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
        let latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let nums = '0123456789';
        const chars = katakana + latin + nums;
        const fontSize = 16;
        const columns = canvas.width / fontSize;
        const drops = [];
        for (let x = 0; x < columns; x++) drops[x] = 1;

        function drawMatrix() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#00ff41'; // Chuva verde
            ctx.font = fontSize + 'px monospace';
            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }
        matrixInterval = setInterval(drawMatrix, 33);
    }

    function stopMatrixRain() {
        clearInterval(matrixInterval);
    }
    
    // --- LÓGICA DO TIMER FALSO ---
    let countdownInterval;
    function startCountdown() {
        let duration = 60 * 10; // 10 minutos
        countdownInterval = setInterval(() => {
            duration--;
            let minutes = parseInt(duration / 60, 10);
            let seconds = parseInt(duration % 60, 10);
            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;
            countdownEl.textContent = minutes + ":" + seconds;
            if (duration <= 0) {
                clearInterval(countdownInterval);
                countdownEl.textContent = "00:00";
            }
        }, 1000);
    }

    // --- LÓGICA DE LOGIN ---
    let currentUserData; 

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

            currentUserData = await response.json();
            
            loginScreen.style.display = 'none';
            hackScreen.style.display = 'flex';
            startMatrixRain();
            startCountdown();

        } catch (error) {
            console.error('Erro no login:', error);
            loginError.textContent = `// Erro: ${error.message}`;
        }
    });

    // --- LÓGICA DO BOTÃO DE PAGAMENTO (COM "ACCESS GRANTED") ---
    payButton.addEventListener('click', async () => {
        paymentStatus.textContent = "// Processing payment... please wait...";
        payButton.disabled = true;
        payButton.textContent = "PROCESSING...";

        // Simula o "processamento" por 2 segundos
        await new Promise(resolve => setTimeout(resolve, 2000));

        // === MUDANÇA: TELA "ACCESS GRANTED" ===
        clearInterval(countdownInterval); // Para o timer
        hackMessageBox.classList.add('access-granted'); // Muda a cor para VERDE
        hackMessageBox.innerHTML = `
            <h1>ACCESS GRANTED</h1>
            <p>// Payment verified. Decrypting file system... Welcome back, agent.</p>
        `;
        // Deixa a mensagem de "Access Granted" na tela por 3 segundos
        await new Promise(resolve => setTimeout(resolve, 3000));


        // --- A TRANSIÇÃO FINAL ---
        stopMatrixRain();
        hackScreen.style.display = 'none';

        // Mostra o portfólio
        portfolioScreen.style.display = 'flex';
        
        // Preenche os dados do portfólio
        welcomeMessage.textContent = `> Bem-vindo, ${currentUserData.nome}`;
        
        // Carrega a lista de visitantes
        await carregarVisitantes(currentUserData.nome);

        // Ativa os títulos "digitando"
        startTitleObserver();
    });

    /**
     * Função para buscar e popular a lista de visitantes
     */
    async function carregarVisitantes(novoNome = null) {
        visitorList.innerHTML = ''; 
        let nomesExibidos = [];

        if (novoNome) {
            const li = document.createElement('li');
            li.textContent = `> ${novoNome}`;
            visitorList.appendChild(li);
            nomesExibidos.push(novoNome);
        }

        try {
            const response = await fetch(`${BACKEND_URL}/visitantes`);
            if (!response.ok) throw new Error('API GET falhou');
            const nomes = await response.json();

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

    // --- LÓGICA DO TYPEWRITER DOS TÍTULOS ---
    function typeWriter(element, text, speed) {
        let i = 0;
        element.innerHTML = ""; // Limpa o span
        function type() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else {
                element.style.borderRight = "none"; // Remove o cursor piscando
            }
        }
        type();
    }

    function startTitleObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const span = entry.target.querySelector('.type-title');
                    if (span && !span.classList.contains('typed')) {
                        span.classList.add('typed');
g                        const text = span.getAttribute('data-text');
                        typeWriter(span, text, 50); // 50ms de velocidade
                    }
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('#portfolio-screen section').forEach(section => {
            observer.observe(section);
        });
    }
});
