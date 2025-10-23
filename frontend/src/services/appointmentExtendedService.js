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
      return { success: true, data: response }
    } catch (error) {
      console.error('Errore conferma appuntamento:', error)
      return { success: false, error: error.message }
    }
  },

  async rifiutaAppuntamento(appuntamentoId, motivo) {
    try {
      const response = await apiClient.post(
        `/appointments/gestione-appuntamenti/${appuntamentoId}/rifiuta/`,
        { motivo }
      )
      return response
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
      return response || []
    } catch (error) {
      console.error('Errore caricamento documenti appuntamento:', error)
      return []
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
      return response
    } catch (error) {
      console.error('Errore upload documento:', error)
      throw error
    }
  },

  async uploadDocumentoPerNome(appuntamentoId, nomeDocumento, file) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('nome_documento', nomeDocumento)

      // ✅ NON impostare Content-Type manualmente con FormData!
      // Il browser lo imposterà automaticamente con il boundary corretto
      const response = await apiClient.post(
        `/appointments/documenti-appuntamento/appuntamento/${appuntamentoId}/upload-per-nome/`,
        formData
      )
      return response
    } catch (error) {
      console.error('Errore upload documento per nome:', error)
      throw error
    }
  },

  async rinominaDocumento(documentoId, nuovoNome) {
    try {
      const response = await apiClient.patch(
        `/appointments/documenti-appuntamento/${documentoId}/`,
        { nome_file: nuovoNome }
      )
      return response
    } catch (error) {
      console.error('Errore rinomina documento:', error)
      throw error
    }
  },

  async eliminaDocumento(documentoId) {
    try {
      const response = await apiClient.delete(
        `/appointments/documenti-appuntamento/${documentoId}/`
      )
      return { success: true, data: response }
    } catch (error) {
      console.error('Errore eliminazione documento:', error)
      return { success: false, error: error.message }
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
      return response
    } catch (error) {
      console.error('Errore verifica documento:', error)
      throw error
    }
  },

  async inviaDocumentiPerVerifica(appuntamentoId) {
    try {
      const response = await apiClient.post(
        `/appointments/documenti-appuntamento/appuntamento/${appuntamentoId}/invia-per-verifica/`
      )
      return response
    } catch (error) {
      console.error('Errore invio documenti per verifica:', error)
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
      return response || []
    } catch (error) {
      console.error('Errore caricamento documenti richiesti:', error)
      return []
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
      return response
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
      return response
    } catch (error) {
      console.error('Errore segna tutte notifiche lette:', error)
      throw error
    }
  },

  // ============================================
  // APPUNTAMENTI AGENDA
  // ============================================
  
  async getAppuntamentiMese(anno, mese, notaryId = null) {
    try {
      let url = `/appointments/appuntamenti/?anno=${anno}&mese=${mese}`
      if (notaryId) {
        url += `&notary=${notaryId}`
      }
      const response = await apiClient.get(url)
      return response.data || response.results || response || []
    } catch (error) {
      console.error('Errore caricamento appuntamenti mese:', error)
      return []
    }
  },

  async getAppuntamentiGiorno(data, notaryId = null) {
    try {
      let url = `/appointments/appuntamenti/?data=${data}`
      if (notaryId) {
        url += `&notary=${notaryId}`
      }
      const response = await apiClient.get(url)
      return response.data || response.results || response || []
    } catch (error) {
      console.error('Errore caricamento appuntamenti giorno:', error)
      return []
    }
  },

  async getAppuntamentoDettaglio(appuntamentoId) {
    try {
      const data = await apiClient.get(`/appointments/appuntamenti/${appuntamentoId}/`)
      return data
    } catch (error) {
      console.error('Errore caricamento dettaglio appuntamento:', error)
      throw error
    }
  },

  // ============================================
  // MODIFICA/ANNULLA/ELIMINA APPUNTAMENTO
  // ============================================
  
  async aggiornaAppuntamento(appuntamentoId, dati) {
    try {
      const response = await apiClient.patch(
        `/appointments/appuntamenti/${appuntamentoId}/`,
        dati
      )
      return response
    } catch (error) {
      console.error('Errore aggiornamento appuntamento:', error)
      throw error
    }
  },

  async annullaAppuntamento(appuntamentoId, motivo) {
    try {
      const response = await apiClient.post(
        `/appointments/appuntamenti/${appuntamentoId}/annulla/`,
        { motivo }
      )
      return response
    } catch (error) {
      console.error('Errore annullamento appuntamento:', error)
      throw error
    }
  },

  async eliminaAppuntamento(appuntamentoId) {
    try {
      const response = await apiClient.delete(
        `/appointments/appuntamenti/${appuntamentoId}/`
      )
      // ✅ Restituisci sempre un oggetto con success: true
      return { success: true, data: response }
    } catch (error) {
      console.error('Errore eliminazione appuntamento:', error)
      return { success: false, error: error.message }
    }
  }
}

export default appointmentExtendedService

