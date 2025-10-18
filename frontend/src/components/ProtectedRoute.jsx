/**
 * ProtectedRoute Component
 * Protegge le route richiedendo autenticazione
 */

import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user, loading } = useAuth()

  // Mostra loading mentre controlla autenticazione
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#F8F9FA'
      }}>
        <div style={{
          fontFamily: 'Poppins, sans-serif',
          fontSize: '18px',
          color: '#6B7280'
        }}>
          Caricamento...
        </div>
      </div>
    )
  }

  // Se non autenticato, redirect a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Se ruoli specificati, verifica che l'utente abbia il ruolo corretto
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect alla dashboard appropriata per il ruolo
    return <Navigate to="/unauthorized" replace />
  }

  // Utente autenticato e autorizzato, mostra contenuto
  return children
}

export default ProtectedRoute

