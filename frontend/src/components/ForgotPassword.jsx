import React, { useState } from 'react'
import { Mail, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'
import './ForgotPassword.css'

function ForgotPassword({ onBack, onSubmit }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const validateEmail = () => {
    if (!email) {
      setError('Email richiesta')
      return false
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email non valida')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateEmail()) {
      setIsSubmitted(true)
      onSubmit && onSubmit({ email })
    }
  }

  const handleBackToLogin = (e) => {
    e.preventDefault()
    onBack && onBack()
  }

  if (isSubmitted) {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-background">
          <div className="forgot-password-shape forgot-password-shape-1"></div>
          <div className="forgot-password-shape forgot-password-shape-2"></div>
          <div className="forgot-password-shape forgot-password-shape-3"></div>
        </div>

        <div className="forgot-password-topbar">
          <img src="/assets/Logo_San_Marino.svg" alt="Repubblica di San Marino" className="san-marino-logo" />
        </div>

        <div className="forgot-password-content">
          <div className="success-icon-wrapper">
            <CheckCircle size={64} className="success-icon" />
          </div>

          <h1 className="forgot-password-title">Email Inviata!</h1>
          <p className="forgot-password-description">
            Abbiamo inviato le istruzioni per reimpostare la password all'indirizzo:
          </p>
          <p className="email-sent">{email}</p>
          <p className="forgot-password-note">
            Controlla la tua casella di posta e segui le istruzioni per creare una nuova password.
          </p>

          <button className="back-to-login-btn" onClick={handleBackToLogin}>
            <ArrowLeft size={20} />
            <span>Torna al Login</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-background">
        <div className="forgot-password-shape forgot-password-shape-1"></div>
        <div className="forgot-password-shape forgot-password-shape-2"></div>
        <div className="forgot-password-shape forgot-password-shape-3"></div>
      </div>

      <div className="forgot-password-topbar">
        <img src="/assets/Logo_San_Marino.svg" alt="Repubblica di San Marino" className="san-marino-logo" />
      </div>

      <div className="forgot-password-content">
        <div className="forgot-password-header">
          <div className="forgot-password-logo">
            <span className="forgot-password-logo-digital">Digital</span>
            <div className="forgot-password-logo-notary-container">
              <span className="forgot-password-logo-notary">Notary</span>
              <img src="/assets/element.png" alt="" className="forgot-password-logo-underline" />
            </div>
          </div>
          <div className="forgot-password-welcome-text">
            <p><span className="welcome-highlight">Benvenuto</span> nella piattaforma digitale</p>
            <p>per la gestione dei servizi notarili</p>
            <p>della Repubblica di San Marino</p>
          </div>
        </div>

        <form className="forgot-password-form" onSubmit={handleSubmit}>
          <button type="button" className="back-btn" onClick={handleBackToLogin}>
            <ArrowLeft size={20} />
            <span>Indietro</span>
          </button>

          <div className="forgot-password-form-content">
            <h1 className="forgot-password-title">Password Dimenticata?</h1>
            <p className="forgot-password-subtitle">
              Inserisci la tua email e ti invieremo le istruzioni per reimpostare la password
            </p>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <div className="input-wrapper">
                <Mail size={20} className="input-icon" />
                <input
                  type="email"
                  id="email"
                  className={`form-input ${error ? 'input-error' : ''}`}
                  placeholder="nome@esempio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && <span className="error-message">{error}</span>}
            </div>

            <button type="submit" className="submit-btn">
              <span>Invia Istruzioni</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ForgotPassword

