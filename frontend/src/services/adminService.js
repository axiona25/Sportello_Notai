/**
 * Admin Service
 * 
 * Gestisce tutte le chiamate API per la Dashboard Admin:
 * - Gestione Notai (lista, dettaglio, creazione, aggiornamento, eliminazione)
 * - Gestione Licenze Notai
 * - Gestione Partners
 * - Statistiche generali
 */

import apiClient from './apiClient'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api'

class AdminService {
  // ========================================
  // NOTAI - CRUD
  // ========================================

  /**
   * Recupera la lista di tutti i notai con filtri
   * @param {Object} filters - Filtri opzionali
   * @param {string} filters.search - Ricerca per nome, email, città
   * @param {string} filters.license_status - Filtra per stato licenza (active, expired, expiring_soon, disabled)
   * @param {boolean} filters.license_active - Filtra per licenza attiva/disattivata
   * @param {string} filters.address_city - Filtra per città
   * @param {string} filters.ordering - Campo per ordinamento
   * @returns {Promise<Object>} Lista notai
   */
  async getNotaries(filters = {}) {
    try {
      const params = new URLSearchParams()
      
      if (filters.search) params.append('search', filters.search)
      if (filters.license_status) params.append('license_status', filters.license_status)
      if (filters.license_active !== undefined) params.append('license_active', filters.license_active)
      if (filters.address_city) params.append('address_city', filters.address_city)
      if (filters.ordering) params.append('ordering', filters.ordering)
      
      const data = await apiClient.get(`/notaries/admin/notaries/?${params.toString()}`)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Errore nel recuperare i notai:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Recupera il dettaglio completo di un notaio
   * @param {string} notaryId - ID del notaio
   * @returns {Promise<Object>} Dettaglio notaio
   */
  async getNotaryDetail(notaryId) {
    try {
      const data = await apiClient.get(`/notaries/admin/notaries/${notaryId}/`)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Errore nel recuperare il dettaglio del notaio:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Crea un nuovo notaio
   * @param {Object} notaryData - Dati del notaio
   * @returns {Promise<Object>} Notaio creato
   */
  async createNotary(notaryData) {
    try {
      const data = await apiClient.post('/notaries/admin/notaries/', notaryData)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Errore nella creazione del notaio:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Aggiorna i dati di un notaio
   * @param {string} notaryId - ID del notaio
   * @param {Object} notaryData - Dati da aggiornare
   * @returns {Promise<Object>} Notaio aggiornato
   */
  async updateNotary(notaryId, notaryData) {
    try {
      const data = await apiClient.patch(`/notaries/admin/notaries/${notaryId}/`, notaryData)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Errore nell\'aggiornamento del notaio:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Elimina (disabilita) un notaio
   * @param {string} notaryId - ID del notaio
   * @returns {Promise<Object>} Risultato dell'operazione
   */
  async deleteNotary(notaryId) {
    try {
      const data = await apiClient.delete(`/notaries/admin/notaries/${notaryId}/`)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Errore nell\'eliminazione del notaio:', error)
      return { success: false, error: error.message }
    }
  }

  // ========================================
  // LICENZE NOTAI
  // ========================================

  /**
   * Aggiorna SOLO i dati di licenza di un notaio
   * @param {string} notaryId - ID del notaio
   * @param {Object} licenseData - Dati licenza
   * @param {boolean} licenseData.license_active - Licenza attiva/disattivata
   * @param {string} licenseData.license_start_date - Data inizio (YYYY-MM-DD)
   * @param {string} licenseData.license_expiry_date - Data scadenza (YYYY-MM-DD)
   * @param {number} licenseData.license_payment_amount - Importo canone
   * @param {string} licenseData.license_payment_frequency - Frequenza: 'monthly' o 'annual'
   * @param {string} licenseData.license_notes - Note amministrative
   * @returns {Promise<Object>} Dati licenza aggiornati
   */
  async updateNotaryLicense(notaryId, licenseData) {
    try {
      console.log('📝 Aggiornamento licenza notaio:', notaryId, licenseData)
      const data = await apiClient.patch(`/notaries/admin/notaries/${notaryId}/license/`, licenseData)
      console.log('✅ Licenza aggiornata:', data)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Errore nell\'aggiornamento della licenza:', error)
      return { success: false, error: error.message }
    }
  }

  // ========================================
  // PARTNERS - CRUD
  // ========================================

  /**
   * Recupera la lista di tutti i partners con filtri
   * @param {Object} filters - Filtri opzionali
   * @param {string} filters.search - Ricerca per ragione sociale, P.IVA, CF, referente
   * @param {string} filters.tipologia - Filtra per tipologia
   * @param {string} filters.citta - Filtra per città
   * @param {boolean} filters.is_active - Filtra per attivo/disattivo
   * @param {boolean} filters.is_verified - Filtra per verificato/non verificato
   * @returns {Promise<Object>} Lista partners
   */
  async getPartners(filters = {}) {
    try {
      const params = new URLSearchParams()
      
      if (filters.search) params.append('search', filters.search)
      if (filters.tipologia) params.append('tipologia', filters.tipologia)
      if (filters.citta) params.append('citta', filters.citta)
      if (filters.is_active !== undefined) params.append('is_active', filters.is_active)
      if (filters.is_verified !== undefined) params.append('is_verified', filters.is_verified)
      
      const data = await apiClient.get(`/accounts/partners/?${params.toString()}`)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Errore nel recuperare i partners:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Recupera il dettaglio di un partner
   * @param {string} partnerId - ID del partner
   * @returns {Promise<Object>} Dettaglio partner
   */
  async getPartnerDetail(partnerId) {
    try {
      const data = await apiClient.get(`/accounts/partners/${partnerId}/`)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Errore nel recuperare il dettaglio del partner:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Crea un nuovo partner
   * @param {Object} partnerData - Dati del partner
   * @returns {Promise<Object>} Partner creato
   */
  async createPartner(partnerData) {
    try {
      const data = await apiClient.post('/accounts/partners/', partnerData)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Errore nella creazione del partner:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Aggiorna i dati di un partner
   * @param {string} partnerId - ID del partner
   * @param {Object} partnerData - Dati da aggiornare
   * @returns {Promise<Object>} Partner aggiornato
   */
  async updatePartner(partnerId, partnerData) {
    try {
      const data = await apiClient.patch(`/accounts/partners/${partnerId}/`, partnerData)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Errore nell\'aggiornamento del partner:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Elimina un partner
   * @param {string} partnerId - ID del partner
   * @returns {Promise<Object>} Risultato dell'operazione
   */
  async deletePartner(partnerId) {
    try {
      const data = await apiClient.delete(`/accounts/partners/${partnerId}/`)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Errore nell\'eliminazione del partner:', error)
      return { success: false, error: error.message }
    }
  }

  // ========================================
  // STATISTICHE
  // ========================================

  /**
   * Recupera le statistiche generali per la dashboard admin
   * @returns {Promise<Object>} Statistiche (notai, licenze, appuntamenti, revenue)
   */
  async getStats() {
    try {
      const data = await apiClient.get('/notaries/admin/stats/')
      return { success: true, data }
    } catch (error) {
      console.error('❌ Errore nel recuperare le statistiche:', error)
      return { success: false, error: error.message }
    }
  }
}

export default new AdminService()

