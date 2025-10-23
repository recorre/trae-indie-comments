/**
 * Main.js - Funções para gerenciamento da interface do painel administrativo
 * Indie Comments - Sistema de comentários privacy-first
 */

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar o painel
    initPanel();
});

/**
 * Inicializa o painel administrativo
 */
async function initPanel() {
    // Verificar autenticação
    const authStatus = await api.checkAuth();
    
    if (authStatus.authenticated) {
        // Usuário autenticado, mostrar painel
        showDashboard(authStatus.user);
        loadUserData(authStatus.user);
    } else {
        // Usuário não autenticado, mostrar tela de login
        showAuthScreen();
    }
    
    // Configurar event listeners
    setupEventListeners();
}

/**
 * Configura os event listeners
 */
function setupEventListeners() {
    // Formulário de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Formulário de cadastro
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Botão de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Abas do painel
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Botão para adicionar site
    const addSiteBtn = document.getElementById('add-site-btn');
    if (addSiteBtn) {
        addSiteBtn.addEventListener('click', () => {
            document.getElementById('add-site-modal').classList.add('active');
        });
    }
    
    // Formulário para adicionar site
    const addSiteForm = document.getElementById('add-site-form');
    if (addSiteForm) {
        addSiteForm.addEventListener('submit', handleAddSite);
    }
    
    // Botão para fechar modais
    const closeModalBtns = document.querySelectorAll('.close-modal');
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        });
    });
    
    // Botão para upgrade de plano
    const upgradePlanBtn = document.getElementById('upgrade-plan-btn');
    if (upgradePlanBtn) {
        upgradePlanBtn.addEventListener('click', () => {
            document.getElementById('upgrade-plan-modal').classList.add('active');
        });
    }
    
    // Formulário de configurações
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleUpdateSettings);
    }
    
    // Botão para excluir conta
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', handleDeleteAccount);
    }
}

/**
 * Mostra a tela de autenticação
 */
function showAuthScreen() {
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('dashboard-container').style.display = 'none';
    
    // Configurar alternância entre login e cadastro
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
    });
    
    signupTab.addEventListener('click', () => {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.style.display = 'block';
        loginForm.style.display = 'none';
    });
}

/**
 * Mostra o painel administrativo
 * @param {Object} user - Dados do usuário
 */
function showDashboard(user) {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('dashboard-container').style.display = 'block';
    
    // Exibir nome do usuário
    const userNameElement = document.getElementById('user-name');
    if (userNameElement && user.name) {
        userNameElement.textContent = user.name;
    }
    
    // Carregar dados iniciais
    loadSites();
    loadComments();
    
    // Ativar a primeira aba por padrão
    switchTab('sites');
}

/**
 * Alterna entre as abas do painel
 * @param {string} tabId - ID da aba a ser exibida
 */
function switchTab(tabId) {
    // Desativar todas as abas
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Ativar a aba selecionada
    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(`${tabId}-tab`).classList.add('active');
    
    // Recarregar dados da aba, se necessário
    if (tabId === 'sites') {
        loadSites();
    } else if (tabId === 'comments') {
        loadComments();
    }
}

/**
 * Carrega os sites do usuário
 */
async function loadSites() {
    try {
        const sitesContainer = document.getElementById('sites-list');
        sitesContainer.innerHTML = '<div class="loading">Carregando sites...</div>';
        
        const sites = await api.getSites();
        
        if (sites.length === 0) {
            sitesContainer.innerHTML = `
                <div class="empty-state">
                    <p>Você ainda não tem sites cadastrados.</p>
                    <button id="empty-add-site-btn" class="btn primary">Adicionar Site</button>
                </div>
            `;
            
            document.getElementById('empty-add-site-btn').addEventListener('click', () => {
                document.getElementById('add-site-modal').classList.add('active');
            });
            
            return;
        }
        
        sitesContainer.innerHTML = '';
        
        sites.forEach(site => {
            const siteElement = document.createElement('div');
            siteElement.className = 'site-item';
            siteElement.innerHTML = `
                <div class="site-info">
                    <h3>${site.name}</h3>
                    <p>${site.domain}</p>
                </div>
                <div class="site-actions">
                    <button class="btn view-comments" data-site-id="${site.id}">Ver Comentários</button>
                    <button class="btn copy-script" data-site-id="${site.id}" data-api-key="${site.api_key}">Copiar Script</button>
                    <button class="btn danger remove-site" data-site-id="${site.id}">Remover</button>
                </div>
            `;
            
            sitesContainer.appendChild(siteElement);
        });
        
        // Configurar event listeners para os botões
        document.querySelectorAll('.view-comments').forEach(btn => {
            btn.addEventListener('click', () => {
                const siteId = btn.getAttribute('data-site-id');
                switchTab('comments');
                loadComments({ siteId });
            });
        });
        
        document.querySelectorAll('.copy-script').forEach(btn => {
            btn.addEventListener('click', () => {
                const siteId = btn.getAttribute('data-site-id');
                const apiKey = btn.getAttribute('data-api-key');
                copyWidgetScript(siteId, apiKey);
            });
        });
        
        document.querySelectorAll('.remove-site').forEach(btn => {
            btn.addEventListener('click', async () => {
                const siteId = btn.getAttribute('data-site-id');
                if (confirm('Tem certeza que deseja remover este site? Todos os comentários serão perdidos.')) {
                    await removeSite(siteId);
                }
            });
        });
    } catch (error) {
        console.error('Erro ao carregar sites:', error);
        document.getElementById('sites-list').innerHTML = `
            <div class="error-state">
                <p>Erro ao carregar sites. Tente novamente mais tarde.</p>
                <button class="btn primary" onclick="loadSites()">Tentar Novamente</button>
            </div>
        `;
    }
}

/**
 * Carrega os comentários
 * @param {Object} filters - Filtros para os comentários
 */
async function loadComments(filters = {}) {
    try {
        const commentsContainer = document.getElementById('comments-list');
        commentsContainer.innerHTML = '<div class="loading">Carregando comentários...</div>';
        
        // Atualizar filtros na interface
        if (filters.siteId) {
            document.getElementById('filter-site').value = filters.siteId;
        }
        
        if (filters.status) {
            document.getElementById('filter-status').value = filters.status;
        }
        
        const comments = await api.getComments(filters);
        
        if (comments.length === 0) {
            commentsContainer.innerHTML = `
                <div class="empty-state">
                    <p>Nenhum comentário encontrado.</p>
                </div>
            `;
            return;
        }
        
        commentsContainer.innerHTML = '';
        
        // Obter sites para exibir nome do site
        const sites = await api.getSites();
        const sitesMap = {};
        sites.forEach(site => {
            sitesMap[site.id] = site;
        });
        
        comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = `comment-item ${comment.status}`;
            
            const siteName = sitesMap[comment.site_id] ? sitesMap[comment.site_id].name : 'Site desconhecido';
            const date = new Date(comment.created_at).toLocaleDateString('pt-BR');
            
            commentElement.innerHTML = `
                <div class="comment-header">
                    <div class="comment-meta">
                        <span class="author">${comment.author}</span>
                        <span class="date">${date}</span>
                        <span class="site">${siteName}</span>
                    </div>
                    <div class="comment-status">
                        <span class="status-badge ${comment.status}">${getStatusLabel(comment.status)}</span>
                    </div>
                </div>
                <div class="comment-content">
                    <p>${comment.content}</p>
                </div>
                <div class="comment-actions">
                    ${comment.status === 'pending' ? `
                        <button class="btn approve" data-comment-id="${comment.id}">Aprovar</button>
                        <button class="btn danger reject" data-comment-id="${comment.id}">Rejeitar</button>
                    ` : ''}
                </div>
            `;
            
            commentsContainer.appendChild(commentElement);
        });
        
        // Configurar event listeners para os botões
        document.querySelectorAll('.approve').forEach(btn => {
            btn.addEventListener('click', async () => {
                const commentId = btn.getAttribute('data-comment-id');
                await updateCommentStatus(commentId, 'approved');
            });
        });
        
        document.querySelectorAll('.reject').forEach(btn => {
            btn.addEventListener('click', async () => {
                const commentId = btn.getAttribute('data-comment-id');
                await updateCommentStatus(commentId, 'rejected');
            });
        });
        
        // Configurar filtros
        setupCommentFilters();
    } catch (error) {
        console.error('Erro ao carregar comentários:', error);
        document.getElementById('comments-list').innerHTML = `
            <div class="error-state">
                <p>Erro ao carregar comentários. Tente novamente mais tarde.</p>
                <button class="btn primary" onclick="loadComments()">Tentar Novamente</button>
            </div>
        `;
    }
}

/**
 * Configura os filtros de comentários
 */
async function setupCommentFilters() {
    const filterSite = document.getElementById('filter-site');
    const filterStatus = document.getElementById('filter-status');
    
    // Limpar opções existentes
    filterSite.innerHTML = '<option value="">Todos os sites</option>';
    
    // Carregar sites para o filtro
    try {
        const sites = await api.getSites();
        
        sites.forEach(site => {
            const option = document.createElement('option');
            option.value = site.id;
            option.textContent = site.name;
            filterSite.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar sites para filtro:', error);
    }
    
    // Configurar event listeners para os filtros
    filterSite.addEventListener('change', () => {
        const filters = {
            siteId: filterSite.value,
            status: filterStatus.value
        };
        
        loadComments(filters);
    });
    
    filterStatus.addEventListener('change', () => {
        const filters = {
            siteId: filterSite.value,
            status: filterStatus.value
        };
        
        loadComments(filters);
    });
}

/**
 * Atualiza o status de um comentário
 * @param {string} commentId - ID do comentário
 * @param {string} status - Novo status
 */
async function updateCommentStatus(commentId, status) {
    try {
        await api.updateCommentStatus(commentId, status);
        
        // Recarregar comentários
        const filterSite = document.getElementById('filter-site');
        const filterStatus = document.getElementById('filter-status');
        
        loadComments({
            siteId: filterSite.value,
            status: filterStatus.value
        });
        
        showNotification(`Comentário ${status === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso!`);
    } catch (error) {
        console.error('Erro ao atualizar status do comentário:', error);
        showNotification('Erro ao atualizar status do comentário.', 'error');
    }
}

/**
 * Remove um site
 * @param {string} siteId - ID do site
 */
async function removeSite(siteId) {
    try {
        await api.removeSite(siteId);
        loadSites();
        showNotification('Site removido com sucesso!');
    } catch (error) {
        console.error('Erro ao remover site:', error);
        showNotification('Erro ao remover site.', 'error');
    }
}

/**
 * Copia o script do widget para o site
 * @param {string} siteId - ID do site
 * @param {string} apiKey - API key do site
 */
function copyWidgetScript(siteId, apiKey) {
    const script = `<div id="indie-comments"></div>
<script src="${window.location.origin}/widget/indie_comments.js"></script>
<script>
    IndieComments.init({
        container: '#indie-comments',
        siteId: '${siteId}',
        apiKey: '${apiKey}'
    });
</script>`;
    
    // Copiar para a área de transferência
    navigator.clipboard.writeText(script)
        .then(() => {
            showNotification('Script copiado para a área de transferência!');
        })
        .catch(err => {
            console.error('Erro ao copiar script:', err);
            showNotification('Erro ao copiar script.', 'error');
            
            // Fallback: mostrar o script em um modal
            alert('Copie o script abaixo:\n\n' + script);
        });
}

/**
 * Carrega os dados do usuário
 * @param {Object} user - Dados do usuário
 */
function loadUserData(user) {
    // Preencher campos do formulário de configurações
    const nameInput = document.getElementById('settings-name');
    if (nameInput && user.name) {
        nameInput.value = user.name;
    }
    
    const emailInput = document.getElementById('settings-email');
    if (emailInput && user.email) {
        emailInput.value = user.email;
        emailInput.disabled = true; // Email não pode ser alterado
    }
    
    // Exibir plano atual
    const planBadge = document.getElementById('current-plan');
    if (planBadge) {
        planBadge.textContent = user.plan === 'supporter' ? 'Supporter' : 'Free';
        planBadge.className = user.plan === 'supporter' ? 'plan-badge supporter' : 'plan-badge free';
    }
    
    // Esconder botão de upgrade se já for supporter
    const upgradePlanBtn = document.getElementById('upgrade-plan-btn');
    if (upgradePlanBtn && user.plan === 'supporter') {
        upgradePlanBtn.style.display = 'none';
    }
}

/**
 * Manipula o envio do formulário de login
 * @param {Event} event - Evento de submit
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showNotification('Preencha todos os campos.', 'error');
        return;
    }
    
    try {
        const result = await api.login(email, password);
        
        if (result.success) {
            showDashboard(result.user);
            loadUserData(result.user);
            showNotification('Login realizado com sucesso!');
        } else {
            showNotification(result.error || 'Erro ao fazer login.', 'error');
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        showNotification('Erro ao fazer login.', 'error');
    }
}

/**
 * Manipula o envio do formulário de cadastro
 * @param {Event} event - Evento de submit
 */
async function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    
    if (!name || !email || !password || !confirmPassword) {
        showNotification('Preencha todos os campos.', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('As senhas não coincidem.', 'error');
        return;
    }
    
    try {
        const result = await api.signup(name, email, password);
        
        if (result.success) {
            showDashboard(result.user);
            loadUserData(result.user);
            showNotification('Cadastro realizado com sucesso!');
        } else {
            showNotification(result.error || 'Erro ao fazer cadastro.', 'error');
        }
    } catch (error) {
        console.error('Erro ao fazer cadastro:', error);
        showNotification('Erro ao fazer cadastro.', 'error');
    }
}

/**
 * Manipula o logout
 */
function handleLogout() {
    api.logout();
    showAuthScreen();
    showNotification('Logout realizado com sucesso!');
}

/**
 * Manipula o envio do formulário de adição de site
 * @param {Event} event - Evento de submit
 */
async function handleAddSite(event) {
    event.preventDefault();
    
    const name = document.getElementById('site-name').value;
    const domain = document.getElementById('site-domain').value;
    
    if (!name || !domain) {
        showNotification('Preencha todos os campos.', 'error');
        return;
    }
    
    try {
        await api.addSite(name, domain);
        
        // Fechar modal
        document.getElementById('add-site-modal').classList.remove('active');
        
        // Limpar formulário
        document.getElementById('site-name').value = '';
        document.getElementById('site-domain').value = '';
        
        // Recarregar sites
        loadSites();
        
        showNotification('Site adicionado com sucesso!');
    } catch (error) {
        console.error('Erro ao adicionar site:', error);
        showNotification('Erro ao adicionar site.', 'error');
    }
}

/**
 * Manipula o envio do formulário de configurações
 * @param {Event} event - Evento de submit
 */
async function handleUpdateSettings(event) {
    event.preventDefault();
    
    const name = document.getElementById('settings-name').value;
    const password = document.getElementById('settings-password').value;
    const confirmPassword = document.getElementById('settings-confirm-password').value;
    
    if (!name) {
        showNotification('O nome é obrigatório.', 'error');
        return;
    }
    
    if (password && password !== confirmPassword) {
        showNotification('As senhas não coincidem.', 'error');
        return;
    }
    
    const settings = { name };
    
    if (password) {
        settings.password = password;
    }
    
    try {
        await api.updateUserSettings(settings);
        
        // Limpar campos de senha
        document.getElementById('settings-password').value = '';
        document.getElementById('settings-confirm-password').value = '';
        
        showNotification('Configurações atualizadas com sucesso!');
    } catch (error) {
        console.error('Erro ao atualizar configurações:', error);
        showNotification('Erro ao atualizar configurações.', 'error');
    }
}

/**
 * Manipula a exclusão da conta
 */
async function handleDeleteAccount() {
    if (confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
        try {
            await api.deleteAccount();
            showAuthScreen();
            showNotification('Conta excluída com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir conta:', error);
            showNotification('Erro ao excluir conta.', 'error');
        }
    }
}

/**
 * Exibe uma notificação
 * @param {string} message - Mensagem da notificação
 * @param {string} type - Tipo da notificação (success, error)
 */
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Mostrar notificação
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remover notificação após 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

/**
 * Obtém o label do status
 * @param {string} status - Status do comentário
 * @returns {string} - Label do status
 */
function getStatusLabel(status) {
    switch (status) {
        case 'pending':
            return 'Pendente';
        case 'approved':
            return 'Aprovado';
        case 'rejected':
            return 'Rejeitado';
        default:
            return status;
    }
}