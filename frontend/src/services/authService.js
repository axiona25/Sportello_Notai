/**
 * Authentication Service
 * Gestisce login, logout e token JWT
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

class AuthService {
  /**
   * Login utente
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>} User data e tokens
   */
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Login fallito')
      }

      const data = await response.json()

      // Se MFA richiesto, ritorna per gestione separata
      if (data.mfa_required) {
        return data
      }

      // Salva tokens e user in localStorage
      if (data.access && data.refresh) {
        this.setTokens(data.access, data.refresh)
        this.setUser(data.user)
      }

      return data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  /**
   * Logout utente
   * Invalida il token sul backend e rimuove dati locali
   */
  async logout() {
    try {
      const refreshToken = this.getRefreshToken()
      const accessToken = this.getAccessToken()

      if (refreshToken && accessToken) {
        // Chiama backend per blacklist token
        await fetch(`${API_BASE_URL}/auth/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Rimuovi sempre dati locali anche se chiamata backend fallisce
      this.clearAuth()
    }
  }

  /**
   * Salva tokens in localStorage
   */
  setTokens(accessToken, refreshToken) {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
  }

  /**
   * Ottieni access token
   */
  getAccessToken() {
    return localStorage.getItem('access_token')
  }

  /**
   * Ottieni refresh token
   */
  getRefreshToken() {
    return localStorage.getItem('refresh_token')
  }

  /**
   * Salva dati utente
   */
  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user))
  }

  /**
   * Ottieni dati utente
   */
  getUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  }

  /**
   * Verifica se utente è autenticato
   */
  isAuthenticated() {
    return !!this.getAccessToken()
  }

  /**
   * Verifica ruolo utente
   */
  getUserRole() {
    const user = this.getUser()
    return user?.role || null
  }

  /**
   * Pulisci tutti i dati di autenticazione
   */
  clearAuth() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken() {
    try {
      const refreshToken = this.getRefreshToken()
      
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      
      // Aggiorna access token
      if (data.access) {
        localStorage.setItem('access_token', data.access)
      }

      return data.access
    } catch (error) {
      console.error('Token refresh error:', error)
      this.clearAuth()
      throw error
    }
  }

  /**
   * Ottieni headers per richieste autenticate
   */
  getAuthHeaders() {
    const token = this.getAccessToken()
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    }
  }
}

// Esporta istanza singleton
export default new AuthService()

