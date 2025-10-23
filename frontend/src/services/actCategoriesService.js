import apiClient from './apiClient'

const actCategoriesService = {
  // ============================================
  // NOTARIAL ACT CATEGORIES (Admin)
  // ============================================
  
  async getAll() {
    try {
      const response = await apiClient.get('/acts/categories/')
      return response.data || response.results || response || []
    } catch (error) {
      console.error('Errore caricamento categorie atto:', error)
      return []
    }
  },

  async getById(id) {
    try {
      const response = await apiClient.get(`/acts/categories/${id}/`)
      return response.data
    } catch (error) {
      console.error('Errore caricamento categoria atto:', error)
      throw error
    }
  },

  async create(data) {
    try {
      const response = await apiClient.post('/acts/categories/', data)
      return response.data
    } catch (error) {
      console.error('Errore creazione categoria atto:', error)
      throw error
    }
  },

  async update(id, data) {
    try {
      const response = await apiClient.put(`/acts/categories/${id}/`, data)
      return response.data
    } catch (error) {
      console.error('Errore aggiornamento categoria atto:', error)
      throw error
    }
  },

  async delete(id) {
    try {
      await apiClient.delete(`/acts/categories/${id}/`)
      return { success: true }
    } catch (error) {
      console.error('Errore eliminazione categoria atto:', error)
      throw error
    }
  },

  // ============================================
  // DOCUMENTI RICHIESTI
  // ============================================
  
  async addDocument(categoryId, documentData) {
    try {
      const response = await apiClient.post(
        `/acts/categories/${categoryId}/add_document/`,
        documentData
      )
      return response.data
    } catch (error) {
      console.error('Errore aggiunta documento:', error)
      throw error
    }
  },

  async removeDocument(categoryId, documentLinkId) {
    try {
      await apiClient.delete(
        `/acts/categories/${categoryId}/remove_document/${documentLinkId}/`
      )
      return { success: true }
    } catch (error) {
      console.error('Errore rimozione documento:', error)
      throw error
    }
  },

  // ============================================
  // DOCUMENT TYPES
  // ============================================
  
  async getAllDocumentTypes() {
    try {
      const response = await apiClient.get('/acts/document-types/')
      return response.data || response.results || response || []
    } catch (error) {
      console.error('Errore caricamento tipi documento:', error)
      return []
    }
  },

  async createDocumentType(data) {
    try {
      const response = await apiClient.post('/acts/document-types/', data)
      return response.data
    } catch (error) {
      console.error('Errore creazione tipo documento:', error)
      throw error
    }
  },

  async updateDocumentType(id, data) {
    try {
      const response = await apiClient.put(`/acts/document-types/${id}/`, data)
      return response.data
    } catch (error) {
      console.error('Errore aggiornamento tipo documento:', error)
      throw error
    }
  },

  async deleteDocumentType(id) {
    try {
      await apiClient.delete(`/acts/document-types/${id}/`)
      return { success: true }
    } catch (error) {
      console.error('Errore eliminazione tipo documento:', error)
      throw error
    }
  }
}

export default actCategoriesService

