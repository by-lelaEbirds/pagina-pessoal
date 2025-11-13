document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURAÇÃO ---
    // A URL do seu backend (já deve estar correta)
    const BACKEND_URL = "https://portfolio-backend-ts0d.onrender.com"; 

    // --- ELEMENTOS DO DOM ---
    const loginScreen = document.getElementById('login-screen');
    const portfolioScreen = document.getElementById('portfolio-screen');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    
    const welcomeMessage = document.getElementById('welcome-message');
    const visitorList = document.getElementById('lista-visitantes');

    // --- EVENT LISTENER (Formulário de Login) ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Impede o recarregamento da página

        const nome = document.getElementById('nome').value;
        const senha = document.getElementById('senha').value;
        loginError.textContent = '// Aguarde... conectando...'; // Feedback

        try {
            const response = await fetch(`${BACKEND_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nome: nome, senha: senha }),
            });

            if (!response.ok) {
                // Se o backend retornar um erro (ex: 400, 500)
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha no login');
            }

            // --- SUCESSO! ---
            const userData = await response.json();

            // 1. Mostrar mensagem de boas-vindas (no novo local)
            welcomeMessage.textContent = `> Bem-vindo, ${userData.nome}_`;

            // 2. Esconder o login e mostrar o portfólio
            loginScreen.style.display = 'none';
            portfolioScreen.style.display = 'flex'; // Usamos flex por causa da sidebar

            // 3. Carregar a lista de visitantes (incluindo o novo)
            //    === MUDANÇA AQUI ===
            await carregarVisitantes(userData.nome); // Passamos o nome do novo usuário

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
     * * === FUNÇÃO TOTALMENTE ATUALIZADA ===
     */
    async function carregarVisitantes(novoNome = null) {
        try {
            const response = await fetch(`${BACKEND_URL}/visitantes`);
            
            if (!response.ok) {
                throw new Error('Não foi possível carregar a lista de visitantes');
            }

            const nomes = await response.json(); // Lista do Airtable

            // Limpa a lista antiga
            visitorList.innerHTML = ''; 
            
            // Cria um array para controlar nomes já exibidos
            let nomesExibidos = [];

            // 1. Adiciona o novo usuário (que acabou de logar) no topo
            if (novoNome) {
                const li = document.createElement('li');
                li.textContent = `> ${novoNome}`;
                visitorList.appendChild(li);
                nomesExibidos.push(novoNome); // Marca como exibido
            }

            // 2. Adiciona o resto da lista, pulando duplicatas
            nomes.forEach(nome => {
                // Se o nome da lista NÃO ESTIVER no nosso controle
                if (!nomesExibidos.includes(nome)) {
                    const li = document.createElement('li');
                    li.textContent = `> ${nome}`;
                    visitorList.appendChild(li);
                    nomesExibidos.push(nome); // Marca como exibido
                }
            });

        } catch (error) {
            console.error('Erro ao carregar visitantes:', error);
            // Se falhar, apenas não mostra a lista
        }
    }
});
