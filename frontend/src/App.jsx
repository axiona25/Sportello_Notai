import React, { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import Login from './components/Login'
import ForgotPassword from './components/ForgotPassword'
import Dashboard from './components/Dashboard'
import DashboardNotaio from './components/DashboardNotaio'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

function AppContent() {
  const [currentView, setCurrentView] = useState('forgot-password') // 'forgot-password' per gestire forgot password
  const { isAuthenticated, user, login, logout, loading } = useAuth()

  const handleLogin = async (credentials) => {
    console.log('Login attempt:', credentials)
    
    try {
      const data = await login(credentials.email, credentials.password)
      
      // Se MFA richiesto, gestisci separatamente
      if (data.mfa_required) {
        console.log('MFA required')
        return { 
          success: false, 
          mfa_required: true,
          user_id: data.user_id,
          message: data.message 
        }
      }

      // Login successful - non serve più setCurrentView, isAuthenticated gestisce tutto
      console.log('Login successful! Role:', data.user.role)
      return { success: true }
    } catch (error) {
      console.error('Login failed:', error)
      return { 
        success: false, 
        error: error.message || 'Email o password non corrette.' 
      }
    }
  }

  const handleForgotPassword = () => {
    setCurrentView('forgot-password')
  }

  const handleBackToLogin = () => {
    setCurrentView('login')
  }

  const handlePasswordResetSubmit = (data) => {
    console.log('Password reset request:', data)
    // Qui andrà la logica per inviare email di reset
  }

  const handleLogout = async () => {
    console.log('Logout...')
    await logout()
    // Non serve più setCurrentView, ProtectedRoute gestisce redirect
  }

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

  // Se autenticato, mostra la dashboard appropriata in base al ruolo
  // ProtectedRoute gestisce la protezione e redirect se non autenticato
  if (isAuthenticated) {
    return (
      <div className="app">
        <ProtectedRoute>
          {user?.role === 'notaio' ? (
            <DashboardNotaio onLogout={handleLogout} />
          ) : (
            <Dashboard onLogout={handleLogout} />
          )}
        </ProtectedRoute>
      </div>
    )
  }

  // Se sta recuperando la password
  if (currentView === 'forgot-password') {
    return (
      <ForgotPassword
        onBack={handleBackToLogin}
        onSubmit={handlePasswordResetSubmit}
      />
    )
  }

  // Non autenticato - mostra login
  return (
    <Login
      onLogin={handleLogin}
      onForgotPassword={handleForgotPassword}
    />
  )
}

// App principale con AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App

