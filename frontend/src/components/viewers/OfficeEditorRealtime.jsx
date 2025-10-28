import React, { useState, useEffect, useRef, useCallback } from 'react'
import ReactDOM from 'react-dom'
import ReactQuill, { Quill } from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { Loader } from 'lucide-react'
import { 
  FaAlignLeft, 
  FaAlignCenter, 
  FaAlignRight, 
  FaAlignJustify,
  FaHighlighter,
  FaFont,
  FaUnderline,
  FaListOl,
  FaListUl,
  FaIndent,
  FaOutdent,
  FaBold,
  FaItalic,
  FaStrikethrough,
  FaSubscript,
  FaSuperscript,
  FaUndo,
  FaRedo,
  FaCopy,
  FaPrint,
  FaSave,
  FaDownload,
  FaFile,
  FaColumns
} from 'react-icons/fa'
import authService from '../../services/authService'
import './OfficeEditorRealtime.css'

// ✅ Tabelle: usa modulo nativo Quill (più stabile di better-table)

// Font personalizzati
const Font = Quill.import('formats/font')
Font.whitelist = ['arial', 'courier', 'georgia', 'times', 'verdana', 'tahoma', 'trebuchet', 'comic-sans']
Quill.register(Font, true)

// Size personalizzati (stile Word - valori in pt e px)
const Size = Quill.import('formats/size')
Size.whitelist = ['8pt', '9pt', '10pt', '11pt', '12pt', '14pt', '16pt', '18pt', '20pt', '22pt', '24pt', '26pt', '28pt', '36pt', '48pt']
Quill.register(Size, true)

/**
 * Componente menu colori personalizzato
 */
const ColorMenu = ({ onSelectColor, currentColor, buttonRect }) => {
  console.log('🎨🎨🎨 ColorMenu RENDERIZZATO! currentColor:', currentColor, 'buttonRect:', buttonRect)
  
  // Colori tema Office (10 colori base + 5 sfumature ciascuno) - Palette Microsoft Office Standard
  const themeColors = [
    { base: '#FFFFFF', shades: ['#FFFFFF', '#F2F2F2', '#D9D9D9', '#BFBFBF', '#A6A6A6'] }, // Bianco
    { base: '#000000', shades: ['#7F7F7F', '#595959', '#3F3F3F', '#262626', '#000000'] }, // Nero
    { base: '#EEECE1', shades: ['#F2F0E6', '#E7E6E0', '#D8D5C8', '#C6C2B0', '#B7B09A'] }, // Beige
    { base: '#1F497D', shades: ['#C5D9F1', '#8DB3E2', '#548DD4', '#17365D', '#0F243E'] }, // Blu Office
    { base: '#4F81BD', shades: ['#DCE6F1', '#B8CCE4', '#95B3D7', '#366092', '#244062'] }, // Blu chiaro
    { base: '#C0504D', shades: ['#F2DCDB', '#E5B8B7', '#D99694', '#953734', '#632423'] }, // Rosso
    { base: '#9BBB59', shades: ['#EBF1DD', '#D7E3BC', '#C3D69B', '#76933C', '#4F6228'] }, // Verde
    { base: '#8064A2', shades: ['#E4DFEC', '#CCC0DA', '#B2A1C7', '#60497A', '#403152'] }, // Viola
    { base: '#4BACC6', shades: ['#DAEEF3', '#B7DEE8', '#92CDDC', '#31869B', '#205867'] }, // Azzurro
    { base: '#F79646', shades: ['#FDE9D9', '#FCD5B4', '#FAC090', '#E36C09', '#974806'] }, // Arancione
  ]
  
  // Colori standard Office
  const standardColors = [
    '#C00000', // Rosso scuro
    '#FF0000', // Rosso
    '#FFC000', // Arancione
    '#FFFF00', // Giallo
    '#92D050', // Verde chiaro
    '#00B050', // Verde
    '#00B0F0', // Azzurro
    '#0070C0', // Blu
    '#002060', // Blu scuro
    '#7030A0', // Viola
  ]
  
  const menuContent = (
    <div 
      className="color-menu-container"
      style={{
        position: 'fixed',
        top: buttonRect ? `${buttonRect.bottom + 4}px` : '0px',
        left: buttonRect ? `${buttonRect.left}px` : '0px',
        background: 'white',
        border: '1px solid #D1D5DB',
        borderRadius: '8px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
        padding: '16px',
        zIndex: 2147483647,
        width: '260px',
        maxWidth: '90vw',
        pointerEvents: 'auto'
      }}
    >
      {/* Colori Tema */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '8px', fontFamily: 'Inter, sans-serif' }}>
          Colori tema
        </div>
        
        {/* Colori base */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
          {themeColors.map((color, idx) => (
            <button
              key={idx}
              onClick={() => onSelectColor(color.base)}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                border: currentColor === color.base ? '2px solid #4FADFF' : '1px solid #D1D5DB',
                background: color.base,
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.15s ease',
                boxSizing: 'border-box',
                flexShrink: 0
              }}
              title={color.base}
            />
          ))}
        </div>
        
        {/* Sfumature - Colonne verticali */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {themeColors.map((colorGroup, groupIdx) => (
            <div key={groupIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
              {colorGroup.shades.map((shade, shadeIdx) => (
                <button
                  key={`${groupIdx}-${shadeIdx}`}
                  onClick={() => onSelectColor(shade)}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    border: currentColor === shade ? '2px solid #4FADFF' : '1px solid #E5E7EB',
                    background: shade,
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.15s ease',
                    boxSizing: 'border-box',
                    flexShrink: 0
                  }}
                  title={shade}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Colori Standard */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '8px', fontFamily: 'Inter, sans-serif' }}>
          Colori standard
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap' }}>
          {standardColors.map((color, idx) => (
            <button
              key={idx}
              onClick={() => onSelectColor(color)}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                border: currentColor === color ? '2px solid #4FADFF' : '1px solid #D1D5DB',
                background: color,
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.15s ease',
                boxSizing: 'border-box',
                flexShrink: 0
              }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  )
  
  // Usa React Portal per renderizzare il menu nel body
  return ReactDOM.createPortal(menuContent, document.body)
}

/**
 * Editor collaborativo real-time per documenti Office
 * Toolbar completa con tutte le funzionalità professionali
 */
function OfficeEditorRealtime({ document: officeDocument, appointmentId, userRole, currentUser, onClose }) {
  const [htmlContent, setHtmlContent] = useState('')
  const [metadata, setMetadata] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [connected, setConnected] = useState(false)
  const [isEditable, setIsEditable] = useState(true) // Se il documento può essere modificato
  const [viewMode, setViewMode] = useState('single') // 'single' | 'double' per visualizzazione pagine
  
  // Stati per color pickers custom
  const [showColorMenu, setShowColorMenu] = useState(null) // 'text' | 'background' | null
  const [currentTextColor, setCurrentTextColor] = useState('#EF4444')
  const [currentBgColor, setCurrentBgColor] = useState('#FFEB3B')
  const [colorButtonRect, setColorButtonRect] = useState(null)
  
  const quillRef = useRef(null)
  const wsRef = useRef(null)
  const debounceTimeout = useRef(null)
  const textColorBtnRef = useRef(null)
  const bgColorBtnRef = useRef(null)
  
  const isNotary = userRole === 'notaio' || userRole === 'notary' || userRole === 'admin'
  const documentId = officeDocument?.document_id || officeDocument?.id
  
  // Configurazione Quill toolbar PROFESSIONALE (stile Word) - Custom container nell'header
  const modules = {
    toolbar: {
      container: '#quill-toolbar-custom', // Toolbar custom nell'header
      handlers: {
        // Handlers personalizzati se necessario
      }
    },
    clipboard: {
      matchVisual: false,
    },
    history: {
      delay: 1000,
      maxStack: 50,
      userOnly: true
    }
  }
  
  const formats = [
    'font', 'size', 'header',
    'bold', 'italic', 'underline', 'strike', 'script',
    'color', 'background',
    'align', 'direction',
    'list', 'bullet', 'indent',
    'blockquote', 'code-block',
    'link', 'image'
  ]
  
  // Carica documento da backend
  const loadDocument = useCallback(async () => {
    if (!documentId) {
      console.error('❌ Document ID mancante')
      setLoading(false)
      return
    }
    
    try {
      const token = authService.getAccessToken()
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      
      const response = await fetch(
        `${baseURL}/api/documents/office/${documentId}/to-html/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setHtmlContent(data.html)
        setMetadata(data.metadata)
        setIsEditable(true)
        console.log('✅ Documento caricato:', data.filename)
      } else {
        // Documento non editabile (formato non supportato, errore, ecc.)
        setIsEditable(false)
        
        // Se c'è HTML (es. messaggio formattato per formato non supportato), mostralo
        if (data.html) {
          setHtmlContent(data.html)
        } else {
          setHtmlContent(`<p style="padding: 20px; text-align: center;">⚠️ ${data.error || 'Errore sconosciuto'}</p>`)
        }
        console.warn('⚠️ Documento non caricabile:', data.error)
      }
    } catch (error) {
      console.error('❌ Errore caricamento documento:', error)
      setHtmlContent(`<p style="padding: 20px; text-align: center;">❌ Errore: ${error.message}</p>`)
      setIsEditable(false)
    } finally {
      setLoading(false)
    }
  }, [documentId])
  
  // Connetti WebSocket per sincronizzazione real-time
  const connectWebSocket = useCallback(() => {
    if (!appointmentId || !documentId) return
    
    const token = authService.getAccessToken()
    const wsURL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000'
    const url = `${wsURL}/ws/office/${appointmentId}/`
    
    console.log('🔌 Connessione WebSocket Office Editor...')
    
    const ws = new WebSocket(url)
    wsRef.current = ws
    
    ws.onopen = () => {
      console.log('✅ WebSocket Office connesso')
      setConnected(true)
      
      // Invia messaggio di join
      ws.send(JSON.stringify({
        type: 'JOIN_OFFICE_EDITING',
        document_id: documentId,
        user: {
          id: currentUser?.id,
          name: currentUser?.name || 'Utente',
          role: userRole
        }
      }))
    }
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📨 WebSocket message:', data.type)
        
        switch (data.type) {
          case 'OFFICE_CONTENT_UPDATE':
            // Aggiorna contenuto da altri utenti
            if (data.user_id !== currentUser?.id) {
              setHtmlContent(data.html)
            }
            break
          
          case 'OFFICE_USERS_LIST':
            // Info utenti attivi (non visualizzata per ora)
            break
          
          case 'OFFICE_USER_JOINED':
            console.log(`👋 ${data.user.name} è entrato nell'editor`)
            break
          
          case 'OFFICE_USER_LEFT':
            console.log(`👋 ${data.user.name} ha lasciato l'editor`)
            break
        }
      } catch (error) {
        console.error('❌ Errore parsing WebSocket:', error)
      }
    }
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error)
      setConnected(false)
    }
    
    ws.onclose = () => {
      console.log('🔌 WebSocket Office disconnesso')
      setConnected(false)
    }
  }, [appointmentId, documentId, currentUser, userRole])
  
  // Broadcast cambio contenuto
  const broadcastContentChange = useCallback((newHtml) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'OFFICE_CONTENT_UPDATE',
        document_id: documentId,
        html: newHtml,
        user_id: currentUser?.id
      }))
    }
  }, [documentId, currentUser])
  
  // Handle cambio contenuto (con debounce per performance)
  const handleContentChange = (content, delta, source, editor) => {
    setHtmlContent(content)
    
    // Debounce broadcast (500ms)
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }
    
    debounceTimeout.current = setTimeout(() => {
      broadcastContentChange(content)
    }, 500)
  }
  
  // Salva documento
  const handleSave = async () => {
    if (!isNotary) {
      alert('Solo i notai possono salvare modifiche')
      return
    }
    
    setSaving(true)
    
    try {
      const token = authService.getAccessToken()
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      
      const response = await fetch(
        `${baseURL}/api/documents/office/${documentId}/save/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            html: htmlContent,
            metadata: metadata
          })
        }
      )
      
      const data = await response.json()
      
      if (data.success) {
        alert(`✅ Documento salvato: ${data.filename}`)
      } else {
        alert(`❌ Errore salvataggio: ${data.error}`)
      }
    } catch (error) {
      console.error('❌ Errore salvataggio:', error)
      alert(`❌ Errore: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }
  
  // Download documento
  const handleDownload = async () => {
    try {
      const token = authService.getAccessToken()
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      
      const response = await fetch(
        `${baseURL}/api/documents/office/${documentId}/download/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = officeDocument?.filename || 'document.docx'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('❌ Errore download:', error)
      alert(`❌ Errore: ${error.message}`)
    }
  }
  
  // Stampa documento
  const handlePrint = () => {
    const editor = quillRef.current?.getEditor()
    if (!editor) return
    
    const htmlContent = editor.root.innerHTML
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${officeDocument?.filename || 'Documento'}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; line-height: 1.6; }
            h1, h2, h3 { margin-top: 24px; margin-bottom: 12px; }
            p { margin: 12px 0; }
            table { border-collapse: collapse; width: 100%; margin: 16px 0; }
            table td, table th { border: 1px solid #ddd; padding: 8px; }
            @media print {
              body { margin: 0; padding: 20px; }
            }
          </style>
        </head>
        <body>${htmlContent}</body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
  
  // Copia contenuto
  const handleCopy = () => {
    const editor = quillRef.current?.getEditor()
    if (!editor) return
    
    const text = editor.getText()
    navigator.clipboard.writeText(text).then(() => {
      alert('✅ Contenuto copiato negli appunti!')
    }).catch(() => {
      alert('❌ Errore copia')
    })
  }
  
  // Gestione color pickers custom
  const handleColorButtonClick = (type) => {
    console.log('🎨 Click su pulsante colore:', type, 'Stato attuale:', showColorMenu)
    
    // Calcola coordinate del pulsante
    const btnRef = type === 'text' ? textColorBtnRef : bgColorBtnRef
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      console.log('📍 Coordinate pulsante:', rect)
      setColorButtonRect(rect)
    }
    
    setShowColorMenu(showColorMenu === type ? null : type)
  }
  
  const handleColorSelect = (color, type) => {
    const editor = quillRef.current?.getEditor()
    if (!editor) return
    
    if (type === 'text') {
      editor.format('color', color)
      setCurrentTextColor(color)
      document.documentElement.style.setProperty('--ql-text-color', color)
    } else {
      editor.format('background', color)
      setCurrentBgColor(color)
      document.documentElement.style.setProperty('--ql-bg-color', color)
    }
    
    setShowColorMenu(null)
  }
  
  // Chiudi menu colori se si clicca fuori
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Verifica se il click è su un pulsante color
      const isColorButton = e.target.closest('.custom-color-btn')
      if (isColorButton) return
      
      // Verifica se il click è dentro il menu colori
      const isInsideMenu = e.target.closest('.color-menu-container')
      if (isInsideMenu) return
      
      // Altrimenti chiudi il menu
      console.log('🔒 Chiudo menu colori (click fuori)')
      setShowColorMenu(null)
    }
    
    if (showColorMenu) {
      console.log('✅ Menu colori aperto:', showColorMenu)
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 0)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showColorMenu])
  
  // Undo/Redo
  const handleUndo = () => {
    const editor = quillRef.current?.getEditor()
    if (editor) editor.history.undo()
  }
  
  const handleRedo = () => {
    const editor = quillRef.current?.getEditor()
    if (editor) editor.history.redo()
  }
  
  // ✅ Tabelle: Quill nativo supporta tabelle tramite paste da Word/Excel
  
  // Aumenta/Diminuisci dimensione font
  const handleIncreaseFontSize = () => {
    const editor = quillRef.current?.getEditor()
    if (!editor) return
    
    const selection = editor.getSelection()
    if (!selection) return
    
    const format = editor.getFormat(selection)
    const currentSize = format.size || '14px'
    const sizeValue = parseInt(currentSize)
    
    const sizes = [10, 12, 14, 16, 18, 20, 24, 32, 48]
    const currentIndex = sizes.findIndex(s => s >= sizeValue)
    const nextIndex = Math.min(currentIndex + 1, sizes.length - 1)
    
    editor.format('size', `${sizes[nextIndex]}px`)
  }
  
  const handleDecreaseFontSize = () => {
    const editor = quillRef.current?.getEditor()
    if (!editor) return
    
    const selection = editor.getSelection()
    if (!selection) return
    
    const format = editor.getFormat(selection)
    const currentSize = format.size || '14px'
    const sizeValue = parseInt(currentSize)
    
    const sizes = [10, 12, 14, 16, 18, 20, 24, 32, 48]
    const currentIndex = sizes.findIndex(s => s >= sizeValue)
    const prevIndex = Math.max(currentIndex - 1, 0)
    
    editor.format('size', `${sizes[prevIndex]}px`)
  }
  
  // Cambia maiuscole/minuscole
  const handleChangeCase = () => {
    const editor = quillRef.current?.getEditor()
    if (!editor) return
    
    const selection = editor.getSelection()
    if (!selection || selection.length === 0) return
    
    const text = editor.getText(selection.index, selection.length)
    
    // Ciclo: minuscolo → MAIUSCOLO → Maiuscola Iniziale → minuscolo
    let newText
    if (text === text.toLowerCase()) {
      newText = text.toUpperCase() // tutto maiuscolo
    } else if (text === text.toUpperCase()) {
      newText = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() // Iniziale maiuscola
    } else {
      newText = text.toLowerCase() // tutto minuscolo
    }
    
    editor.deleteText(selection.index, selection.length)
    editor.insertText(selection.index, newText)
    editor.setSelection(selection.index, newText.length)
  }
  
  // 📝 Selezione riga con click sul margine sinistro (come Word)
  useEffect(() => {
    if (!quillRef.current) return

    const editor = quillRef.current.getEditor()
    const editorContainer = document.querySelector('.ql-editor')
    if (!editorContainer) return

    const handleEditorClick = (e) => {
      // Calcola la distanza dal bordo sinistro del container
      const rect = editorContainer.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      
      // Se il click è nel margine sinistro (primi 25px)
      if (clickX >= 0 && clickX <= 25) {
        e.preventDefault()
        e.stopPropagation()
        
        // Usa le coordinate Y per trovare la posizione nel documento
        const clickY = e.clientY
        
        // Crea un punto temporaneo per ottenere l'indice alla posizione Y
        const tempX = rect.left + 40 // Dentro il testo
        let index = 0
        
        try {
          // Usa caretPositionFromPoint o caretRangeFromPoint per trovare la posizione
          if (document.caretPositionFromPoint) {
            const position = document.caretPositionFromPoint(tempX, clickY)
            if (position) {
              // Naviga dal nodo al Quill per ottenere l'indice
              const blot = Quill.find(position.offsetNode)
              if (blot) {
                index = editor.getIndex(blot)
              }
            }
          } else if (document.caretRangeFromPoint) {
            const range = document.caretRangeFromPoint(tempX, clickY)
            if (range) {
              const blot = Quill.find(range.startContainer)
              if (blot) {
                index = editor.getIndex(blot)
              }
            }
          }
        } catch (err) {
          console.warn('Errore nella ricerca della posizione:', err)
          return
        }
        
        // Ottieni la riga all'indice trovato
        const [line] = editor.getLine(index)
        if (!line) return
        
        const lineIndex = editor.getIndex(line)
        const lineLength = line.length()
        
        // Seleziona l'intera riga (escludi il newline finale)
        editor.setSelection(lineIndex, Math.max(0, lineLength - 1))
        
        console.log(`✅ Selezionata riga: index ${lineIndex}, length ${lineLength}`)
      }
    }

    editorContainer.addEventListener('click', handleEditorClick)

    return () => {
      editorContainer.removeEventListener('click', handleEditorClick)
    }
  }, [loading])

  // Lifecycle
  useEffect(() => {
    loadDocument()
  }, [loadDocument])
  
  // 🎨 Sostituisce gli SVG di Quill con le icone Font Awesome
  useEffect(() => {
    if (!quillRef.current || loading) return

    const replaceIconsWithFontAwesome = () => {
      const toolbarEl = document.querySelector('.ql-toolbar')
      if (!toolbarEl) {
        console.warn('⚠️ Toolbar non trovata, retry...')
        return
      }

      console.log('🎨 INIZIO SOSTITUZIONE ICONE QUILL → FONT AWESOME')

      const iconMap = {
        // Formattazione testo - Bold e Italic con size ridotto per bilanciare
        '.ql-bold': { icon: FaBold, name: 'Bold', size: 11 },
        '.ql-italic': { icon: FaItalic, name: 'Italic', size: 10 },
        '.ql-underline': { icon: FaUnderline, name: 'Underline' },
        '.ql-strike': { icon: FaStrikethrough, name: 'Strikethrough' },
        // Script
        '.ql-script[value="sub"]': { icon: FaSubscript, name: 'Subscript' },
        '.ql-script[value="super"]': { icon: FaSuperscript, name: 'Superscript' },
        // Colori
        'button.ql-textColor': { icon: FaFont, name: 'Text Color' },
        'button.ql-highlightColor': { icon: FaHighlighter, name: 'Highlighter' },
        // Allineamento
        '.ql-align[value=""]': { icon: FaAlignLeft, name: 'Align Left' },
        '.ql-align[value="center"]': { icon: FaAlignCenter, name: 'Align Center' },
        '.ql-align[value="right"]': { icon: FaAlignRight, name: 'Align Right' },
        '.ql-align[value="justify"]': { icon: FaAlignJustify, name: 'Align Justify' },
        // Liste
        '.ql-list[value="ordered"]': { icon: FaListOl, name: 'Numbered List' },
        '.ql-list[value="bullet"]': { icon: FaListUl, name: 'Bullet List' },
        // Indentazione
        '.ql-indent[value="-1"]': { icon: FaOutdent, name: 'Outdent' },
        '.ql-indent[value="+1"]': { icon: FaIndent, name: 'Indent' }
      }

      let replacedCount = 0

      Object.entries(iconMap).forEach(([selector, config]) => {
        const { icon: IconComponent, name, size = 14 } = config
        const button = toolbarEl.querySelector(selector)
        if (button) {
          // Rimuovi SVG di Quill
          const quillSvg = button.querySelector('svg')
          if (quillSvg) {
            quillSvg.remove()
            console.log(`🗑️ Rimosso SVG Quill per: ${name}`)
          }

          // Crea container per React icon
          const iconContainer = document.createElement('span')
          iconContainer.className = 'fa-icon-container'
          
          // Render React icon usando ReactDOM con size personalizzato
          const root = ReactDOM.createRoot(iconContainer)
          root.render(React.createElement(IconComponent, { 
            size: size
          }))
          
          button.appendChild(iconContainer)
          replacedCount++
          
          console.log(`✅ Sostituita icona ${name}: ${selector}`)
        } else {
          console.warn(`⚠️ Pulsante non trovato: ${selector}`)
        }
      })

      console.log(`✅✅✅ SOSTITUZIONE COMPLETATA: ${replacedCount}/17 icone Quill toolbar`)
      console.log(`✅ Icone azioni rapide (Undo, Redo, Copy, Print, Save, Download) già presenti nel JSX con Font Awesome`)
    }

    // Esegui dopo che Quill ha renderizzato la toolbar
    const timer = setTimeout(replaceIconsWithFontAwesome, 500)
    return () => clearTimeout(timer)
  }, [loading])
  
  useEffect(() => {
    connectWebSocket()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [connectWebSocket])
  
  // Aggiorna colori delle barre nei color pickers custom quando cambiano
  useEffect(() => {
    const updateColorBars = () => {
      const editor = quillRef.current?.getEditor()
      if (!editor) return
      
      const selection = editor.getSelection()
      if (!selection) return
      
      const format = editor.getFormat(selection)
      
      // Aggiorna colore testo negli stati custom
      const textColor = format.color || '#EF4444'
      setCurrentTextColor(textColor)
      
      // Aggiorna colore evidenziatore negli stati custom
      const bgColor = format.background || '#FFEB3B'
      setCurrentBgColor(bgColor)
    }
    
    const editor = quillRef.current?.getEditor()
    if (editor) {
      editor.on('selection-change', updateColorBars)
      updateColorBars() // Prima inizializzazione
      
      return () => {
        editor.off('selection-change', updateColorBars)
      }
    }
  }, [quillRef.current])
  
  // Sposta FISICAMENTE i dropdown di Quill nel body per bypassare overflow: hidden
  useEffect(() => {
    const movedDropdowns = new Map() // picker -> {options, originalParent}
    let debugClickAdded = false
    
    // Aggiungi listener di debug sui picker
    const addDebugListeners = () => {
      if (debugClickAdded) return
      
      const allPickers = document.querySelectorAll('.office-editor-container .ql-picker')
      allPickers.forEach(picker => {
        picker.addEventListener('click', (e) => {
          console.log('🖱️ CLICK su picker:', picker.className)
          console.log('   - Ha .ql-expanded?', picker.classList.contains('ql-expanded'))
          const options = picker.querySelector('.ql-picker-options')
          console.log('   - Options trovate?', !!options)
          if (options) {
            console.log('   - Options display:', window.getComputedStyle(options).display)
            console.log('   - Options position:', window.getComputedStyle(options).position)
            console.log('   - Options visibility:', window.getComputedStyle(options).visibility)
            console.log('   - Numero items:', options.children.length)
          }
        })
      })
      debugClickAdded = true
    }
    
    const checkAndMoveDropdowns = () => {
      // Aggiungi debug listeners se non fatto
      addDebugListeners()
      
      const expandedPickers = document.querySelectorAll('.office-editor-container .ql-picker.ql-expanded')
      
      expandedPickers.forEach(picker => {
        const options = picker.querySelector('.ql-picker-options')
        if (!options || movedDropdowns.has(picker)) return
        
        console.log('🔄 Spostamento FISICO dropdown nel body:', picker.className)
        
        // Salva il parent originale
        const originalParent = options.parentNode
        movedDropdowns.set(picker, { options, originalParent })
        
        // Calcola posizione
        const rect = picker.getBoundingClientRect()
        
        // Rimuovi dal parent originale e sposta nel body
        options.remove()
        document.body.appendChild(options)

        // Usa requestAnimationFrame per assicurarti che il DOM sia aggiornato
        requestAnimationFrame(() => {
          // Determina la larghezza in base al tipo di picker
          const isSizePicker = picker.classList.contains('ql-size')
          const dropdownWidth = isSizePicker ? '100px' : '220px'
          
          // Applica stili FIXED con z-index altissimo e dimensioni FORZATE
          // ⚠️ IMPORTANTE: Uso setProperty con priority 'important' per forzare TUTTO
          options.style.setProperty('position', 'fixed', 'important')
          options.style.setProperty('top', `${rect.bottom + 4}px`, 'important')
          options.style.setProperty('left', `${rect.left}px`, 'important')
          options.style.setProperty('width', dropdownWidth, 'important')
          options.style.setProperty('min-width', dropdownWidth, 'important')
          options.style.setProperty('max-width', '400px', 'important')
          options.style.setProperty('pointer-events', 'auto', 'important')
          options.style.setProperty('z-index', '2147483647', 'important')
          options.style.setProperty('display', 'block', 'important')
          options.style.setProperty('visibility', 'visible', 'important')
          options.style.setProperty('opacity', '1', 'important')
          options.style.setProperty('background', 'white', 'important')
          options.style.setProperty('border', '1px solid #D1D5DB', 'important')
          options.style.setProperty('border-radius', '8px', 'important')
          options.style.setProperty('box-shadow', '0 10px 40px rgba(0, 0, 0, 0.3)', 'important')
          options.style.setProperty('padding', '8px', 'important')
          options.style.setProperty('max-height', '350px', 'important')
          options.style.setProperty('overflow-y', 'auto', 'important')
          options.style.setProperty('overflow-x', 'visible', 'important')
        
          // Forza gli stili su tutti gli item + hover effects
          const items = options.querySelectorAll('.ql-picker-item')
          console.log(`🔍 Trovati ${items.length} item nel dropdown`)
          
          items.forEach((item, index) => {
            // ⚠️ CRITICO: Gli item di Quill sono VUOTI! Devo aggiungere il testo manualmente
            const label = item.getAttribute('data-label') || item.getAttribute('data-value') || item.textContent
            if (label && !item.textContent) {
              item.textContent = label
              console.log(`   ✏️ Aggiunto testo "${label}" all'item ${index}`)
            }
            
            // Forza OGNI SINGOLO stile con setProperty
            item.style.setProperty('padding', '8px 12px', 'important')
            item.style.setProperty('cursor', 'pointer', 'important')
            item.style.setProperty('font-size', '13px', 'important')
            item.style.setProperty('color', '#000000', 'important') // Nero assoluto!
            item.style.setProperty('display', 'block', 'important')
            item.style.setProperty('width', '100%', 'important')
            item.style.setProperty('border-radius', '4px', 'important')
            item.style.setProperty('transition', 'background 0.15s ease', 'important')
            item.style.setProperty('background', 'transparent', 'important')
            item.style.setProperty('visibility', 'visible', 'important')
            item.style.setProperty('opacity', '1', 'important')
            
            // Debug: verifica stili applicati
            const computedStyle = window.getComputedStyle(item)
            console.log(`   Item ${index}: "${item.textContent || item.getAttribute('data-value')}"`)
            console.log(`      color: ${computedStyle.color}`)
            console.log(`      display: ${computedStyle.display}`)
            console.log(`      visibility: ${computedStyle.visibility}`)
            console.log(`      opacity: ${computedStyle.opacity}`)
            console.log(`      width: ${computedStyle.width}`)
            console.log(`      height: ${computedStyle.height}`)
            console.log(`      font-size: ${computedStyle.fontSize}`)
            console.log(`      line-height: ${computedStyle.lineHeight}`)
            console.log(`      padding: ${computedStyle.padding}`)
            console.log(`      margin: ${computedStyle.margin}`)
            console.log(`      position: ${computedStyle.position}`)
            console.log(`      transform: ${computedStyle.transform}`)
            console.log(`      clip-path: ${computedStyle.clipPath}`)

            // Hover effect
            item.addEventListener('mouseenter', () => {
              item.style.setProperty('background', '#F3F4F6', 'important')
            })
            item.addEventListener('mouseleave', () => {
              item.style.setProperty('background', 'transparent', 'important')
            })
          })
        
          console.log('✅ Dropdown spostato nel body, posizione:', { 
            top: rect.bottom + 4, 
            left: rect.left,
            width: rect.width,
            itemCount: options.children.length,
            itemsHTML: Array.from(options.children).map(c => c.textContent || c.getAttribute('data-value')),
            isInBody: options.parentElement === document.body,
            computedDisplay: window.getComputedStyle(options).display,
            computedVisibility: window.getComputedStyle(options).visibility,
            computedZIndex: window.getComputedStyle(options).zIndex,
            computedWidth: window.getComputedStyle(options).width
          })
          
          // Verifica visibilità dopo 100ms
          setTimeout(() => {
            const stillInBody = document.body.contains(options)
            console.log('🔍 Verifica dropdown dopo 100ms:', {
              stillInBody,
              display: options.style.display,
              visibility: options.style.visibility,
              position: options.style.position,
              zIndex: options.style.zIndex,
              top: options.style.top,
              left: options.style.left,
              width: options.style.width,
              computedWidth: window.getComputedStyle(options).width
            })
          }, 100)
        })
        
        // Chiudi dropdown se si clicca fuori
        const closeHandler = (e) => {
          if (!options.contains(e.target) && !picker.contains(e.target)) {
            console.log('🚪 Chiusura dropdown (click esterno)')

            // Rimuovi dal body e rimetti nel parent originale
            options.remove()
            const data = movedDropdowns.get(picker)
            if (data && data.originalParent) {
              data.originalParent.appendChild(options)
            }
            movedDropdowns.delete(picker)

            // Reset stili
            options.style.cssText = ''

            picker.classList.remove('ql-expanded')
            document.removeEventListener('mousedown', closeHandler, true)
          }
        }

        // Gestisci la selezione di un item
        const itemClickHandler = (e) => {
          const item = e.target.closest('.ql-picker-item')
          if (item) {
            console.log('🖱️ Item selezionato:', item.dataset.value || item.textContent)

            // Lascia che Quill gestisca il click normalmente
            // Poi chiudi e ripristina
            setTimeout(() => {
              options.remove()
              const data = movedDropdowns.get(picker)
              if (data && data.originalParent) {
                data.originalParent.appendChild(options)
              }
              movedDropdowns.delete(picker)
              options.style.cssText = ''
              picker.classList.remove('ql-expanded')
              document.removeEventListener('mousedown', closeHandler, true)
            }, 50)
          }
        }

        options.addEventListener('click', itemClickHandler, { once: false })
        setTimeout(() => {
          document.addEventListener('mousedown', closeHandler, true)
        }, 100)
      })
      
      // Pulisci dropdown che non sono più expanded
      movedDropdowns.forEach((data, picker) => {
        if (!picker.classList.contains('ql-expanded')) {
          console.log('🧹 Pulizia dropdown chiuso')
          data.options.remove()
          if (data.originalParent) {
            data.originalParent.appendChild(data.options)
          }
          data.options.style.cssText = ''
          movedDropdowns.delete(picker)
        }
      })
    }
    
    // Controlla ogni 50ms se ci sono dropdown aperti
    const intervalId = setInterval(checkAndMoveDropdowns, 50)
    
    return () => {
      clearInterval(intervalId)
      // Ripristina tutti i dropdown spostati
      movedDropdowns.forEach((data, picker) => {
        data.options.remove()
        if (data.originalParent) {
          data.originalParent.appendChild(data.options)
        }
        data.options.style.cssText = ''
      })
      movedDropdowns.clear()
    }
  }, [quillRef.current])
  
  if (loading) {
    return (
      <div className="office-editor-loading">
        <Loader className="spinner" size={48} />
        <p>Caricamento documento...</p>
      </div>
    )
  }
  
  // Se il documento non è editabile (formato non supportato), mostra solo il messaggio
  if (!isEditable) {
    return (
      <div className="office-editor-container">
        <div className="office-editor-content" style={{ padding: '20px', overflow: 'auto' }}>
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      </div>
    )
  }
  
  return (
    <div className="office-editor-container">
      {/* Toolbar superiore - Integrata con Quill */}
      <div className="office-editor-toolbar">
        {/* Toolbar Quill custom integrata - TUTTO SU UNA RIGA stile Word */}
        <div id="quill-toolbar-custom" className="ql-toolbar ql-snow">
          {/* Font & Size */}
          <select className="ql-font" defaultValue="arial">
            <option value="arial">Arial</option>
            <option value="courier">Courier</option>
            <option value="georgia">Georgia</option>
            <option value="times">Times</option>
            <option value="verdana">Verdana</option>
            <option value="tahoma">Tahoma</option>
            <option value="trebuchet">Trebuchet</option>
            <option value="comic-sans">Comic Sans</option>
          </select>
          <select className="ql-size" defaultValue="14px">
            <option value="10px">10</option>
            <option value="12px">12</option>
            <option value="14px">14</option>
            <option value="16px">16</option>
            <option value="18px">18</option>
            <option value="20px">20</option>
            <option value="24px">24</option>
            <option value="32px">32</option>
            <option value="48px">48</option>
          </select>
          
          {/* Aumenta/Diminuisci Font + Maiuscole */}
          {isNotary && (
            <>
              <button 
                className="font-size-increase"
                onClick={handleIncreaseFontSize}
                title="Aumenta dimensione font"
                type="button"
              >
                <span className="letter">A</span>
                <span className="symbol">+</span>
              </button>
              
              <button 
                className="font-size-decrease"
                onClick={handleDecreaseFontSize}
                title="Diminuisci dimensione font"
                type="button"
              >
                <span className="letter">A</span>
                <span className="symbol">−</span>
              </button>
              
              <button 
                className="change-case"
                onClick={handleChangeCase}
                title="Cambia maiuscole/minuscole"
                type="button"
              >
                <span>Aa</span>
              </button>
            </>
          )}
          
          {/* Formattazione base */}
          <button className="ql-bold" title="Grassetto"></button>
          <button className="ql-italic" title="Corsivo"></button>
          <button className="ql-underline" title="Sottolineato"></button>
          <button className="ql-strike" title="Barrato"></button>
          
          {/* Script */}
          <button className="ql-script" value="sub" title="Pedice"></button>
          <button className="ql-script" value="super" title="Apice"></button>
          
          {/* Colori - Custom buttons */}
          <div style={{ position: 'relative', display: 'inline-block', marginRight: '4px' }}>
            <button 
              ref={textColorBtnRef}
              className="custom-color-btn"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleColorButtonClick('text')
              }}
              title="Colore testo"
              type="button"
              style={{
                width: '32px',
                height: '32px',
                padding: 0,
                border: showColorMenu === 'text' ? '1px solid #4FADFF' : '1px solid transparent',
                borderRadius: '6px',
                background: showColorMenu === 'text' ? '#DBEAFE' : 'transparent',
                color: '#4B5563',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
                pointerEvents: 'auto'
              }}
            >
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <FaFont size={14} style={{ color: '#444444', marginBottom: '2px' }} />
                <span style={{ width: '18px', height: '3px', background: currentTextColor, position: 'absolute', bottom: '-2px' }}></span>
              </div>
            </button>
            
            {showColorMenu === 'text' && (
              <ColorMenu
                onSelectColor={(color) => handleColorSelect(color, 'text')}
                currentColor={currentTextColor}
                buttonRect={colorButtonRect}
              />
            )}
          </div>
          
          <div style={{ position: 'relative', display: 'inline-block', marginRight: '4px' }}>
            <button 
              ref={bgColorBtnRef}
              className="custom-color-btn"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleColorButtonClick('background')
              }}
              title="Colore evidenziatore"
              type="button"
              style={{
                width: '32px',
                height: '32px',
                padding: 0,
                border: showColorMenu === 'background' ? '1px solid #4FADFF' : '1px solid transparent',
                borderRadius: '6px',
                background: showColorMenu === 'background' ? '#DBEAFE' : 'transparent',
                color: '#4B5563',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
                pointerEvents: 'auto'
              }}
            >
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <FaHighlighter size={14} style={{ color: '#444444', marginBottom: '2px' }} />
                <span style={{ width: '18px', height: '3px', background: currentBgColor, position: 'absolute', bottom: '-2px' }}></span>
              </div>
            </button>
            
            {showColorMenu === 'background' && (
              <ColorMenu
                onSelectColor={(color) => handleColorSelect(color, 'background')}
                currentColor={currentBgColor}
                buttonRect={colorButtonRect}
              />
            )}
          </div>
          
          {/* Allineamento */}
          {isNotary && (
            <>
              <button className="ql-align" value="" title="Allinea a sinistra"></button>
              <button className="ql-align" value="center" title="Allinea al centro"></button>
              <button className="ql-align" value="right" title="Allinea a destra"></button>
              <button className="ql-align" value="justify" title="Giustifica"></button>
            </>
          )}
          
          {/* Liste */}
          <button className="ql-list" value="ordered" title="Elenco numerato"></button>
          <button className="ql-list" value="bullet" title="Elenco puntato"></button>
          
          {/* Indentazione */}
          <button className="ql-indent" value="-1" title="Riduci rientro"></button>
          <button className="ql-indent" value="+1" title="Aumenta rientro"></button>
        </div>
        
        {/* Azioni rapide a destra */}
        <div className="toolbar-right">
          {/* Azioni quick */}
          {isNotary && (
            <>
              <button 
                className="toolbar-btn-icon professional-icon"
                onClick={handleUndo}
                title="Annulla (Ctrl+Z)"
              >
                <FaUndo size={20} />
              </button>
              
              <button 
                className="toolbar-btn-icon professional-icon"
                onClick={handleRedo}
                title="Ripeti (Ctrl+Y)"
              >
                <FaRedo size={20} />
              </button>
              
              <div className="toolbar-separator"></div>
            </>
          )}
          
          {/* Toggle visualizzazione pagine */}
          <button 
            className={`toolbar-btn-icon professional-icon ${viewMode === 'single' ? 'active' : ''}`}
            onClick={() => setViewMode('single')}
            title="Visualizzazione pagina singola"
          >
            <FaFile size={18} />
          </button>
          
          <button 
            className={`toolbar-btn-icon professional-icon ${viewMode === 'double' ? 'active' : ''}`}
            onClick={() => setViewMode('double')}
            title="Visualizzazione pagina doppia"
          >
            <FaColumns size={18} />
          </button>
          
          <div className="toolbar-separator"></div>
          
          <button 
            className="toolbar-btn-icon professional-icon"
            onClick={handleCopy}
            title="Copia contenuto"
          >
            <FaCopy size={20} />
          </button>
          
          <button 
            className="toolbar-btn-icon professional-icon"
            onClick={handlePrint}
            title="Stampa"
          >
            <FaPrint size={20} />
          </button>
          
          <div className="toolbar-separator"></div>
          
          {/* Pulsanti azioni principali */}
          {isNotary && (
            <button 
              className="toolbar-btn save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader className="spinner-sm" size={18} /> : <FaSave size={18} />}
              {saving ? 'Salvataggio...' : 'Salva'}
            </button>
          )}
          
          <button 
            className="toolbar-btn"
            onClick={handleDownload}
          >
            <FaDownload size={18} />
            Scarica
          </button>
        </div>
      </div>
      
      {/* Editor Quill */}
      <div className={`office-editor-content view-mode-${viewMode}`}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={htmlContent}
          onChange={handleContentChange}
          modules={modules}
          formats={formats}
          readOnly={!isNotary}
          placeholder="Inizia a scrivere..."
        />
      </div>
      
      {/* Status bar */}
      <div className="office-editor-footer">
        <span>
          {metadata.paragraphs_count && `📄 ${metadata.paragraphs_count} paragrafi`}
        </span>
        {isNotary ? (
          <span className="edit-mode">✏️ Modalità Modifica</span>
        ) : (
          <span className="view-mode">👁️ Modalità Lettura</span>
        )}
      </div>
    </div>
  )
}

export default OfficeEditorRealtime

