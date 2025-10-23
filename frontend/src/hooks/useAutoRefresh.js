import { useEffect, useRef, useCallback } from 'react'

/**
 * Hook per aggiornamento automatico intelligente dei dati
 * - Polling con intervallo configurabile
 * - Si ferma quando il tab non è visibile (risparmio risorse)
 * - Aggiorna immediatamente al ritorno del focus
 * 
 * @param {Function} refreshCallback - Funzione da chiamare per l'aggiornamento
 * @param {number} interval - Intervallo in millisecondi (default: 30000 = 30 secondi)
 * @param {boolean} enabled - Abilita/disabilita il polling (default: true)
 */
export function useAutoRefresh(refreshCallback, interval = 30000, enabled = true) {
  const intervalRef = useRef(null)
  const isVisibleRef = useRef(true)

  const startPolling = useCallback(() => {
    // Pulisci eventuali intervalli precedenti
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Avvia nuovo intervallo solo se abilitato e visibile
    if (enabled && isVisibleRef.current) {
      intervalRef.current = setInterval(() => {
        if (isVisibleRef.current) {
          refreshCallback()
        }
      }, interval)
    }
  }, [refreshCallback, interval, enabled])

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Gestione visibilità della pagina
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden

      if (!document.hidden) {
        // Pagina tornata visibile: aggiorna immediatamente e riavvia polling
        console.log('🔄 Tab attivo: aggiornamento dati...')
        refreshCallback()
        startPolling()
      } else {
        // Pagina nascosta: ferma polling per risparmiare risorse
        console.log('⏸️  Tab inattivo: polling in pausa')
        stopPolling()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refreshCallback, startPolling, stopPolling])

  // Avvia/ferma polling quando cambia lo stato enabled
  useEffect(() => {
    if (enabled) {
      startPolling()
    } else {
      stopPolling()
    }

    // Cleanup al unmount
    return () => {
      stopPolling()
    }
  }, [enabled, startPolling, stopPolling])

  // Ritorna funzione per forzare refresh manuale
  return {
    forceRefresh: refreshCallback,
    isPolling: enabled && isVisibleRef.current
  }
}

