/**
 * Service per la gestione dei template degli atti notarili
 */
import apiClient from './apiClient'

const templateService = {
  /**
   * Ottieni tutti i template
   */
  async getTemplates(activeOnly = true) {
    try {
      const params = activeOnly ? { active_only: 'true' } : {}
      const response = await apiClient.get('/acts/templates/', { params })
      return {
        success: true,
        data: response  // response è già l'oggetto dati!
      }
    } catch (error) {
      console.error('Errore nel caricamento template:', error)
      return {
        success: false,
        error: error.response?.data?.detail || 'Errore nel caricamento dei template'
      }
    }
  },

  /**
   * Ottieni template per una specifica tipologia di atto
   */
  async getTemplateByActType(actTypeCode) {
    try {
      const response = await apiClient.get(`/acts/templates/by_act_type/${actTypeCode}/`)
      // apiClient restituisce già i dati JSON direttamente, non response.data
      return {
        success: true,
        data: response  // response è già l'oggetto dati!
      }
    } catch (error) {
      if (error.response?.status === 404) {
        // 404 è normale quando non c'è template per quell'atto - non logghiamo
        return {
          success: false,
          notFound: true,
          error: 'Template non trovato'
        }
      }
      // Logga solo errori diversi da 404
      console.error('Errore nel caricamento template:', error)
      return {
        success: false,
        error: error.response?.data?.detail || 'Errore nel caricamento del template'
      }
    }
  },

  /**
   * Carica un nuovo template
   */
  async uploadTemplate(data) {
    try {
      const formData = new FormData()
      formData.append('act_type_code', data.actTypeCode)
      formData.append('act_type_name', data.actTypeName)
      
      if (data.codePrefix) {
        formData.append('code_prefix', data.codePrefix)
      }
      
      formData.append('template_file', data.file)
      
      if (data.description) {
        formData.append('description', data.description)
      }
      
      if (data.usageNotes) {
        formData.append('usage_notes', data.usageNotes)
      }
      
      if (data.version) {
        formData.append('version', data.version)
      }

      // NON impostare Content-Type manualmente per FormData!
      // Il browser lo imposta automaticamente con il boundary corretto
      const response = await apiClient.post('/acts/templates/', formData)

      return {
        success: true,
        data: response  // response è già l'oggetto dati!
      }
    } catch (error) {
      console.error('Errore upload template:', error)
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.template_file?.[0] || 'Errore durante l\'upload del template'
      }
    }
  },

  /**
   * Scarica un template
   */
  async downloadTemplate(templateId) {
    try {
      const response = await apiClient.get(`/acts/templates/${templateId}/download/`, {
        responseType: 'blob'
      })

      // Ottieni il nome del file dall'header
      const contentDisposition = response.headers['content-disposition']
      let filename = 'template.docx'
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1]
        }
      }

      // Crea un link per il download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      return {
        success: true
      }
    } catch (error) {
      console.error('Errore download template:', error)
      return {
        success: false,
        error: 'Errore durante il download del template'
      }
    }
  },

  /**
   * Aggiorna un template esistente
   */
  async updateTemplate(templateId, data) {
    try {
      const response = await apiClient.patch(`/acts/templates/${templateId}/`, data)
      return {
        success: true,
        data: response  // response è già l'oggetto dati!
      }
    } catch (error) {
      console.error('Errore aggiornamento template:', error)
      return {
        success: false,
        error: error.response?.data?.detail || 'Errore durante l\'aggiornamento del template'
      }
    }
  },

  /**
   * Disattiva un template
   */
  async deleteTemplate(templateId) {
    try {
      const response = await apiClient.delete(`/acts/templates/${templateId}/`)
      return {
        success: true,
        data: response  // response è già l'oggetto dati!
      }
    } catch (error) {
      console.error('Errore eliminazione template:', error)
      return {
        success: false,
        error: error.response?.data?.detail || 'Errore durante l\'eliminazione del template'
      }
    }
  },

  /**
   * Genera un nuovo codice atto
   */
  async generateActCode(actTypeCode) {
    try {
      const response = await apiClient.post('/acts/templates/generate_code/', {
        act_type_code: actTypeCode
      })
      return {
        success: true,
        data: response  // response è già l'oggetto dati!
      }
    } catch (error) {
      console.error('Errore generazione codice:', error)
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.act_type_code?.[0] || 'Errore durante la generazione del codice'
      }
    }
  },

  /**
   * Ottieni statistiche sui template
   */
  async getStatistics() {
    try {
      const response = await apiClient.get('/acts/templates/statistics/')
      return {
        success: true,
        data: response  // response è già l'oggetto dati!
      }
    } catch (error) {
      console.error('Errore caricamento statistiche:', error)
      return {
        success: false,
        error: 'Errore nel caricamento delle statistiche'
      }
    }
  }
}

export default templateService

