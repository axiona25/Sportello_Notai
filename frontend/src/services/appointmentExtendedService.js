/**
 * Extended Appointment Service
 * Gestisce le API per documenti, notifiche e gestione appuntamenti
 */
import apiClient from './apiClient'

const appointmentExtendedService = {
  // ============================================
  // GESTIONE APPUNTAMENTI (Conferma/Rifiuta)
  // ============================================
  
  async confermaAppuntamento(appuntamentoId, data = {}) {
    try {
      const response = await apiClient.post(
        `/appointments/gestione-appuntamenti/${appuntamentoId}/conferma/`,
        data
      )
      return response.data
    } catch (error) {
      console.error('Errore conferma appuntamento:', error)
      throw error
    }
  },

  async rifiutaAppuntamento(appuntamentoId, motivo) {
    try {
      const response = await apiClient.post(
        `/appointments/gestione-appuntamenti/${appuntamentoId}/rifiuta/`,
        { motivo }
      )
      return response.data
    } catch (error) {
      console.error('Errore rifiuto appuntamento:', error)
      throw error
    }
  },

  // ============================================
  // DOCUMENTI APPUNTAMENTO
  // ============================================
  
  async getDocumentiAppuntamento(appuntamentoId) {
    try {
      const response = await apiClient.get(
        `/appointments/documenti-appuntamento/appuntamento/${appuntamentoId}/`
      )
      return response.data
    } catch (error) {
      console.error('Errore caricamento documenti appuntamento:', error)
      throw error
    }
  },

  async uploadDocumento(documentoId, file) {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await apiClient.post(
        `/appointments/documenti-appuntamento/${documentoId}/upload/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      return response.data
    } catch (error) {
      console.error('Errore upload documento:', error)
      throw error
    }
  },

  async verificaDocumento(documentoId, azione, noteRifiuto = '', noteInterne = '') {
    try {
      const response = await apiClient.post(
        `/appointments/documenti-appuntamento/${documentoId}/verifica/`,
        {
          azione,
          note_rifiuto: noteRifiuto,
          note_interne: noteInterne
        }
      )
      return response.data
    } catch (error) {
      console.error('Errore verifica documento:', error)
      throw error
    }
  },

  // ============================================
  // DOCUMENTI RICHIESTI PER TIPOLOGIA ATTO
  // ============================================
  
  async getDocumentiRichiestiPerTipologia(tipologiaId) {
    try {
      const response = await apiClient.get(
        `/appointments/documenti-richiesti/tipologia/${tipologiaId}/`
      )
      return response.data
    } catch (error) {
      console.error('Errore caricamento documenti richiesti:', error)
      throw error
    }
  },

  // ============================================
  // TIPOLOGIE ATTO
  // ============================================
  
  async getTipologieAtto() {
    try {
      const response = await apiClient.get('/acts/categories/')
      // Gestisci vari formati di risposta
      return response.data || response.results || response || []
    } catch (error) {
      console.error('Errore caricamento tipologie atto:', error)
      return [] // Ritorna array vuoto invece di throw per permettere il fallback
    }
  },

  // ============================================
  // NOTIFICHE
  // ============================================
  
  async getNotifiche() {
    try {
      const response = await apiClient.get('/appointments/notifiche/')
      // Gestisci vari formati di risposta
      return response.data || response.results || response || []
    } catch (error) {
      console.error('Errore caricamento notifiche:', error)
      return [] // Ritorna array vuoto invece di throw
    }
  },

  async getNotificheNonLette() {
    try {
      const response = await apiClient.get('/appointments/notifiche/non_lette/')
      return response.data || response.results || response || []
    } catch (error) {
      console.error('Errore caricamento notifiche non lette:', error)
      return []
    }
  },

  async segnaNotificaLetta(notificaId) {
    try {
      const response = await apiClient.post(
        `/appointments/notifiche/${notificaId}/segna-letta/`
      )
      return response.data
    } catch (error) {
      console.error('Errore segna notifica letta:', error)
      throw error
    }
  },

  async segnaTutteNotificheLette() {
    try {
      const response = await apiClient.post(
        '/appointments/notifiche/segna-tutte-lette/'
      )
      return response.data
    } catch (error) {
      console.error('Errore segna tutte notifiche lette:', error)
      throw error
    }
  }
}

export default appointmentExtendedService

