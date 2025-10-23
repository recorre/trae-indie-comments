/**
 * API.js - Funções para comunicação com o backend
 * Indie Comments - Sistema de comentários privacy-first
 */

class API {
    constructor() {
        // URL base da API
        this.baseUrl = window.location.origin + '/api';
        
        // Token JWT armazenado no localStorage
        this.token = localStorage.getItem('token');
    }

    /**
     * Obtém os headers padrão para as requisições
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = this.token;
        }
        
        return headers;
    }

    /**
     * Faz login no sistema
     * @param {string} email - Email do usuário
     * @param {string} password - Senha do usuário
     * @returns {Promise} - Promessa com o resultado do login
     */
    async login(email, password) {
        try {
            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao fazer login');
            }
            
            // Armazenar token JWT
            this.token = data.token;
            localStorage.setItem('token', data.token);
            
            return {
                success: true,
                user: data.user
            };
        } catch (error) {
            console.error('Erro de login:', error);
            return {
                success: false,
                error: error.message || 'Erro ao fazer login'
            };
        }
    }

    /**
     * Faz cadastro no sistema
     * @param {string} name - Nome do usuário
     * @param {string} email - Email do usuário
     * @param {string} password - Senha do usuário
     * @returns {Promise} - Promessa com o resultado do cadastro
     */
    async signup(name, email, password) {
        try {
            const response = await fetch(`${this.baseUrl}/signup`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao fazer cadastro');
            }
            
            // Armazenar token JWT
            this.token = data.token;
            localStorage.setItem('token', data.token);
            
            return {
                success: true,
                user: data.user
            };
        } catch (error) {
            console.error('Erro de cadastro:', error);
            return {
                success: false,
                error: error.message || 'Erro ao fazer cadastro'
            };
        }
    }

    /**
     * Faz logout do sistema
     */
    logout() {
        this.token = null;
        localStorage.removeItem('token');
    }

    /**
     * Verifica se o usuário está autenticado
     * @returns {Promise} - Promessa com o resultado da verificação
     */
    async checkAuth() {
        if (!this.token) {
            return { authenticated: false };
        }
        
        try {
            const response = await fetch(`${this.baseUrl}/me`, {
                headers: this.getHeaders()
            });
            
            if (!response.ok) {
                this.logout();
                return { authenticated: false };
            }
            
            const data = await response.json();
            return {
                authenticated: true,
                user: data.user
            };
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            this.logout();
            return { authenticated: false };
        }
    }

    /**
     * Obtém os sites do usuário
     * @returns {Promise} - Promessa com os sites do usuário
     */
    async getSites() {
        try {
            const response = await fetch(`${this.baseUrl}/proxy/sites?filter=user_id:${this.getUserId()}`, {
                headers: this.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error('Erro ao obter sites');
            }
            
            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error('Erro ao obter sites:', error);
            throw error;
        }
    }

    /**
     * Adiciona um novo site
     * @param {string} name - Nome do site
     * @param {string} domain - Domínio do site
     * @returns {Promise} - Promessa com o resultado da adição
     */
    async addSite(name, domain) {
        try {
            // Gerar API key aleatória
            const apiKey = this.generateApiKey();
            
            const response = await fetch(`${this.baseUrl}/proxy/sites`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    name,
                    domain,
                    api_key: apiKey,
                    user_id: this.getUserId(),
                    created_at: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                throw new Error('Erro ao adicionar site');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao adicionar site:', error);
            throw error;
        }
    }

    /**
     * Remove um site
     * @param {string} siteId - ID do site
     * @returns {Promise} - Promessa com o resultado da remoção
     */
    async removeSite(siteId) {
        try {
            const response = await fetch(`${this.baseUrl}/proxy/sites/${siteId}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error('Erro ao remover site');
            }
            
            return { success: true };
        } catch (error) {
            console.error('Erro ao remover site:', error);
            throw error;
        }
    }

    /**
     * Obtém os comentários
     * @param {Object} filters - Filtros para os comentários
     * @returns {Promise} - Promessa com os comentários
     */
    async getComments(filters = {}) {
        try {
            let filterString = '';
            
            // Construir string de filtro
            if (filters.siteId) {
                filterString += `site_id:${filters.siteId}`;
            }
            
            if (filters.status) {
                if (filterString) filterString += ',';
                filterString += `status:${filters.status}`;
            }
            
            // Obter sites do usuário
            const sites = await this.getSites();
            const siteIds = sites.map(site => site.id);
            
            if (siteIds.length > 0 && !filters.siteId) {
                if (filterString) filterString += ',';
                filterString += `site_id:in:${siteIds.join(',')}`;
            }
            
            const url = `${this.baseUrl}/proxy/comments${filterString ? `?filter=${filterString}` : ''}`;
            
            const response = await fetch(url, {
                headers: this.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error('Erro ao obter comentários');
            }
            
            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error('Erro ao obter comentários:', error);
            throw error;
        }
    }

    /**
     * Atualiza o status de um comentário
     * @param {string} commentId - ID do comentário
     * @param {string} status - Novo status (approved, rejected)
     * @returns {Promise} - Promessa com o resultado da atualização
     */
    async updateCommentStatus(commentId, status) {
        try {
            const response = await fetch(`${this.baseUrl}/proxy/comments/${commentId}`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    status
                })
            });
            
            if (!response.ok) {
                throw new Error('Erro ao atualizar status do comentário');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao atualizar status do comentário:', error);
            throw error;
        }
    }

    /**
     * Atualiza as configurações do usuário
     * @param {Object} settings - Novas configurações
     * @returns {Promise} - Promessa com o resultado da atualização
     */
    async updateUserSettings(settings) {
        try {
            const userId = this.getUserId();
            const updateData = {};
            
            if (settings.name) {
                updateData.name = settings.name;
            }
            
            if (settings.password) {
                updateData.password = settings.password;
            }
            
            const response = await fetch(`${this.baseUrl}/proxy/users/${userId}`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify(updateData)
            });
            
            if (!response.ok) {
                throw new Error('Erro ao atualizar configurações');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao atualizar configurações:', error);
            throw error;
        }
    }

    /**
     * Faz upgrade do plano do usuário
     * @returns {Promise} - Promessa com o resultado do upgrade
     */
    async upgradePlan() {
        try {
            const userId = this.getUserId();
            
            const response = await fetch(`${this.baseUrl}/proxy/users/${userId}`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    plan: 'supporter'
                })
            });
            
            if (!response.ok) {
                throw new Error('Erro ao fazer upgrade do plano');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao fazer upgrade do plano:', error);
            throw error;
        }
    }

    /**
     * Exclui a conta do usuário
     * @returns {Promise} - Promessa com o resultado da exclusão
     */
    async deleteAccount() {
        try {
            const userId = this.getUserId();
            
            const response = await fetch(`${this.baseUrl}/proxy/users/${userId}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error('Erro ao excluir conta');
            }
            
            this.logout();
            return { success: true };
        } catch (error) {
            console.error('Erro ao excluir conta:', error);
            throw error;
        }
    }

    /**
     * Obtém o ID do usuário a partir do token JWT
     * @returns {string} - ID do usuário
     */
    getUserId() {
        if (!this.token) return null;
        
        try {
            // Decodificar token JWT (parte simples, sem verificação)
            const base64Url = this.token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const payload = JSON.parse(jsonPayload);
            return payload.id;
        } catch (error) {
            console.error('Erro ao decodificar token:', error);
            return null;
        }
    }

    /**
     * Gera uma API key aleatória
     * @returns {string} - API key gerada
     */
    generateApiKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}

// Exportar instância da API
const api = new API();