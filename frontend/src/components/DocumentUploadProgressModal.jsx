import React, { useState, useEffect } from 'react'
import { Upload, CheckCircle, FileText } from 'lucide-react'
import './DocumentUploadProgressModal.css'

function DocumentUploadProgressModal({ 
  isOpen, 
  totalDocuments, 
  onComplete 
}) {
  const [currentDocument, setCurrentDocument] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      // Reset quando la modale si chiude
      setCurrentDocument(0)
      setIsCompleted(false)
      setShowSuccess(false)
      return
    }

    // Simula l'invio progressivo dei documenti
    if (currentDocument < totalDocuments) {
      const timer = setTimeout(() => {
        setCurrentDocument(prev => prev + 1)
      }, 800) // 800ms per documento

      return () => clearTimeout(timer)
    } else if (currentDocument === totalDocuments && !isCompleted) {
      // Tutti i documenti inviati
      setIsCompleted(true)
      
      // Mostra messaggio di successo
      setTimeout(() => {
        setShowSuccess(true)
        
        // Chiudi tutto dopo 3 secondi
        setTimeout(() => {
          onComplete()
        }, 3000)
      }, 500)
    }
  }, [isOpen, currentDocument, totalDocuments, isCompleted, onComplete])

  if (!isOpen) return null

  const progressPercentage = (currentDocument / totalDocuments) * 100

  return (
    <div className="document-progress-overlay">
      <div className="document-progress-modal">
        {!showSuccess ? (
          <>
            {/* Icona animata */}
            <div className="progress-icon-container">
              <div className="progress-icon-circle">
                <Upload size={32} className="progress-upload-icon" />
              </div>
              <div className="progress-pulse"></div>
            </div>

            {/* Titolo */}
            <h3 className="progress-title">Invio Documenti in corso...</h3>

            {/* Contatore documenti */}
            <div className="progress-counter">
              <FileText size={20} />
              <span className="progress-counter-text">
                {currentDocument} / {totalDocuments} documenti inviati
              </span>
            </div>

            {/* Barra di progresso */}
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="progress-bar-shine"></div>
              </div>
            </div>

            {/* Percentuale */}
            <div className="progress-percentage">
              {Math.round(progressPercentage)}%
            </div>
          </>
        ) : (
          <>
            {/* Messaggio di successo */}
            <div className="progress-success-container">
              <div className="progress-success-icon">
                <CheckCircle size={64} />
              </div>
              <h3 className="progress-success-title">Invio Documenti Riuscito!</h3>
              <p className="progress-success-message">
                Tutti i {totalDocuments} documenti sono stati inviati al notaio per la verifica
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DocumentUploadProgressModal

