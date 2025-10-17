import React, { useState } from 'react'
import Login from './components/Login'
import ForgotPassword from './components/ForgotPassword'
import Dashboard from './components/Dashboard'
import DashboardNotaio from './components/DashboardNotaio'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('login') // 'login', 'forgot-password', 'dashboard'
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState(null) // 'cliente', 'notaio'

  const handleLogin = (credentials) => {
    console.log('Login attempt:', credentials)
    
    // Credenziali demo Cliente
    const DEMO_CLIENTE_EMAIL = 'demo@digitalnotary.sm'
    const DEMO_CLIENTE_PASSWORD = 'Demo2024'
    
    // Credenziali demo Notaio
    const DEMO_NOTAIO_EMAIL = 'notaio@digitalnotary.sm'
    const DEMO_NOTAIO_PASSWORD = 'Notaio2024'
    
    // Verifica credenziali Cliente
    if (credentials.email === DEMO_CLIENTE_EMAIL && credentials.password === DEMO_CLIENTE_PASSWORD) {
      console.log('Login successful! Role: Cliente')
      setIsAuthenticated(true)
      setUserRole('cliente')
      setCurrentView('dashboard')
      return { success: true }
    } 
    // Verifica credenziali Notaio
    else if (credentials.email === DEMO_NOTAIO_EMAIL && credentials.password === DEMO_NOTAIO_PASSWORD) {
      console.log('Login successful! Role: Notaio')
      setIsAuthenticated(true)
      setUserRole('notaio')
      setCurrentView('dashboard')
      return { success: true }
    } 
    else {
      console.log('Login failed: Invalid credentials')
      return { 
        success: false, 
        error: 'Email o password non corrette. Usa le credenziali demo.' 
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

  const handleLogout = () => {
    console.log('Logout...')
    setIsAuthenticated(false)
    setUserRole(null)
    setCurrentView('login')
  }

  // Se autenticato, mostra la dashboard appropriata in base al ruolo
  if (isAuthenticated && currentView === 'dashboard') {
    return (
      <div className="app">
        {userRole === 'notaio' ? (
          <DashboardNotaio onLogout={handleLogout} />
        ) : (
          <Dashboard onLogout={handleLogout} />
        )}
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

  // Altrimenti mostra il login
  return (
    <Login
      onLogin={handleLogin}
      onForgotPassword={handleForgotPassword}
    />
  )
}

export default App

