/**
 * Notary Profile Service
 * Gestisce i profili pubblici dei notai (vetrine) tramite API backend
 */

import apiClient from './apiClient'

class NotaryProfileService {
  constructor() {
    // Cache locale per performance (opzionale)
    this.cache = null
    this.cacheTimestamp = null
    this.CACHE_DURATION = 30000 // 30 secondi
  }

  /**
   * Salva i dati generali del notaio (tab Generali)
   */
  async saveGeneralData(generalData) {
    try {
      
      const payload = {
        studio_name: generalData.nomeCognome || '',
        phone: generalData.telefono,
        pec_address: generalData.email,
        website: generalData.sitoWeb,
        address_street: generalData.address,
        // Altri campi se necessario
      }
      
      
      const data = await apiClient.put('/notaries/me/', payload)
      
      
      // Invalida cache per forzare refresh
      this.clearCache()
      
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Salva il profilo vetrina del notaio autenticato
   */
  async saveProfile(profileData) {
    try {
      
      const payload = {
        photo: profileData.photo,
        experience: profileData.experience,
        languages: profileData.languages,
        description: profileData.description,
        services: profileData.services,
        availability: profileData.availability
      }
      
      
      // Invia solo i campi scrivibili (no name, title, address - sono read-only)
      const data = await apiClient.put('/notaries/showcase/me/', payload)
      
      
      // Invalida cache per forzare refresh immediato
      this.clearCache()
      
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Ottieni i dati generali del notaio autenticato
   */
  async getGeneralData() {
    try {
      
      const data = await apiClient.get('/notaries/me/')
      
      return data
    } catch (error) {
      return null
    }
  }

  /**
   * Ottieni il profilo vetrina del notaio autenticato
   */
  async getMyProfile() {
    try {
      
      const data = await apiClient.get('/notaries/showcase/me/')
      
      return data
    } catch (error) {
      return null
    }
  }

  /**
   * Ottieni tutti i profili vetrina pubblici (per dashboard cliente)
   */
  async getAllProfiles(useCache = true) {
    try {
      // Check cache
      if (useCache && this.cache && this.cacheTimestamp) {
        const now = Date.now()
        if (now - this.cacheTimestamp < this.CACHE_DURATION) {
          return this.cache
        }
      }

      
      const response = await apiClient.get('/notaries/showcases/')
      
      // Django REST Framework restituisce un oggetto paginato: { count, next, previous, results }
      const profiles = response.results || []
      
      
      // Aggiorna cache
      this.cache = profiles
      this.cacheTimestamp = Date.now()
      
      return profiles
    } catch (error) {
      
      // Fallback: ritorna cache se disponibile, altrimenti array vuoto
      if (this.cache) {
        return this.cache
      }
      
      return []
    }
  }

  /**
   * Ottieni solo i profili attivi (compatibilità con codice esistente)
   */
  async getActiveProfiles() {
    const profiles = await this.getAllProfiles()
    return profiles // Tutti i profili dal backend sono attivi
  }

  /**
   * Cancella la cache locale
   */
  clearCache() {
    this.cache = null
    this.cacheTimestamp = null
  }

  /**
   * Polling per aggiornamenti real-time (usato nel dashboard cliente)
   */
  startPolling(callback, intervalMs = 10000) {
    
    const poll = async () => {
      const profiles = await this.getAllProfiles(false) // Force refresh
      callback(profiles)
    }
    
    // Prima chiamata immediata
    poll()
    
    // Poi polling regolare
    const intervalId = setInterval(poll, intervalMs)
    
    // Ritorna funzione per fermare il polling
    return () => {
      clearInterval(intervalId)
    }
  }
}

// Esporta istanza singleton
export default new NotaryProfileService()
