import React, { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import './Login.css'

function Login({ onLogin, onForgotPassword }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}
    
    if (!email) {
      newErrors.email = 'Email richiesta'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email non valida'
    }
    
    if (!password) {
      newErrors.password = 'Password richiesta'
    } else if (password.length < 6) {
      newErrors.password = 'La password deve contenere almeno 6 caratteri'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      const result = onLogin && onLogin({ email, password })
      if (result && !result.success) {
        setErrors({ ...errors, submit: result.error })
      }
    }
  }

  const handleForgotPassword = (e) => {
    e.preventDefault()
    onForgotPassword && onForgotPassword()
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-shape login-shape-1"></div>
        <div className="login-shape login-shape-2"></div>
        <div className="login-shape login-shape-3"></div>
      </div>

      <div className="login-content">
        <div className="login-header">
          <div className="login-logo">
            <span className="login-logo-digital">Digital</span>
            <div className="login-logo-notary-container">
              <span className="login-logo-notary">Notary</span>
              <img src="/assets/element.png" alt="" className="login-logo-underline" />
            </div>
          </div>
          <div className="login-welcome-text">
            <p><span className="welcome-highlight">Benvenuto</span> nella piattaforma digitale</p>
            <p>per la gestione dei servizi notarili</p>
            <p>della Repubblica di San Marino</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <p className="login-subtitle">Accedi al tuo account</p>
          
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <div className="input-wrapper">
              <Mail size={20} className="input-icon" />
              <input
                type="email"
                id="email"
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                placeholder="nome@esempio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="input-wrapper">
              <Lock size={20} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-footer">
            <button
              type="button"
              className="forgot-password-link"
              onClick={handleForgotPassword}
            >
              Password dimenticata?
            </button>
          </div>

          {errors.submit && (
            <div className="login-error">
              {errors.submit}
            </div>
          )}

          <button type="submit" className="login-btn">
            <span>Accedi</span>
            <ArrowRight size={20} />
          </button>
        </form>

        <div className="login-footer">
          <p className="login-footer-text">
            Non hai un account?{' '}
            <a href="#" className="register-link">Registrati</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login

