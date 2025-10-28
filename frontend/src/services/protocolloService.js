/**
 * Service per gestire i Protocolli Atti Notarili
 */
import apiClient from './apiClient'

const protocolloService = {
  /**
   * Ottieni tutti i protocolli (con filtri opzionali)
   */
  async getProtocolli(filters = {}) {
    const params = new URLSearchParams()
    if (filters.stato) params.append('stato', filters.stato)
    if (filters.tipologia) params.append('tipologia', filters.tipologia)
    if (filters.anno) params.append('anno', filters.anno)
    
    const queryString = params.toString()
    const url = `/acts/protocolli/${queryString ? `?${queryString}` : ''}`
    
    return await apiClient.get(url)
  },

  /**
   * Ottieni dettaglio di un protocollo
   */
  async getProtocollo(id) {
    return await apiClient.get(`/acts/protocolli/${id}/`)
  },

  /**
   * Ottieni il protocollo per un appuntamento specifico
   */
  async getProtocolloByAppuntamento(appuntamentoId) {
    try {
      const response = await apiClient.get(`/acts/protocolli/by_appuntamento/?appuntamento_id=${appuntamentoId}`)
      return { success: true, data: response, notFound: false }
    } catch (error) {
      if (error.response?.status === 404) {
        return { success: false, data: null, notFound: true }
      }
      throw error
    }
  },

  /**
   * Crea un nuovo protocollo da un appuntamento
   */
  async creaProtocollo(appuntamentoId, note = '', metadata = {}) {
    return await apiClient.post('/acts/protocolli/', {
      appuntamento_id: appuntamentoId,
      note,
      metadata
    })
  },

  /**
   * Registra la firma di un atto
   */
  async firmaAtto(protocolloId, documentoFirmato = null) {
    const formData = new FormData()
    if (documentoFirmato) {
      formData.append('documento_firmato', documentoFirmato)
    }
    
    return await apiClient.post(`/acts/protocolli/${protocolloId}/firma/`, formData)
  },

  /**
   * Protocolla definitivamente un atto
   */
  async protocollaAtto(protocolloId) {
    return await apiClient.post(`/acts/protocolli/${protocolloId}/protocolla/`, {})
  },

  /**
   * Annulla un atto
   */
  async annullaAtto(protocolloId, motivo) {
    return await apiClient.post(`/acts/protocolli/${protocolloId}/annulla/`, { motivo })
  },

  /**
   * Ottieni statistiche sui protocolli
   */
  async getStatistiche(anno = null) {
    const url = anno 
      ? `/acts/protocolli/statistiche/?anno=${anno}`
      : '/acts/protocolli/statistiche/'
    
    return await apiClient.get(url)
  },

  /**
   * Ottieni o crea il protocollo per un appuntamento
   * (utility che combina get + create)
   */
  async getOrCreateProtocollo(appuntamentoId) {
    try {
      // Prima prova a recuperarlo
      const result = await this.getProtocolloByAppuntamento(appuntamentoId)
      
      if (result.success && result.data) {
        console.log('✅ Protocollo esistente trovato:', result.data.numero_protocollo)
        return { success: true, data: result.data, created: false }
      }
      
      // Se non esiste (404), crealo
      if (result.notFound) {
        console.log('📝 Creazione nuovo protocollo per appuntamento:', appuntamentoId)
        const newProtocollo = await this.creaProtocollo(appuntamentoId)
        console.log('✅ Protocollo creato:', newProtocollo.numero_protocollo)
        return { success: true, data: newProtocollo, created: true }
      }
      
      return result
    } catch (error) {
      console.error('❌ Errore get/create protocollo:', error)
      return { success: false, error: error.message || 'Errore sconosciuto' }
    }
  }
}

export default protocolloService

