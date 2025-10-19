/**
 * Intercettore globale per tracciare TUTTE le scritture su localStorage
 * Questo ci aiuterà a trovare CHI sta sovrascrivendo i dati dei notai
 */

// Salva i metodi originali
const originalSetItem = localStorage.setItem.bind(localStorage)
const originalRemoveItem = localStorage.removeItem.bind(localStorage)
const originalClear = localStorage.clear.bind(localStorage)

// Sovrascrivi setItem per loggare ogni scrittura
localStorage.setItem = function(key, value) {
  console.log(`🔵 localStorage.setItem chiamato per chiave: "${key}"`)
  
  if (key === 'notary_profiles') {
    console.log('🚨 ATTENZIONE: Scrittura su notary_profiles!')
    console.trace('📍 Stack trace della scrittura:')
    
    try {
      const data = JSON.parse(value)
      const notarioUno = data['notaio-1']
      if (notarioUno) {
        console.log('📊 Servizi notaio-1 che verranno scritti:', JSON.stringify(notarioUno.services, null, 2))
        console.log('🖼️ Foto notaio-1:', notarioUno.photo ? `Base64 (${notarioUno.photo.substring(0, 50)}...)` : 'null')
        console.log('📦 Numero totale profili:', Object.keys(data).length)
      }
    } catch (e) {
      console.error('❌ Errore nel parse del valore:', e)
    }
  }
  
  return originalSetItem(key, value)
}

// Sovrascrivi removeItem per loggare rimozioni
localStorage.removeItem = function(key) {
  console.log(`🔴 localStorage.removeItem chiamato per chiave: "${key}"`)
  if (key === 'notary_profiles') {
    console.log('🚨 ATTENZIONE: Rimozione di notary_profiles!')
    console.trace('📍 Stack trace della rimozione:')
  }
  return originalRemoveItem(key)
}

// Sovrascrivi clear per loggare cancellazioni complete
localStorage.clear = function() {
  console.log('🔥 localStorage.clear() chiamato - TUTTO verrà cancellato!')
  console.trace('📍 Stack trace della clear:')
  return originalClear()
}

console.log('✅ Intercettore localStorage attivato!')

