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
      console.log('💾 Salvando dati generali sul backend...')
      
      const payload = {
        studio_name: generalData.studioName,
        phone: generalData.telefono,
        pec_address: generalData.email,
        website: generalData.sitoWeb,
        address_street: generalData.address,
        // Altri campi se necessario
      }
      
      console.log('📦 Payload Generali:', JSON.stringify(payload, null, 2))
      
      const data = await apiClient.put('/notaries/me/', payload)
      
      console.log('✅ Dati generali salvati con successo')
      console.log('📊 Risposta dal backend:', JSON.stringify(data, null, 2))
      
      // Invalida cache per forzare refresh
      this.clearCache()
      
      return { success: true, data }
    } catch (error) {
      console.error('❌ Errore nel salvare i dati generali:', error.message)
      return { success: false, error: error.message }
    }
  }

  /**
   * Salva il profilo vetrina del notaio autenticato
   */
  async saveProfile(profileData) {
    try {
      console.log('💾 Salvando profilo vetrina sul backend...')
      console.log('📝 Servizi da salvare:', JSON.stringify(profileData.services, null, 2))
      console.log('📸 Foto da inviare:', profileData.photo ? `${profileData.photo.substring(0, 50)}... (length: ${profileData.photo.length})` : 'NESSUNA FOTO')
      
      const payload = {
        photo: profileData.photo,
        experience: profileData.experience,
        languages: profileData.languages,
        description: profileData.description,
        services: profileData.services,
        availability: profileData.availability
      }
      
      console.log('📦 Payload (senza foto per brevità):', JSON.stringify({...payload, photo: payload.photo ? `[BASE64 length: ${payload.photo.length}]` : null}, null, 2))
      
      // Invia solo i campi scrivibili (no name, title, address - sono read-only)
      const data = await apiClient.put('/notaries/showcase/me/', payload)
      
      console.log('✅ Profilo salvato con successo sul backend')
      console.log('📸 Foto nella risposta:', data?.photo ? `${data.photo.substring(0, 50)}... (length: ${data.photo.length})` : 'NESSUNA FOTO')
      console.log('📊 Risposta dal backend (senza foto):', JSON.stringify({...data, photo: data?.photo ? `[BASE64 length: ${data.photo.length}]` : null}, null, 2))
      console.log('🗑️ Invalidando cache locale...')
      
      // Invalida cache per forzare refresh immediato
      this.clearCache()
      
      return { success: true, data }
    } catch (error) {
      console.error('❌ Errore nel salvare il profilo:', error.message)
      console.error('📊 Dettagli errore:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Ottieni i dati generali del notaio autenticato
   */
  async getGeneralData() {
    try {
      console.log('📥 Caricando dati generali dal backend...')
      
      const data = await apiClient.get('/notaries/me/')
      
      console.log('✅ Dati generali caricati:', data)
      return data
    } catch (error) {
      console.error('❌ Errore nel caricare i dati generali:', error.message)
      return null
    }
  }

  /**
   * Ottieni il profilo vetrina del notaio autenticato
   */
  async getMyProfile() {
    try {
      console.log('📥 Caricando profilo vetrina dal backend...')
      
      const data = await apiClient.get('/notaries/showcase/me/')
      
      console.log('✅ Profilo caricato:', data)
      return data
    } catch (error) {
      console.error('❌ Errore nel caricare il profilo:', error.message)
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
          console.log('📦 Usando cache profili (fresh)')
          return this.cache
        }
      }

      console.log('🌐 Caricando profili vetrina dal backend...')
      
      const response = await apiClient.get('/notaries/showcases/')
      
      // Django REST Framework restituisce un oggetto paginato: { count, next, previous, results }
      const profiles = response.results || []
      
      console.log(`✅ ${profiles.length} profili caricati dal backend`)
      
      // Aggiorna cache
      this.cache = profiles
      this.cacheTimestamp = Date.now()
      
      return profiles
    } catch (error) {
      console.error('❌ Errore nel caricare i profili:', error.message)
      
      // Fallback: ritorna cache se disponibile, altrimenti array vuoto
      if (this.cache) {
        console.log('⚠️ Usando cache obsoleta come fallback')
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
    console.log('🗑️ Cache profili cancellata')
    this.cache = null
    this.cacheTimestamp = null
  }

  /**
   * Polling per aggiornamenti real-time (usato nel dashboard cliente)
   */
  startPolling(callback, intervalMs = 10000) {
    console.log(`🔄 Avviato polling ogni ${intervalMs}ms`)
    
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
      console.log('⏹️ Polling fermato')
      clearInterval(intervalId)
    }
  }
}

// Esporta istanza singleton
export default new NotaryProfileService()
