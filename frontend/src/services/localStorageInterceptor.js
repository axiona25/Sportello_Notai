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
  
  if (key === 'notary_profiles') {
    
    try {
      const data = JSON.parse(value)
      const notarioUno = data['notaio-1']
      if (notarioUno) {
      }
    } catch (e) {
    }
  }
  
  return originalSetItem(key, value)
}

// Sovrascrivi removeItem per loggare rimozioni
localStorage.removeItem = function(key) {
  if (key === 'notary_profiles') {
  }
  return originalRemoveItem(key)
}

// Sovrascrivi clear per loggare cancellazioni complete
localStorage.clear = function() {
  return originalClear()
}


