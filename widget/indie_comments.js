(function() {
    // Configurações
    const API_BASE_URL = 'http://localhost:4130/api/proxy';
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos em milissegundos
    const RATE_LIMIT = 3000; // 3 segundos entre comentários
    
    // Cache
    const SITE_CACHE = {
        data: null,
        timestamp: 0
    };
    
    // Elementos DOM
    let container;
    let apiKey;
    let lastCommentTime = 0;
    
    // Inicialização
    function init() {
        // Obter o container e a API key
        const script = document.currentScript || (function() {
            const scripts = document.getElementsByTagName('script');
            return scripts[scripts.length - 1];
        })();
        
        apiKey = script.getAttribute('data-api-key');
        container = document.getElementById('indie-comments-container');
        
        if (!container || !apiKey) {
            console.error('Indie Comments: Container ou API key não encontrados');
            return;
        }
        
        // Validar domínio
        validateDomain(apiKey).then(isValid => {
            if (!isValid) {
                console.error('Indie Comments: Domínio não autorizado para esta API key');
                container.innerHTML = '<p>Erro: Domínio não autorizado para esta API key</p>';
                return;
            }
            
            // Carregar comentários
            loadComments();
        });
    }
    
    // Validação de domínio
    async function validateDomain(apiKey) {
        try {
            const response = await fetch(`http://localhost:4130/api/validate?api_key=${apiKey}`, {
                headers: {
                    'Origin': window.location.origin
                }
            });
            const data = await response.json();
            return data.valid;
        } catch (error) {
            console.error('Erro ao validar domínio:', error);
            return false;
        }
    }
    
    // Sanitização de HTML
    function sanitizeHTML(text) {
        const temp = document.createElement('div');
        temp.textContent = text;
        return temp.innerHTML;
    }
    
    // Carregar comentários
    async function loadComments() {
        // Verificar cache
        const now = Date.now();
        if (SITE_CACHE.data && now - SITE_CACHE.timestamp < CACHE_DURATION) {
            renderComments(SITE_CACHE.data);
            return;
        }
        
        // Mostrar loading
        container.innerHTML = '<p>Carregando comentários...</p>';
        
        try {
            // Obter URL atual
            const currentUrl = encodeURIComponent(window.location.pathname);
            
            // Buscar comentários aprovados para esta URL
            const response = await fetch(`${API_BASE_URL}/comments?filter=url:${currentUrl},status:approved&sort=-created_at`, {
                headers: {
                    'Authorization': apiKey
                }
            });
            
            const data = await response.json();
            
            // Atualizar cache
            SITE_CACHE.data = data;
            SITE_CACHE.timestamp = now;
            
            // Renderizar comentários
            renderComments(data);
        } catch (error) {
            console.error('Erro ao carregar comentários:', error);
            container.innerHTML = '<p>Erro ao carregar comentários. Tente novamente mais tarde.</p>';
        }
    }
    
    // Renderizar comentários
    function renderComments(data) {
        // Limpar container
        container.innerHTML = '';
        
        // Criar elementos
        const wrapper = document.createElement('div');
        wrapper.className = 'indie-comments-wrapper';
        
        // Estilo
        const style = document.createElement('style');
        style.textContent = `
            .indie-comments-wrapper {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                max-width: 100%;
                margin: 0 auto;
                padding: 1rem;
                color: #333;
            }
            .indie-comments-title {
                font-size: 1.5rem;
                margin-bottom: 1rem;
                font-weight: bold;
            }
            .indie-comments-list {
                margin-bottom: 1.5rem;
            }
            .indie-comment {
                padding: 1rem;
                margin-bottom: 1rem;
                border-radius: 8px;
                background-color: #f9f9f9;
                border: 1px solid #eee;
            }
            .indie-comment-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.5rem;
                font-size: 0.9rem;
            }
            .indie-comment-author {
                font-weight: bold;
            }
            .indie-comment-date {
                color: #777;
            }
            .indie-comment-content {
                line-height: 1.5;
                overflow-wrap: break-word;
            }
            .indie-comments-form {
                margin-top: 1.5rem;
            }
            .indie-form-group {
                margin-bottom: 1rem;
            }
            .indie-form-group label {
                display: block;
                margin-bottom: 0.5rem;
                font-weight: bold;
            }
            .indie-form-control {
                width: 100%;
                padding: 0.5rem;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-family: inherit;
                font-size: 1rem;
            }
            .indie-form-control:focus {
                outline: none;
                border-color: #5d5fef;
            }
            .indie-btn {
                background-color: #5d5fef;
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                font-size: 1rem;
                transition: background-color 0.2s;
            }
            .indie-btn:hover {
                background-color: #4b4ddb;
            }
            .indie-btn:disabled {
                background-color: #ccc;
                cursor: not-allowed;
            }
            .indie-comments-message {
                padding: 1rem;
                margin: 1rem 0;
                border-radius: 4px;
            }
            .indie-comments-message.success {
                background-color: #e6f7e6;
                color: #2e7d32;
            }
            .indie-comments-message.error {
                background-color: #fde8e8;
                color: #c62828;
            }
            .indie-comments-footer {
                margin-top: 1rem;
                font-size: 0.8rem;
                text-align: right;
                color: #777;
            }
            .indie-comments-footer a {
                color: #5d5fef;
                text-decoration: none;
            }
            .indie-comments-footer a:hover {
                text-decoration: underline;
            }
        `;
        
        // Título
        const title = document.createElement('h3');
        title.className = 'indie-comments-title';
        title.textContent = 'Comentários';
        
        // Lista de comentários
        const commentsList = document.createElement('div');
        commentsList.className = 'indie-comments-list';
        
        if (data && data.items && data.items.length > 0) {
            data.items.forEach(comment => {
                const commentEl = document.createElement('div');
                commentEl.className = 'indie-comment';
                
                const header = document.createElement('div');
                header.className = 'indie-comment-header';
                
                const author = document.createElement('span');
                author.className = 'indie-comment-author';
                author.textContent = sanitizeHTML(comment.author_name || 'Anônimo');
                
                const date = document.createElement('span');
                date.className = 'indie-comment-date';
                date.textContent = new Date(comment.created_at).toLocaleDateString();
                
                header.appendChild(author);
                header.appendChild(date);
                
                const content = document.createElement('div');
                content.className = 'indie-comment-content';
                content.textContent = sanitizeHTML(comment.content);
                
                commentEl.appendChild(header);
                commentEl.appendChild(content);
                commentsList.appendChild(commentEl);
            });
        } else {
            const noComments = document.createElement('p');
            noComments.textContent = 'Nenhum comentário ainda. Seja o primeiro a comentar!';
            commentsList.appendChild(noComments);
        }
        
        // Formulário
        const form = document.createElement('form');
        form.className = 'indie-comments-form';
        
        const nameGroup = document.createElement('div');
        nameGroup.className = 'indie-form-group';
        
        const nameLabel = document.createElement('label');
        nameLabel.setAttribute('for', 'indie-comment-name');
        nameLabel.textContent = 'Nome';
        
        const nameInput = document.createElement('input');
        nameInput.className = 'indie-form-control';
        nameInput.id = 'indie-comment-name';
        nameInput.type = 'text';
        nameInput.placeholder = 'Seu nome (opcional)';
        
        nameGroup.appendChild(nameLabel);
        nameGroup.appendChild(nameInput);
        
        const emailGroup = document.createElement('div');
        emailGroup.className = 'indie-form-group';
        
        const emailLabel = document.createElement('label');
        emailLabel.setAttribute('for', 'indie-comment-email');
        emailLabel.textContent = 'Email';
        
        const emailInput = document.createElement('input');
        emailInput.className = 'indie-form-control';
        emailInput.id = 'indie-comment-email';
        emailInput.type = 'email';
        emailInput.placeholder = 'Seu email (não será publicado)';
        
        emailGroup.appendChild(emailLabel);
        emailGroup.appendChild(emailInput);
        
        const contentGroup = document.createElement('div');
        contentGroup.className = 'indie-form-group';
        
        const contentLabel = document.createElement('label');
        contentLabel.setAttribute('for', 'indie-comment-content');
        contentLabel.textContent = 'Comentário';
        
        const contentTextarea = document.createElement('textarea');
        contentTextarea.className = 'indie-form-control';
        contentTextarea.id = 'indie-comment-content';
        contentTextarea.rows = 4;
        contentTextarea.placeholder = 'Escreva seu comentário aqui...';
        contentTextarea.required = true;
        
        contentGroup.appendChild(contentLabel);
        contentGroup.appendChild(contentTextarea);
        
        const submitBtn = document.createElement('button');
        submitBtn.className = 'indie-btn';
        submitBtn.type = 'submit';
        submitBtn.textContent = 'Enviar Comentário';
        
        form.appendChild(nameGroup);
        form.appendChild(emailGroup);
        form.appendChild(contentGroup);
        form.appendChild(submitBtn);
        
        // Adicionar evento de submit
        form.addEventListener('submit', handleSubmit);
        
        // Footer
        const footer = document.createElement('div');
        footer.className = 'indie-comments-footer';
        footer.innerHTML = 'Comentários por <a href="https://indiecomments.com" target="_blank">Indie Comments</a>';
        
        // Montar tudo
        wrapper.appendChild(style);
        wrapper.appendChild(title);
        wrapper.appendChild(commentsList);
        wrapper.appendChild(form);
        wrapper.appendChild(footer);
        container.appendChild(wrapper);
    }
    
    // Manipular envio de comentário
    async function handleSubmit(event) {
        event.preventDefault();
        
        // Verificar rate limit
        const now = Date.now();
        if (now - lastCommentTime < RATE_LIMIT) {
            showMessage('Por favor, aguarde alguns segundos antes de enviar outro comentário.', 'error');
            return;
        }
        
        // Obter valores do formulário
        const form = event.target;
        const nameInput = form.querySelector('#indie-comment-name');
        const emailInput = form.querySelector('#indie-comment-email');
        const contentTextarea = form.querySelector('#indie-comment-content');
        const submitBtn = form.querySelector('button[type="submit"]');
        
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const content = contentTextarea.value.trim();
        
        if (!content) {
            showMessage('O comentário não pode estar vazio.', 'error');
            return;
        }
        
        // Desabilitar botão
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
        
        try {
            // Obter IP do usuário
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            const ip = ipData.ip;
            
            // Enviar comentário
            const response = await fetch(`${API_BASE_URL}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    author_name: name || 'Anônimo',
                    author_email: email || '',
                    content: content,
                    url: window.location.pathname,
                    ip_address: ip,
                    status: 'pending',
                    created_at: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                throw new Error('Erro ao enviar comentário');
            }
            
            // Atualizar timestamp do último comentário
            lastCommentTime = now;
            
            // Limpar formulário
            nameInput.value = '';
            emailInput.value = '';
            contentTextarea.value = '';
            
            // Mostrar mensagem de sucesso
            showMessage('Comentário enviado com sucesso! Aguardando aprovação.', 'success');
        } catch (error) {
            console.error('Erro ao enviar comentário:', error);
            showMessage('Erro ao enviar comentário. Tente novamente mais tarde.', 'error');
        } finally {
            // Reabilitar botão
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enviar Comentário';
        }
    }
    
    // Mostrar mensagem
    function showMessage(text, type) {
        // Remover mensagem anterior se existir
        const oldMessage = container.querySelector('.indie-comments-message');
        if (oldMessage) {
            oldMessage.remove();
        }
        
        // Criar nova mensagem
        const message = document.createElement('div');
        message.className = `indie-comments-message ${type}`;
        message.textContent = text;
        
        // Inserir após o formulário
        const form = container.querySelector('.indie-comments-form');
        form.parentNode.insertBefore(message, form.nextSibling);
        
        // Remover após 5 segundos
        setTimeout(() => {
            message.remove();
        }, 5000);
    }
    
    // Inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();