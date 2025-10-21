/**
 * useAuth Hook
 * Gestisce stato di autenticazione nell'applicazione
 */

import { useState, useEffect, createContext, useContext } from 'react'
import authService from '../services/authService'

// Context per autenticazione
const AuthContext = createContext(null)

/**
 * Provider per autenticazione
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Carica utente da localStorage al mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = authService.getUser()
        const token = authService.getAccessToken()

        if (storedUser && token) {
          setUser(storedUser)
          setIsAuthenticated(true)
        }
      } catch (error) {
        authService.clearAuth()
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  /**
   * Login
   */
  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password)
      
      // Se MFA richiesto, ritorna per gestione
      if (data.mfa_required) {
        return data
      }

      // Imposta user e autenticazione
      setUser(data.user)
      setIsAuthenticated(true)
      
      return data
    } catch (error) {
      throw error
    }
  }

  /**
   * Logout
   */
  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
    } finally {
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  /**
   * Verifica ruolo utente
   */
  const hasRole = (role) => {
    return user?.role === role
  }

  /**
   * Verifica se ha uno dei ruoli specificati
   */
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role)
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    hasRole,
    hasAnyRole,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook per usare autenticazione
 */
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth deve essere usato dentro AuthProvider')
  }
  
  return context
}

export default useAuth

