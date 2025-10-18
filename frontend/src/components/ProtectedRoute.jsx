/**
 * ProtectedRoute Component
 * Protegge le route richiedendo autenticazione e ruoli specifici
 */

import React from 'react'
import { useAuth } from '../hooks/useAuth.jsx'

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuth()

  // Se non autenticato, non renderizza nulla (App.jsx gestisce il redirect)
  if (!isAuthenticated) {
    return null
  }

  // Se ruoli specificati, verifica che l'utente abbia il ruolo corretto
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Utente non autorizzato per questa route
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#F8F9FA',
        fontFamily: 'Poppins, sans-serif',
        textAlign: 'center',
        padding: '20px'
      }}>
        <h1 style={{ fontSize: '48px', color: '#DC2626', marginBottom: '20px' }}>
          ⛔ Accesso Negato
        </h1>
        <p style={{ fontSize: '18px', color: '#6B7280', marginBottom: '30px' }}>
          Non hai i permessi necessari per accedere a questa pagina.
        </p>
        <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
          Ruolo richiesto: <strong>{allowedRoles.join(', ')}</strong><br />
          Tuo ruolo: <strong>{user?.role}</strong>
        </p>
      </div>
    )
  }

  // Utente autenticato e autorizzato, mostra contenuto
  return children
}

export default ProtectedRoute

