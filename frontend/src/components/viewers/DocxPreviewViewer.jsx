import React, { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { renderAsync } from 'docx-preview'
import authService from '../../services/authService'
import './DocxPreviewViewer.css'

/**
 * Viewer DOCX usando docx-preview
 * Mostra il documento con pagine A4 separate come Word/OnlyOffice
 */
const DocxPreviewViewer = ({ documentId, documentPath }) => {
  const containerRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const loadedRef = useRef(false) // Track if document is already loaded
  
  // ✅ useLayoutEffect viene eseguito DOPO il commit del DOM, prima del paint
  // Perfetto per garantire che containerRef.current sia disponibile
  useLayoutEffect(() => {
    // Skip if no document specified
    if (!documentId && !documentPath) {
      setLoading(false)
      return
    }
    
    // Skip if document already loaded (prevents reload on parent re-renders)
    if (loadedRef.current) {
      console.log('📄 Documento già caricato, skip reload')
      return
    }
    
    if (!containerRef.current) {
      console.log('⏳ Container ref non ancora disponibile (impossibile con useLayoutEffect)')
      return
    }
    
    console.log('✅ Container ref disponibile, inizio caricamento')
    loadDocument()
  }, [documentId, documentPath])
  
  const loadDocument = async () => {
    if (!containerRef.current) {
      console.log('⏳ Container ref non ancora disponibile...')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      
      // Determina se il file è .doc o .docx
      const isOldDoc = documentPath && documentPath.toLowerCase().endsWith('.doc') && !documentPath.toLowerCase().endsWith('.docx')
      
      let url
      
      if (isOldDoc && documentId) {
        // Per file .doc, usa l'endpoint di conversione che converte .doc → .docx automaticamente
        url = `${baseUrl}/api/documents/office/${documentId}/download/`
        console.log('📄 File .doc rilevato, uso conversione automatica:', url)
      } else if (documentPath) {
        // Per file .docx, carica direttamente
        if (documentPath.startsWith('http://') || documentPath.startsWith('https://')) {
          url = documentPath
        } else {
          url = `${baseUrl}${documentPath}`
        }
        console.log('📄 Caricamento file .docx da:', url)
      } else if (documentId) {
        // Usa endpoint download API
        url = `${baseUrl}/api/documents/office/${documentId}/download/`
        console.log('📄 Caricamento documento via API:', url)
      } else {
        throw new Error('Nessun documento specificato')
      }
      
      // Ottieni token JWT usando authService (come apiClient)
      const token = authService.getAccessToken()
      
      if (!token) {
        throw new Error('Token di autenticazione non trovato. Effettua il login.')
      }
      
      console.log('🔑 Token JWT trovato, lunghezza:', token.length)
      
      // Scarica il file DOCX con autenticazione
      // NON specificare Accept header specifico, DRF lo rifiuta con 406
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Errore HTTP ${response.status}`)
      }
      
      // Converti in blob
      const blob = await response.blob()
      
      if (!blob || blob.size === 0) {
        throw new Error('File vuoto o non valido')
      }
      
      console.log('✅ File scaricato:', blob.size, 'bytes, tipo:', blob.type)
      
      // Verifica tipo file
      if (!blob.type.includes('officedocument') && !blob.type.includes('msword') && !blob.type.includes('octet-stream')) {
        console.warn('⚠️ Tipo MIME sospetto:', blob.type)
      }
      
      // Renderizza usando docx-preview
      if (containerRef.current) {
        console.log('🔄 Inizio rendering con docx-preview...')
        
        // Pulisci contenitore
        containerRef.current.innerHTML = ''
        
        // Opzioni di rendering per layout Word-like
        const options = {
          className: 'docx-preview-document',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true, // ✅ CRITICO: crea pagine separate
          ignoreLastRenderedPageBreak: false,
          experimental: false,
          trimXmlDeclaration: true,
          useBase64URL: false,
          useMathMLPolyfill: false,
          renderChanges: false,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
          debug: true // ✅ Abilita debug per vedere errori
        }
        
        console.log('📝 Opzioni rendering:', options)
        
        try {
          await renderAsync(blob, containerRef.current, null, options)
          console.log('✅ renderAsync completato')
          console.log('📊 Contenuto generato:', containerRef.current.innerHTML.substring(0, 200))
          
          // Mark as loaded to prevent reloading
          loadedRef.current = true
        } catch (renderError) {
          console.error('❌ Errore durante renderAsync:', renderError)
          throw new Error(`Rendering fallito: ${renderError.message}`)
        }
      }
      
      setLoading(false)
      
    } catch (err) {
      console.error('❌ Errore caricamento documento:', err)
      setError(err.message)
      setLoading(false)
    }
  }
  
  return (
    <div className="docx-preview-container">
      {/* ✅ Renderizza SEMPRE il container con ref, altrimenti useLayoutEffect non può accedervi */}
      <div 
        ref={containerRef} 
        className="docx-preview-content"
      />
      
      {/* Overlay loader e errori sopra il container */}
      {loading && (
        <div className="docx-preview-loading-overlay">
          <div className="loading-spinner"></div>
          <p>Caricamento documento...</p>
        </div>
      )}
      
      {error && (
        <div className="docx-preview-error-overlay">
          <h3>⚠️ Errore caricamento documento</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}

export default DocxPreviewViewer

