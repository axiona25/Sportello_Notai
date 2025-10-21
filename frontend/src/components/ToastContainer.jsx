import React from 'react'
import { useToast } from '../contexts/ToastContext'
import Toast from './Toast'
import './Toast.css'

function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          title={toast.title}
          onRemove={removeToast}
        />
      ))}
    </div>
  )
}

export default ToastContainer

