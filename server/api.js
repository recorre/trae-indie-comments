/**
 * API.js - Funções para integração com o NoCodeBackend
 * Indie Comments - Sistema de comentários privacy-first
 */

const fetch = require('node-fetch');
require('dotenv').config();

class NoCodeBackendAPI {
    constructor() {
        this.baseUrl = process.env.NOCODEBACKEND_BASE_URL || 'https://openapi.nocodebackend.com';
        this.apiKey = process.env.NOCODEBACKEND_API_KEY;
        this.instanceName = process.env.INSTANCE_NAME || '41300_indie_comments_v2';
    }

    /**
     * Obtém os headers padrão para as requisições
     * @returns {Object} - Headers para as requisições
     */
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        };
    }
    
    /**
     * Método genérico para fazer requisições à API do NoCodeBackend
     * @param {string} endpoint - Endpoint da API
     * @param {string} method - Método HTTP (GET, POST, PUT, DELETE)
     * @param {Object} data - Dados para enviar no corpo da requisição
     * @returns {Promise} - Promessa com o resultado da requisição
     */
    async request(endpoint, method = 'GET', data = null) {
        // Garantir que o endpoint já inclui o parâmetro Instance
        const hasQueryParams = endpoint.includes('?');
        const instanceParam = `Instance=${this.instanceName}`;
        const url = `${this.baseUrl}${endpoint}${hasQueryParams ? '&' : '?'}${instanceParam}`;
        
        console.log(`Fazendo requisição para: ${url}`);
        
        const options = {
            method,
            headers: this.getHeaders()
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || `Erro na requisição: ${response.status}`;
                } catch (e) {
                    errorMessage = `Erro na requisição: ${response.status} - ${errorText}`;
                }
                throw new Error(errorMessage);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Erro na requisição para ${endpoint}:`, error);
            throw error;
        }
    }
    
    // ==================== MÉTODOS PARA COMENTÁRIOS ====================
    
    /**
     * Cria um novo comentário
     * @param {Object} commentData - Dados do comentário (thread_id, author_name, author_email, message, visible, ip_address)
     * @returns {Promise} - Promessa com o resultado da criação
     */
    async createComment(commentData) {
        return this.request('/create/comments', 'POST', commentData);
    }
    
    /**
     * Obtém todos os comentários
     * @param {Object} filters - Filtros para a busca (opcional)
     * @returns {Promise} - Promessa com os comentários encontrados
     */
    async getComments(filters = {}) {
        // Constrói a query string com os filtros
        const queryParams = Object.entries(filters)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');
            
        const endpoint = `/read/comments${queryParams ? `&${queryParams}` : ''}`;
        return this.request(endpoint);
    }
    
    /**
     * Obtém comentários por thread_id
     * @param {number} threadId - ID da thread
     * @returns {Promise} - Promessa com os comentários encontrados
     */
    async getCommentsByThreadId(threadId) {
        return this.getComments({ thread_id: threadId });
    }
    
    /**
     * Obtém um comentário pelo ID
     * @param {number} id - ID do comentário
     * @returns {Promise} - Promessa com o comentário encontrado
     */
    async getCommentById(id) {
        return this.request(`/read/comments/${id}`);
    }
    
    /**
     * Atualiza um comentário
     * @param {number} id - ID do comentário
     * @param {Object} commentData - Dados do comentário
     * @returns {Promise} - Promessa com o resultado da atualização
     */
    async updateComment(id, commentData) {
        return this.request(`/update/comments/${id}`, 'PUT', commentData);
    }
    
    /**
     * Exclui um comentário
     * @param {number} id - ID do comentário
     * @returns {Promise} - Promessa com o resultado da exclusão
     */
    async deleteComment(id) {
        return this.request(`/delete/comments/${id}`, 'DELETE');
    }
    
    // ==================== MÉTODOS PARA SITES ====================
    
    /**
     * Cria um novo site
     * @param {Object} siteData - Dados do site (user_id, site_url, site_name, api_key)
     * @returns {Promise} - Promessa com o resultado da criação
     */
    async createSite(siteData) {
        return this.request('/create/sites', 'POST', siteData);
    }
    
    /**
     * Obtém todos os sites
     * @param {Object} filters - Filtros para a busca (opcional)
     * @returns {Promise} - Promessa com os sites encontrados
     */
    async getSites(filters = {}) {
        // Constrói a query string com os filtros
        const queryParams = Object.entries(filters)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');
            
        const endpoint = `/read/sites${queryParams ? `&${queryParams}` : ''}`;
        return this.request(endpoint);
    }
    
    /**
     * Obtém sites por user_id
     * @param {number} userId - ID do usuário
     * @returns {Promise} - Promessa com os sites encontrados
     */
    async getSitesByUserId(userId) {
        return this.getSites({ user_id: userId });
    }
    
    /**
     * Obtém um site pelo ID
     * @param {number} id - ID do site
     * @returns {Promise} - Promessa com o site encontrado
     */
    async getSiteById(id) {
        return this.request(`/read/sites/${id}`);
    }
    
    /**
     * Obtém um site pela API key
     * @param {string} apiKey - API key do site
     * @returns {Promise} - Promessa com o site encontrado
     */
    async getSiteByApiKey(apiKey) {
        return this.getSites({ api_key: apiKey });
    }
    
    /**
     * Atualiza um site
     * @param {number} id - ID do site
     * @param {Object} siteData - Dados do site
     * @returns {Promise} - Promessa com o resultado da atualização
     */
    async updateSite(id, siteData) {
        return this.request(`/update/sites/${id}`, 'PUT', siteData);
    }
    
    /**
     * Exclui um site
     * @param {number} id - ID do site
     * @returns {Promise} - Promessa com o resultado da exclusão
     */
    async deleteSite(id) {
        return this.request(`/delete/sites/${id}`, 'DELETE');
    }
    
    // ==================== MÉTODOS PARA USUÁRIOS ====================
    
    /**
     * Cria um novo usuário
     * @param {Object} userData - Dados do usuário (name, email, password, plan)
     * @returns {Promise} - Promessa com o resultado da criação
     */
    async createUser(userData) {
        return this.request('/create/users', 'POST', userData);
    }
    
    /**
     * Obtém todos os usuários
     * @param {Object} filters - Filtros para a busca (opcional)
     * @returns {Promise} - Promessa com os usuários encontrados
     */
    async getUsers(filters = {}) {
        // Constrói a query string com os filtros
        const queryParams = Object.entries(filters)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');
            
        const endpoint = `/read/users${queryParams ? `&${queryParams}` : ''}`;
        return this.request(endpoint);
    }
    
    /**
     * Obtém um usuário pelo email
     * @param {string} email - Email do usuário
     * @returns {Promise} - Promessa com o usuário encontrado ou null
     */
    async getUserByEmail(email) {
        const response = await this.getUsers({ email });
        return response.data && response.data.length > 0 ? response.data[0] : null;
    }
    
    /**
     * Obtém um usuário pelo ID
     * @param {number} id - ID do usuário
     * @returns {Promise} - Promessa com o usuário encontrado
     */
    async getUserById(id) {
        return this.request(`/read/users/${id}`);
    }
    
    /**
     * Atualiza um usuário
     * @param {number} id - ID do usuário
     * @param {Object} userData - Dados do usuário
     * @returns {Promise} - Promessa com o resultado da atualização
     */
    async updateUser(id, userData) {
        return this.request(`/update/users/${id}`, 'PUT', userData);
    }
    
    /**
     * Exclui um usuário
     * @param {number} id - ID do usuário
     * @returns {Promise} - Promessa com o resultado da exclusão
     */
    async deleteUser(id) {
        return this.request(`/delete/users/${id}`, 'DELETE');
    }
}

module.exports = NoCodeBackendAPI;
            throw error;
        }
    }

    /**
     * Cria um comentário
     * @param {Object} commentData - Dados do comentário
     * @returns {Promise} - Promessa com o resultado da criação
     */
    async createComment(commentData) {
        try {
            const response = await fetch(`${this.baseUrl}/comments`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(commentData)
            });

            if (!response.ok) {
                throw new Error('Erro ao criar comentário');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao criar comentário:', error);
            throw error;
        }
    }

    /**
     * Obtém os comentários de um site
     * @param {string} siteId - ID do site
     * @param {string} status - Status dos comentários (opcional)
     * @returns {Promise} - Promessa com os comentários do site
     */
    async getCommentsBySiteId(siteId, status = null) {
        try {
            let filterString = `site_id:${siteId}`;
            
            if (status) {
                filterString += `,status:${status}`;
            }
            
            const response = await fetch(`${this.baseUrl}/comments?filter=${filterString}`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar comentários');
            }

            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error('Erro ao buscar comentários:', error);
            throw error;
        }
    }

    /**
     * Obtém um comentário pelo ID
     * @param {string} id - ID do comentário
     * @returns {Promise} - Promessa com o comentário encontrado
     */
    async getCommentById(id) {
        try {
            const response = await fetch(`${this.baseUrl}/comments/${id}`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar comentário');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar comentário:', error);
            throw error;
        }
    }

    /**
     * Atualiza um comentário
     * @param {string} id - ID do comentário
     * @param {Object} commentData - Dados do comentário
     * @returns {Promise} - Promessa com o resultado da atualização
     */
    async updateComment(id, commentData) {
        try {
            const response = await fetch(`${this.baseUrl}/comments/${id}`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify(commentData)
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar comentário');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao atualizar comentário:', error);
            throw error;
        }
    }

    /**
     * Exclui um comentário
     * @param {string} id - ID do comentário
     * @returns {Promise} - Promessa com o resultado da exclusão
     */
    async deleteComment(id) {
        try {
            const response = await fetch(`${this.baseUrl}/comments/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error('Erro ao excluir comentário');
            }

            return { success: true };
        } catch (error) {
            console.error('Erro ao excluir comentário:', error);
            throw error;
        }
    }

    /**
     * Faz uma requisição genérica para o NoCodeBackend
     * @param {string} endpoint - Endpoint da API
     * @param {string} method - Método HTTP
     * @param {Object} body - Corpo da requisição (opcional)
     * @returns {Promise} - Promessa com o resultado da requisição
     */
    async request(endpoint, method = 'GET', body = null) {
        try {
            const options = {
                method,
                headers: this.getHeaders()
            };

            if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(`${this.baseUrl}/${endpoint}`, options);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Erro na requisição para ${endpoint}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Erro na requisição para ${endpoint}:`, error);
            throw error;
        }
    }
}

module.exports = new NoCodeBackendAPI();