// IMPORTANTE: Importa l'intercettore PRIMA di tutto per tracciare ogni scrittura su localStorage
import './services/localStorageInterceptor'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// TEMPORANEO: Disabilito StrictMode per debug localStorage
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

