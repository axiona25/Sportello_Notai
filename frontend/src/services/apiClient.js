/**
 * API Client
 * Client centralizzato per tutte le chiamate API con gestione automatica JWT
 */

import authService from './authService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api'

/**
 * Wrapper per fetch con gestione automatica JWT
 */
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL
    this.refreshing = false
    this.refreshSubscribers = []
  }

  /**
   * Gestione refresh token in corso
   */
  subscribeTokenRefresh(callback) {
    this.refreshSubscribers.push(callback)
  }

  onRefreshed(token) {
    this.refreshSubscribers.forEach(callback => callback(token))
    this.refreshSubscribers = []
  }

  /**
   * Request con retry automatico in caso di 401
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const token = authService.getAccessToken()

    // Prepara headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Aggiungi token se disponibile
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // Configurazione request
    const config = {
      ...options,
      headers,
    }

    try {
      const response = await fetch(url, config)

      // Se 401, prova a fare refresh del token
      if (response.status === 401 && token) {
        return await this.handleUnauthorized(endpoint, options)
      }

      // Se 403, utente non autorizzato per questa risorsa
      if (response.status === 403) {
        throw new Error('Non autorizzato ad accedere a questa risorsa')
      }

      // Se errore, lancia eccezione
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        
        // Estrai il messaggio di errore in modo intelligente
        let errorMessage = ''
        
        // Se c'è un campo 'message' che contiene gli errori di validazione
        if (error.message && typeof error.message === 'object') {
          const validationErrors = Object.entries(error.message)
            .map(([field, messages]) => {
              if (Array.isArray(messages)) {
                // Estrai il messaggio da ErrorDetail objects o stringhe
                const msgTexts = messages.map(msg => {
                  if (typeof msg === 'object' && msg.string) return msg.string
                  if (typeof msg === 'string') return msg
                  return JSON.stringify(msg)
                })
                return `${field}: ${msgTexts.join(', ')}`
              }
              return `${field}: ${messages}`
            })
            .join('; ')
          errorMessage = validationErrors
        }
        // Se è un oggetto con errori diretti (senza 'message')
        else if (typeof error === 'object' && !error.detail && !error.error) {
          const validationErrors = Object.entries(error)
            .filter(([key]) => key !== 'error' && key !== 'status_code')
            .map(([field, messages]) => {
              if (Array.isArray(messages)) {
                const msgTexts = messages.map(msg => {
                  if (typeof msg === 'object' && msg.string) return msg.string
                  if (typeof msg === 'string') return msg
                  return JSON.stringify(msg)
                })
                return `${field}: ${msgTexts.join(', ')}`
              }
              return `${field}: ${messages}`
            })
            .join('; ')
          errorMessage = validationErrors || error.detail || error.error
        }
        // Altrimenti usa detail o error standard
        else {
          errorMessage = error.detail || error.error
        }
        
        throw new Error(errorMessage || `HTTP ${response.status}`)
      }

      // Ritorna risposta JSON
      return await response.json()
    } catch (error) {
      console.error('API Request error:', error)
      throw error
    }
  }

  /**
   * Gestisce errore 401 con refresh token
   */
  async handleUnauthorized(endpoint, options) {
    // Se già sto facendo refresh, aspetta
    if (this.refreshing) {
      return new Promise((resolve, reject) => {
        this.subscribeTokenRefresh(token => {
          if (token) {
            resolve(this.request(endpoint, options))
          } else {
            reject(new Error('Token refresh failed'))
          }
        })
      })
    }

    this.refreshing = true

    try {
      // Prova a fare refresh del token
      const newToken = await authService.refreshAccessToken()
      this.refreshing = false
      this.onRefreshed(newToken)

      // Riprova la richiesta originale
      return await this.request(endpoint, options)
    } catch (error) {
      this.refreshing = false
      this.onRefreshed(null)

      // Se refresh fallisce, fai logout
      authService.clearAuth()
      window.location.href = '/login'
      throw error
    }
  }

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'GET',
    })
  }

  /**
   * POST request
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * PUT request
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'DELETE',
    })
  }

  /**
   * Upload file (multipart/form-data)
   */
  async upload(endpoint, formData, options = {}) {
    const token = authService.getAccessToken()
    const headers = {
      ...options.headers,
    }

    // NON impostare Content-Type per multipart, fetch lo fa automaticamente
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
      ...options,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.detail || error.error || `HTTP ${response.status}`)
    }

    return await response.json()
  }
}

// Esporta istanza singleton
export default new ApiClient()

