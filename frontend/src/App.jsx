import React, { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import { ToastProvider } from './contexts/ToastContext'
import { AppointmentRoomProvider } from './contexts/AppointmentRoomContext'
import Login from './components/Login'
import ForgotPassword from './components/ForgotPassword'
import Dashboard from './components/Dashboard'
import DashboardNotaio from './components/DashboardNotaio'
import DashboardAdmin from './components/DashboardAdmin'
import ProtectedRoute from './components/ProtectedRoute'
import ToastContainer from './components/ToastContainer'
import AppointmentRoom from './components/AppointmentRoom'
import './App.css'

function AppContent() {
  const [currentView, setCurrentView] = useState('login') // 'login' o 'forgot-password'
  const { isAuthenticated, user, login, logout, loading } = useAuth()

  const handleLogin = async (credentials) => {
    
    try {
      const data = await login(credentials.email, credentials.password)
      
      // Se MFA richiesto, gestisci separatamente
      if (data.mfa_required) {
        return { 
          success: false, 
          mfa_required: true,
          user_id: data.user_id,
          message: data.message 
        }
      }

      // Login successful - non serve più setCurrentView, isAuthenticated gestisce tutto
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
    // Qui andrà la logica per inviare email di reset
  }

  const handleLogout = async () => {
    // ✅ Pulisci lo stato salvato nel sessionStorage
    sessionStorage.removeItem('dashboard_currentView_cliente')
    sessionStorage.removeItem('dashboard_currentView_notaio')
    sessionStorage.removeItem('dashboard_currentView_admin')
    sessionStorage.removeItem('appointmentRoom_activeAppointment')
    sessionStorage.removeItem('appointmentRoom_isMinimized')
    sessionStorage.removeItem('appointmentRoom_isFloating')
    
    await logout()
    // Torna alla pagina di login dopo il logout
    setCurrentView('login')
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
          {user?.role === 'admin' ? (
            <DashboardAdmin onLogout={handleLogout} user={user} />
          ) : user?.role === 'notaio' ? (
            <DashboardNotaio onLogout={handleLogout} user={user} />
          ) : (
            <Dashboard onLogout={handleLogout} user={user} />
          )}
        </ProtectedRoute>
        <AppointmentRoom />
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

// App principale con AuthProvider, ToastProvider e AppointmentRoomProvider
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppointmentRoomProvider>
          <AppContent />
          <ToastContainer />
        </AppointmentRoomProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App

