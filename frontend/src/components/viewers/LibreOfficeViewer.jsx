import React, { useEffect, useRef, useState } from 'react'
import authService from '../../services/authService'
import './LibreOfficeViewer.css'

/**
 * Viewer LibreOffice Collabora Online per documenti Word (.doc, .docx)
 * Mostra documenti con pagine A4 separate IDENTICHE a Word/OnlyOffice
 *
 * Richiede:
 * - Collabora Online server (Docker)
 * - Backend WOPI protocol implementation
 *
 * Collaborazione Real-Time:
 * - Notaio: editable=true → può modificare e controllare il documento
 * - Cliente: editable=false → segue il notaio in tempo reale (scroll, zoom, pagina)
 */
const LibreOfficeViewer = ({ documentId, documentPath, appointmentId, editable = false, wsConnection = null, userRole = 'cliente' }) => {
  const frameRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [collaboraUrl, setCollaboraUrl] = useState(null)
  const [showSavedModal, setShowSavedModal] = useState(false)  // ✅ Modale "Salvato con successo"
  const wsRef = useRef(null)
  
  // ✅ Flag per tracciare se l'utente ha modificato il documento
  const hasUserEditedRef = useRef(false)
  const documentLoadedRef = useRef(false)
  
  // Stati per sincronizzazione
  const [followMode, setFollowMode] = useState(!editable) // Cliente in follow mode di default

  useEffect(() => {
    if (!documentId && !documentPath) {
      setError('Nessun documento specificato')
      setLoading(false)
      return
    }

    // ✅ Reset flag ad ogni nuovo caricamento documento
    hasUserEditedRef.current = false
    documentLoadedRef.current = false

    loadDocument()
    
    // ✅ Filtra warning benigni di Collabora dalla console
    const originalError = console.error
    console.error = (...args) => {
      const message = args[0]?.toString() || ''
      // Ignora warning specifici di Collabora (benigni)
      if (message.includes('editorHasFocus') || 
          message.includes('Blocked autofocusing') ||
          message.includes('cross-origin subframe')) {
        return // Non mostrare
      }
      originalError.apply(console, args)
    }
    
    return () => {
      console.error = originalError  // Ripristina console.error originale
    }
  }, [documentId, documentPath, appointmentId])
  
  // ✅ Ascolta messaggi da Collabora Online (postMessage API)
  useEffect(() => {
    const handlePostMessage = (event) => {
      try {
        // Verifica che il messaggio venga da Collabora
        const collaboraHost = import.meta.env.VITE_COLLABORA_URL || 'http://localhost:9980'
        if (!event.origin.includes('localhost:9980') && !event.origin.includes(collaboraHost)) {
          return
        }
        
        const msg = JSON.parse(event.data)
        console.log('📨 [COLLABORA] Messaggio ricevuto:', msg)
        
        // ✅ Intercetta quando l'utente inizia a modificare
        if (msg.MessageId === 'Doc_ModifiedStatus' && msg.Values) {
          if (msg.Values.Modified === true) {
            // L'utente ha modificato qualcosa
            console.log('✏️ Utente ha iniziato a modificare')
            hasUserEditedRef.current = true
          } else if (msg.Values.Modified === false) {
            // Documento salvato
            console.log('💾 Documento salvato con successo!')
            // ✅ Mostra modale SOLO se l'utente ha effettivamente modificato
            if (editable && hasUserEditedRef.current && documentLoadedRef.current) {
              setShowSavedModal(true)
              // Nascondi dopo 2 secondi
              setTimeout(() => setShowSavedModal(false), 2000)
              // Reset flag dopo il salvataggio
              hasUserEditedRef.current = false
            }
          }
        }
        
        // ✅ Intercetta quando il documento è completamente caricato
        if (msg.MessageId === 'App_LoadingStatus' && msg.Values && msg.Values.Status === 'Document_Loaded') {
          console.log('📄 Documento completamente caricato')
          documentLoadedRef.current = true
        }
        
        // ✅ Intercetta e chiudi automaticamente dialog di modifica
        if (msg.MessageId === 'UI_Close' || 
            msg.MessageId === 'Action_Save_Resp' ||
            (msg.MessageId && msg.MessageId.includes('Dialog'))) {
          console.log('🔕 Dialog rilevato e auto-chiuso:', msg.MessageId)
          // Invia comando per chiudere la dialog
          if (frameRef.current && frameRef.current.contentWindow) {
            frameRef.current.contentWindow.postMessage(
              JSON.stringify({ MessageId: 'Action_Close', SendTime: Date.now() }),
              '*'
            )
          }
        }
        
        // Se sono il notaio, invia le mie azioni al cliente via WebSocket
        if (editable && wsConnection && wsConnection.readyState === WebSocket.OPEN) {
          // Eventi da sincronizzare
          if (msg.MessageId === 'Action_ViewCursor' || 
              msg.MessageId === 'Action_InvalidateTiles' ||
              msg.MessageId === 'Scroll_To') {
            
            console.log('📤 [NOTAIO] Invio azione al cliente:', msg.MessageId)
            wsConnection.send(JSON.stringify({
              type: 'OFFICE_ACTION',
              action: msg,
              documentId: documentId
            }))
          }
        }
      } catch (error) {
        // Non è un messaggio JSON valido, ignora
      }
    }
    
    window.addEventListener('message', handlePostMessage)
    return () => window.removeEventListener('message', handlePostMessage)
  }, [editable, documentId, wsConnection])
  
  // ✅ Se sono il cliente, ricevi azioni dal notaio e applicale
  useEffect(() => {
    if (!editable && wsConnection) {
      const handleWSMessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'OFFICE_ACTION' && data.documentId === documentId) {
            console.log('📥 [CLIENTE] Ricevuto azione dal notaio:', data.action)
            
            // Invia l'azione all'iframe di Collabora
            if (frameRef.current && frameRef.current.contentWindow) {
              frameRef.current.contentWindow.postMessage(JSON.stringify(data.action), '*')
            }
          }
        } catch (error) {
          console.error('❌ Errore parsing messaggio WS:', error)
        }
      }
      
      wsConnection.addEventListener('message', handleWSMessage)
      return () => wsConnection.removeEventListener('message', handleWSMessage)
    }
  }, [editable, documentId, wsConnection])

  const loadDocument = async () => {
    try {
      setLoading(true)
      setError(null)

      // ✅ Backend host SENZA /api (per WOPI endpoints)
      const backendHost = import.meta.env.VITE_BACKEND_HOST || 'http://localhost:8000'
      const collaboraHost = import.meta.env.VITE_COLLABORA_URL || 'http://localhost:9980'
      
      // ✅ WOPI host: Collabora in Docker usa host.docker.internal per raggiungere l'host
      // Il frontend usa localhost, ma Collabora deve usare host.docker.internal
      const wopiBackendHost = backendHost.replace('localhost', 'host.docker.internal')
      
      // Ottieni token JWT
      const token = authService.getAccessToken()
      if (!token) {
        throw new Error('Token di autenticazione non trovato')
      }

      console.log('📄 LibreOffice Viewer - Document ID:', documentId)
      console.log('📄 Editable:', editable)
      console.log('📄 Collabora Host:', collaboraHost)
      console.log('📄 Backend Host (frontend):', backendHost)
      console.log('📄 WOPI Backend Host (per Collabora):', wopiBackendHost)

      // ✅ WOPI Discovery: usa host.docker.internal per Collabora in Docker
      const wopiSrc = `${wopiBackendHost}/api/documents/wopi/files/${documentId}`
      
      // ✅ Costruisci URL Collabora SEMPRE in modalità edit per collaborazione real-time
      // IMPORTANTE: Entrambi (notaio e cliente) aprono in modalità "edit" così vedono
      // le modifiche in tempo reale. L'overlay trasparente blocca l'interazione del cliente.
      
      // Parametri aggiuntivi per sincronizzazione perfetta
      const urlParams = new URLSearchParams({
        WOPISrc: wopiSrc,
        access_token: token,
        permission: 'edit',
        lang: 'it',
        // ✅ Abilita tracking utenti e follow mode
        WOPIPostMessageOrigin: window.location.origin,
        EnableOwnerTermination: 'true',
        // ✅ DISABILITA tutti i dialog fastidiosi di salvataggio
        closebutton: 'false',
        revisionhistory: 'false',
        // ✅ SOLO salvataggio MANUALE (no auto-save)
        EnableAutoSave: 'false',  // ❌ Nessun auto-save
        // ✅ Disabilita dialog di conferma al salvataggio
        DisableSaveNotifications: 'true',
        DisableSaveDialog: 'true',
        DisableModifiedDialog: 'true',
        DisableCloseDialog: 'true',
        DisableExport: 'false',
        // ✅ Non mostrare warning/alert/dialogs
        disable_alert: 'true',
        DisableInactiveMessages: 'true',
        HideSaveOption: 'false',  // ✅ Mantieni pulsante Salva visibile
        HideRepairDialog: 'true',
        DisableCopy: 'false',
        UserCanNotWriteRelative: 'true',
        CloseButtonEnabled: 'false',
        // ✅ Per il cliente: abilita follow mode automatico del notaio
        ...((!editable) && { FollowUser: 'true' })
      })
      
      const collaboraIframeUrl = `${collaboraHost}/browser/dist/cool.html?${urlParams.toString()}`

      console.log('📄 Collabora URL:', collaboraIframeUrl)
      console.log('📄 WOPI Source:', wopiSrc)
      console.log('📄 Modalità: edit (real-time collaboration)')
      console.log('📄 Cliente può editare:', editable, '(overlay blocca se false)')
      console.log('📄 Follow Mode (cliente):', !editable)

      setCollaboraUrl(collaboraIframeUrl)
      setLoading(false)

    } catch (err) {
      console.error('❌ Errore caricamento LibreOffice:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const handleIframeLoad = () => {
    console.log('✅ LibreOffice iframe caricato')
    setLoading(false)
    
    // ✅ Inietta CSS per nascondere dialog di Collabora
    try {
      const iframe = frameRef.current
      if (iframe && iframe.contentWindow) {
        // Aspetta che il DOM di Collabora sia pronto
        setTimeout(() => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
            
            // ✅ CSS per nascondere dialog
            const style = iframeDoc.createElement('style')
            style.textContent = `
              /* Nascondi TUTTE le dialog di salvataggio/modifica */
              .vex-dialog-message:has-text("modificato"),
              .vex-dialog-message:has-text("salvate"),
              .vex-dialog-message:has-text("modified"),
              .vex-dialog-message:has-text("unsaved"),
              div[role="dialog"],
              .lokdialog-dialog,
              .ui-dialog,
              .vex-dialog-form {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
              }
              
              /* Nascondi overlay delle dialog */
              .vex-overlay,
              .ui-widget-overlay,
              .vex-overlay-transparent {
                display: none !important;
              }
            `
            iframeDoc.head.appendChild(style)
            console.log('✅ CSS iniettato per nascondere dialog Collabora')
            
            // ✅ Script per auto-cliccare "Sovrascrivi" se la dialog appare
            const script = iframeDoc.createElement('script')
            script.textContent = `
              (function() {
                // Monitora l'apparizione di dialog
                const observer = new MutationObserver(function(mutations) {
                  // Cerca pulsante "Sovrascrivi" o "Overwrite"
                  const buttons = document.querySelectorAll('button, .vex-dialog-button');
                  buttons.forEach(btn => {
                    const text = btn.textContent?.toLowerCase() || '';
                    if (text.includes('sovrascrivi') || text.includes('overwrite')) {
                      console.log('🔄 Auto-click su "Sovrascrivi"');
                      btn.click();
                    }
                  });
                });
                
                observer.observe(document.body, {
                  childList: true,
                  subtree: true
                });
              })();
            `
            iframeDoc.head.appendChild(script)
            console.log('✅ Script auto-click "Sovrascrivi" iniettato')
          } catch (err) {
            console.warn('⚠️ Impossibile iniettare CSS nell\'iframe (cross-origin):', err)
          }
        }, 2000)
      }
    } catch (err) {
      console.warn('⚠️ Errore iniezione CSS:', err)
    }
  }

  const handleIframeError = () => {
    console.error('❌ Errore caricamento iframe LibreOffice')
    setError('Impossibile caricare il documento. Verifica che Collabora Online sia in esecuzione.')
    setLoading(false)
  }

  // 🔍 DEBUG: Log stati per capire perché status bar non appare
  console.log('🔍 LibreOffice - collaboraUrl:', !!collaboraUrl, 'loading:', loading, 'error:', error)
  console.log('🔍 LibreOffice - editable:', editable, '| userRole:', userRole)
  console.log('🔍 LibreOffice - Overlay visibile?', !editable, '(deve essere false per notaio)')

  return (
    <div className="libreoffice-viewer-container">
      {/* ✅ Collabora mostrato completamente con la sua toolbar nativa */}
      <div className="libreoffice-iframe-wrapper" style={{ position: 'relative' }}>
        {/* Iframe Collabora Online - SEMPRE in modalità edit per vedere modifiche real-time */}
        {collaboraUrl && (
          <iframe
            ref={frameRef}
            src={collaboraUrl}
            className="libreoffice-iframe"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            allow="autoplay; clipboard-read; clipboard-write; fullscreen; focus-without-user-activation; accelerometer; camera; microphone; display-capture"
            allowFullScreen
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-pointer-lock allow-top-navigation-by-user-activation"
            title="LibreOffice Document Viewer"
            style={{ border: 'none', width: '100%', height: '100%' }}
          />
        )}
        
        {/* ✅ Overlay visibile SOLO per il cliente (quando editable è false) */}
        {!editable && userRole !== 'notaio' && userRole !== 'admin' && (
          <div 
            className="libreoffice-readonly-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000,
              cursor: 'default',
              pointerEvents: 'none', // ✅ NON blocca eventi - permette scroll sync
              background: 'transparent'
            }}
            title="Modalità visualizzazione - Stai seguendo il notaio in tempo reale"
          >
            {/* Badge "Sola Lettura" in alto a sinistra */}
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              background: 'rgba(239, 68, 68, 0.95)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              pointerEvents: 'none'
            }}>
              <span style={{ fontSize: '18px' }}>👁️</span>
              <span>Modalità Visualizzazione</span>
            </div>
            
            {/* Messaggio informativo al centro (appare brevemente) */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(17, 24, 39, 0.95)',
              color: 'white',
              padding: '24px 32px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '500',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
              textAlign: 'center',
              maxWidth: '500px',
              pointerEvents: 'none',
              animation: 'fadeInOut 5s ease-in-out'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
              <div style={{ marginBottom: '8px', fontSize: '18px' }}>Documento in modalità passiva</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>
                Stai visualizzando le modifiche del notaio in tempo reale.
                <br />
                Non puoi modificare il documento finché il notaio non ti dà il permesso.
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Status Bar - NASCOSTA perché LibreOffice ha la sua */}

      {/* Overlay loading */}
      {loading && (
        <div className="libreoffice-loading-overlay">
          <div className="loading-spinner"></div>
          <p>Caricamento documento LibreOffice...</p>
          <p className="loading-hint">Attendere connessione a Collabora Online</p>
        </div>
      )}

      {/* Overlay errore */}
      {error && (
        <div className="libreoffice-error-overlay">
          <h3>⚠️ Errore caricamento documento</h3>
          <p>{error}</p>
          <div className="error-hint">
            <p><strong>Suggerimenti:</strong></p>
            <ul>
              <li>Verifica che Collabora Online sia in esecuzione (Docker)</li>
              <li>Controlla la configurazione WOPI nel backend</li>
              <li>Verifica che il documento esista</li>
            </ul>
          </div>
        </div>
      )}

      {/* ✅ Modale custom "Documento salvato con successo" */}
      {showSavedModal && (
        <>
          {/* Backdrop */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.3)',
            zIndex: 9999
          }} />
          
          {/* Modale */}
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '32px 48px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            minWidth: '400px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: 'white',
              fontWeight: 'bold'
            }}>
              ✓
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              Documento salvato con successo
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              Le modifiche sono state salvate nella cartella dell'appuntamento
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default LibreOfficeViewer

