import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast deve essere usato all\'interno di ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success', title = '') => {
    const id = Date.now() + Math.random()
    const newToast = {
      id,
      message,
      type,
      title: title || getDefaultTitle(type)
    }
    
    setToasts(prev => [...prev, newToast])
    
    // Rimuovi automaticamente dopo 5 secondi
    setTimeout(() => {
      removeToast(id)
    }, 5000)
    
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const getDefaultTitle = (type) => {
    switch (type) {
      case 'success':
        return 'Operazione completata'
      case 'error':
        return 'Errore'
      case 'warning':
        return 'Attenzione'
      case 'info':
        return 'Informazione'
      default:
        return 'Notifica'
    }
  }

  return (
    <ToastContext.Provider value={{ showToast, removeToast, toasts }}>
      {children}
    </ToastContext.Provider>
  )
}

