import React, { useState } from 'react'
import Login from './components/Login'
import ForgotPassword from './components/ForgotPassword'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('login') // 'login', 'forgot-password', 'dashboard'
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLogin = (credentials) => {
    console.log('Login attempt:', credentials)
    
    // Credenziali demo
    const DEMO_EMAIL = 'demo@digitalnotary.sm'
    const DEMO_PASSWORD = 'Demo2024'
    
    // Verifica credenziali
    if (credentials.email === DEMO_EMAIL && credentials.password === DEMO_PASSWORD) {
      console.log('Login successful!')
      setIsAuthenticated(true)
      setCurrentView('dashboard')
      return { success: true }
    } else {
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
    setCurrentView('login')
  }

  // Se autenticato, mostra la dashboard
  if (isAuthenticated && currentView === 'dashboard') {
    return (
      <div className="app">
        <Dashboard onLogout={handleLogout} />
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

