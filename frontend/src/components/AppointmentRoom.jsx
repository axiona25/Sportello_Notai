import React, { useState, useEffect, useRef, useCallback } from 'react'
import { X, Maximize2, Minus, Video, VideoOff, Mic, MicOff, Phone, Monitor, MessageSquare, Users, Clock, LogIn, Edit, Trash2, FileText, Lock, Unlock, Share2, PenTool, Archive, Mail } from 'lucide-react'
import { useAppointmentRoom } from '../contexts/AppointmentRoomContext'
import authService from '../services/authService'
import ConfirmExitAppointmentModal from './ConfirmExitAppointmentModal'
import AcceptGuestModal from './AcceptGuestModal'
import CollaborativePDFViewer from './CollaborativePDFViewer'
import './AppointmentRoom.css'

function AppointmentRoom() {
  const { activeAppointment, isMinimized, isFloating, exitAppointment, minimizeAppointment, toggleFloating } = useAppointmentRoom()
  const [connectionStatus, setConnectionStatus] = useState('waiting') // 'waiting', 'connected'
  const [showExitModal, setShowExitModal] = useState(false)
  const [showAcceptGuestModal, setShowAcceptGuestModal] = useState(false)
  const [isClientAccepted, setIsClientAccepted] = useState(false) // Traccia se il cliente è stato accettato
  
  // Stati controlli partecipante (per notaio)
  const [isClientCameraForced, setIsClientCameraForced] = useState(false) // Camera sempre attiva
  const [isClientMicForced, setIsClientMicForced] = useState(false) // Microfono sempre attivo
  
  // Stati lettore PDF collaborativo
  const [showPDFViewer, setShowPDFViewer] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)
  
  // WebSocket per sincronizzazione generale video call
  const wsVideoCallRef = useRef(null)
  
  // Stati controlli video
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isMicOn, setIsMicOn] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [mediaStream, setMediaStream] = useState(null)
  
  // Timer chiamata
  const [callDuration, setCallDuration] = useState(0)
  
  // Documenti appuntamento
  const [documenti, setDocumenti] = useState([])
  
  // Ref per video element
  const videoRef = useRef(null)
  
  // Stati per drag and drop
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const [size, setSize] = useState({ width: 1400, height: 1100 })
  
  // Refs per gestire drag e resize
  const isDraggingRef = useRef(false)
  const isResizingRef = useRef(false)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const resizeDataRef = useRef({ direction: null, startX: 0, startY: 0, startWidth: 0, startHeight: 0, startPosX: 0, startPosY: 0 })
  const rafIdRef = useRef(null)
  
  const floatingRef = useRef(null)

  useEffect(() => {
    if (activeAppointment) {
      // 🔑 LEGGI IL RUOLO DALLA SESSIONE CORRENTE (JWT Token / localStorage)
      // NON dall'appointment (che non contiene userRole!)
      const userRole = authService.getUserRole()
      
      console.log('🎯 AppointmentRoom - Ruolo dalla SESSIONE CORRENTE:', userRole)
      console.log('📊 AppointmentRoom - Appointment:', activeAppointment.id)
      
      // REGOLA FONDAMENTALE:
      // - Notaio/Admin → Video chiamata DIRETTA (possono accettare ospiti)
      // - Cliente/Partner → CONTROLLA se già accettato, altrimenti SALA D'ATTESA
      
      if (userRole === 'notaio' || userRole === 'notary' || userRole === 'admin') {
        console.log('✅ Notaio/Admin → Entra direttamente nella video chiamata')
        setConnectionStatus('connected')
        // ✅ Attiva IMMEDIATAMENTE camera e microfono per il notaio
        setIsCameraOn(true)
        setIsMicOn(true)
        console.log('📹 Camera e microfono attivati IMMEDIATAMENTE per notaio/admin')
        
        // ⚡ AVVIA LO STREAM IMMEDIATAMENTE per il notaio (stessa ottimizzazione del cliente)
        const startStreamImmediately = async () => {
          try {
            console.log('🎥🎥🎥 [NOTAIO] AVVIO IMMEDIATO dello stream (senza aspettare re-render)')
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { width: 1280, height: 720 },
              audio: true
            })
            console.log('✅✅✅ [NOTAIO] Stream ottenuto IMMEDIATAMENTE:', stream)
            setMediaStream(stream)
            
            // ⚡ Attendi che videoRef sia disponibile con retry
            let retries = 0
            const maxRetries = 10
            
            const assignStreamToVideo = () => {
              if (videoRef.current) {
                console.log('✅ [NOTAIO] videoRef disponibile, assegno stream')
                videoRef.current.srcObject = stream
                videoRef.current.play().then(() => {
                  console.log('✅✅✅ [NOTAIO] Video avviato IMMEDIATAMENTE')
                }).catch((playError) => {
                  console.warn('⚠️ [NOTAIO] Errore play (normale):', playError)
                })
              } else if (retries < maxRetries) {
                retries++
                console.log(`⏳ [NOTAIO] videoRef non ancora disponibile, retry ${retries}/${maxRetries}`)
                requestAnimationFrame(assignStreamToVideo)
              } else {
                console.log('⚠️ [NOTAIO] videoRef non disponibile dopo max retries, lo stream sarà assegnato dal useEffect')
              }
            }
            
            assignStreamToVideo()
          } catch (error) {
            console.error('❌ [NOTAIO] Errore avvio stream immediato:', error)
            // L'useEffect normale gestirà il retry
          }
        }
        
        startStreamImmediately()
      } else if (userRole === 'cliente' || userRole === 'client' || userRole === 'partner') {
        // 🔍 Controlla se il cliente è già stato accettato in precedenza
        const appointmentData = activeAppointment?.rawData || activeAppointment
        const appointmentId = activeAppointment?.id || appointmentData?.id
        
        // ❌ Se non c'è ID valido, vai in sala d'attesa per sicurezza
        if (!appointmentId) {
          console.warn('⚠️ Nessun appointmentId valido → Sala d\'attesa per sicurezza')
          setConnectionStatus('waiting')
          return
        }
        
        const storageKey = 'client_accepted_' + appointmentId
        
        // ⚡ OTTIMIZZAZIONE: Controlla PRIMA il localStorage per accesso IMMEDIATO
        const cachedAcceptance = localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey)
        
        if (cachedAcceptance === 'true') {
          // ✅ Cliente già accettato (cache localStorage) → Entra IMMEDIATAMENTE
          console.log('⚡ Cliente GIÀ ACCETTATO (cache) → Ingresso IMMEDIATO nella video chiamata!')
          console.log('🔍 Stati prima del set: connectionStatus:', connectionStatus, 'isCameraOn:', isCameraOn, 'isMicOn:', isMicOn, 'mediaStream:', mediaStream)
          setConnectionStatus('connected')
          setIsCameraOn(true)
          setIsMicOn(true)
          console.log('📹 Camera e microfono attivati IMMEDIATAMENTE da cache')
          
          // ⚡ AVVIA LO STREAM IMMEDIATAMENTE (non aspettare il re-render)
          const startStreamImmediately = async () => {
            try {
              console.log('🎥🎥🎥 AVVIO IMMEDIATO dello stream (senza aspettare re-render)')
              const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 },
                audio: true
              })
              console.log('✅✅✅ Stream ottenuto IMMEDIATAMENTE:', stream)
              setMediaStream(stream)
              
              // ⚡ Attendi che videoRef sia disponibile con retry
              let retries = 0
              const maxRetries = 10
              
              const assignStreamToVideo = () => {
                if (videoRef.current) {
                  console.log('✅ videoRef disponibile, assegno stream')
                  videoRef.current.srcObject = stream
                  videoRef.current.play().then(() => {
                    console.log('✅✅✅ Video avviato IMMEDIATAMENTE')
                  }).catch((playError) => {
                    console.warn('⚠️ Errore play (normale):', playError)
                  })
                } else if (retries < maxRetries) {
                  retries++
                  console.log(`⏳ videoRef non ancora disponibile, retry ${retries}/${maxRetries}`)
                  requestAnimationFrame(assignStreamToVideo)
                } else {
                  console.log('⚠️ videoRef non disponibile dopo max retries, lo stream sarà assegnato dal useEffect')
                }
              }
              
              assignStreamToVideo()
            } catch (error) {
              console.error('❌ Errore avvio stream immediato:', error)
              // L'useEffect normale gestirà il retry
            }
          }
          
          startStreamImmediately()
          
          // ✅ Verifica in BACKGROUND (non blocca l'ingresso)
          const verifyAcceptanceInBackground = async () => {
            try {
              const token = localStorage.getItem('access_token')
              const response = await fetch(`http://localhost:8000/api/appointments/appuntamenti/${appointmentId}/check-acceptance/`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              })
              
              if (response.ok) {
                const data = await response.json()
                console.log('🔍 Verifica accettazione (background):', data)
                
                if (!data.is_accepted) {
                  // ⚠️ Il notaio ha BLOCCATO il cliente nel frattempo
                  console.warn('⚠️ Cliente BLOCCATO dal notaio → Espulsione dalla chiamata')
                  localStorage.removeItem(storageKey)
                  sessionStorage.removeItem(storageKey)
                  setConnectionStatus('waiting')
                  setIsCameraOn(false)
                  setIsMicOn(false)
                  alert('Sei stato rimosso dalla chiamata dal notaio.')
                }
              }
            } catch (error) {
              console.warn('⚠️ Errore verifica background (ignoro, cliente già dentro):', error)
            }
          }
          
          verifyAcceptanceInBackground()
        } else {
          // 📡 Nessuna cache → Controlla API (prima volta o dopo blocco)
          const checkPreviousAcceptance = async () => {
            try {
              const token = localStorage.getItem('access_token')
              const response = await fetch(`http://localhost:8000/api/appointments/appuntamenti/${appointmentId}/check-acceptance/`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              })
              
              if (response.ok) {
                const data = await response.json()
                console.log('🔍 Check accettazione precedente:', data)
                
                if (data.is_accepted) {
                  console.log('✅ Cliente GIÀ ACCETTATO (API) → Entra nella video chiamata')
                  setConnectionStatus('connected')
                  setIsCameraOn(true)
                  setIsMicOn(true)
                  console.log('📹 Camera e microfono attivati per cliente già accettato')
                  // Salva in cache per prossimi ingressi
                  localStorage.setItem(storageKey, 'true')
                  sessionStorage.setItem(storageKey, 'true')
                } else {
                  console.log('📡 Cliente NON ancora accettato → Sala d\'attesa')
                  setConnectionStatus('waiting')
                }
              } else {
                console.warn('⚠️ Errore controllo accettazione, uso sala d\'attesa per sicurezza')
                setConnectionStatus('waiting')
              }
            } catch (error) {
              console.error('❌ Errore chiamata API check-acceptance:', error)
              console.log('📡 Fallback → Sala d\'attesa')
              setConnectionStatus('waiting')
            }
          }
          
          checkPreviousAcceptance()
        }
      } else {
        // Fallback: ruoli sconosciuti vanno in sala d'attesa per sicurezza
        console.warn('⚠️ Ruolo sconosciuto:', userRole, '→ Sala d\'attesa (fallback sicuro)')
        setConnectionStatus('waiting')
      }
    }
  }, [activeAppointment])
  
  // Polling per cliente/partner: controlla se è stato accettato dal notaio
  useEffect(() => {
    if (connectionStatus === 'waiting') {
      // 🔑 LEGGI IL RUOLO DALLA SESSIONE CORRENTE
      const userRole = authService.getUserRole()
      const appointmentData = activeAppointment?.rawData || activeAppointment
      const appointmentId = activeAppointment?.id || appointmentData?.id
      
      console.log('🔍 Polling setup - UserRole SESSIONE:', userRole, 'AppointmentID:', appointmentId)
      
      // ❌ Non fare polling se non c'è un ID valido
      if (!appointmentId) {
        console.warn('⚠️ Nessun appointmentId valido, non avvio polling')
        return
      }
      
      // Solo clienti e partner fanno polling (notai/admin non devono aspettare)
      const isGuestRole = userRole === 'cliente' || userRole === 'client' || userRole === 'partner'
      
      if (isGuestRole) {
        console.log('👤 Cliente/Partner in attesa - Inizio polling per accettazione...')
        
        // Listener BroadcastChannel (per tab stesso browser)
        let channel
        try {
          channel = new BroadcastChannel('appointment_' + appointmentId)
          channel.onmessage = (event) => {
            console.log('📡 Messaggio ricevuto via BroadcastChannel:', event.data)
            if (event.data.type === 'CLIENT_ACCEPTED') {
              console.log('✅✅✅ Cliente ACCETTATO dal notaio (via BroadcastChannel)!')
              setConnectionStatus('connected')
              // ✅ Attiva IMMEDIATAMENTE camera e microfono per il cliente
              setIsCameraOn(true)
              setIsMicOn(true)
              console.log('📹 Camera e microfono attivati IMMEDIATAMENTE per cliente')
              // ✅ MANTIENI il flag in localStorage per rientri veloci (NON cancellare!)
            }
          }
          console.log('📻 BroadcastChannel listener attivo')
        } catch (error) {
          console.warn('⚠️ BroadcastChannel non disponibile:', error)
        }
        
        // Polling API Django
        const pollInterval = setInterval(async () => {
          const storageKey = 'client_accepted_' + appointmentId
          
          try {
            // Chiamata API per controllare se accettato
            const token = localStorage.getItem('access_token')
            const response = await fetch(`http://localhost:8000/api/appointments/appuntamenti/${appointmentId}/check-acceptance/`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
            
            if (response.ok) {
              const data = await response.json()
              console.log('🔄 Polling API - Response:', data)
              
              if (data.is_accepted) {
                console.log('✅✅✅ Cliente ACCETTATO dal notaio (via API) - Ingresso in video chiamata!')
                setConnectionStatus('connected')
                // ✅ Attiva IMMEDIATAMENTE camera e microfono per il cliente
                setIsCameraOn(true)
                setIsMicOn(true)
                console.log('📹 Camera e microfono attivati IMMEDIATAMENTE per cliente')
                // ✅ MANTIENI il flag in localStorage per rientri veloci (NON cancellare!)
                return
              }
            }
          } catch (error) {
            console.warn('⚠️ Errore polling API, uso localStorage fallback:', error)
          }
          
          // Fallback: controlla localStorage (per tab stesso browser)
          const isAccepted = localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey)
          console.log('🔄 Polling fallback localStorage - Key:', storageKey, 'Value:', isAccepted)
          
          if (isAccepted === 'true') {
            console.log('✅✅✅ Cliente ACCETTATO dal notaio (via localStorage) - Ingresso in video chiamata!')
            setConnectionStatus('connected')
            // ✅ Attiva IMMEDIATAMENTE camera e microfono per il cliente
            setIsCameraOn(true)
            setIsMicOn(true)
            console.log('📹 Camera e microfono attivati IMMEDIATAMENTE per cliente')
            // ✅ MANTIENI il flag in localStorage per rientri veloci (NON cancellare!)
          }
        }, 2000) // Controlla ogni 2 secondi
        
        return () => {
          console.log('🛑 Polling fermato')
          clearInterval(pollInterval)
          if (channel) {
            channel.close()
          }
        }
      }
    }
  }, [connectionStatus, activeAppointment])
  
  // ✅ RIMOSSO: Camera e microfono ora si attivano IMMEDIATAMENTE quando si imposta connectionStatus='connected'
  // Non serve più un useEffect separato che reagisce a connectionStatus, eliminando il delay di rendering
  
  // ✅ Controlla stato accettazione cliente (per notaio) all'inizio
  useEffect(() => {
    if (activeAppointment && connectionStatus === 'connected') {
      const userRole = authService.getUserRole()
      
      // Solo il notaio/admin controlla lo stato del cliente
      if (userRole === 'notaio' || userRole === 'notary' || userRole === 'admin') {
        const appointmentData = activeAppointment?.rawData || activeAppointment
        const appointmentId = activeAppointment?.id || appointmentData?.id
        
        const checkClientAcceptance = async () => {
          try {
            const token = localStorage.getItem('access_token')
            const response = await fetch(`http://localhost:8000/api/appointments/appuntamenti/${appointmentId}/check-acceptance/`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
            
            if (response.ok) {
              const data = await response.json()
              console.log('🔍 Notaio controlla stato accettazione cliente:', data)
              setIsClientAccepted(data.is_accepted)
            }
          } catch (error) {
            console.error('❌ Errore controllo accettazione cliente:', error)
          }
        }
        
        checkClientAcceptance()
      }
    }
  }, [activeAppointment, connectionStatus])
  
  // Timer chiamata
  useEffect(() => {
    if (connectionStatus === 'connected') {
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [connectionStatus])
  
  // Carica documenti appuntamento (solo per notaio)
  useEffect(() => {
    const fetchDocumenti = async () => {
      const userRole = authService.getUserRole()
      const appointmentData = activeAppointment?.rawData || activeAppointment
      const appointmentId = activeAppointment?.id || appointmentData?.id
      
      // Solo il notaio carica i documenti
      if ((userRole === 'notaio' || userRole === 'notary' || userRole === 'admin') && appointmentId && connectionStatus === 'connected') {
        try {
          const token = localStorage.getItem('access_token')
          const response = await fetch(`http://localhost:8000/api/appointments/documenti-appuntamento/appuntamento/${appointmentId}/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            console.log(`📄 Caricati ${data.length} documenti per appuntamento ${appointmentId}`)
            setDocumenti(data)
          } else {
            console.error('❌ Errore caricamento documenti:', response.status)
          }
        } catch (error) {
          console.error('❌ Errore caricamento documenti:', error)
        }
      }
    }
    
    fetchDocumenti()
  }, [activeAppointment, connectionStatus])
  
  // Formatta durata chiamata
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Gestione stream video/audio
  useEffect(() => {
    let stream = null
    let isActive = true // Flag per evitare race conditions
    
    const startMedia = async () => {
      try {
        if (connectionStatus === 'connected' && (isCameraOn || isMicOn)) {
          console.log('🎥 Richiesta accesso media - Camera:', isCameraOn, 'Mic:', isMicOn)
          
          // ✅ PULISCI lo stream precedente PRIMA di avviare uno nuovo
          if (mediaStream) {
            console.log('🧹 Pulisco stream precedente prima di riavviare')
            mediaStream.getTracks().forEach(track => track.stop())
            setMediaStream(null)
            // Piccolo delay per assicurarsi che il browser rilasci le risorse
            await new Promise(resolve => setTimeout(resolve, 100))
          }
          
          stream = await navigator.mediaDevices.getUserMedia({
            video: isCameraOn ? { width: 1280, height: 720 } : false,
            audio: isMicOn
          })
          
          // Verifica che il componente sia ancora montato
          if (!isActive) {
            console.log('⚠️ Componente smontato durante getUserMedia, fermo stream')
            stream.getTracks().forEach(track => track.stop())
            return
          }
          
          console.log('✅ Stream ottenuto:', stream)
          setMediaStream(stream)
          
          // Attendi un frame per assicurarsi che lo stato sia aggiornato
          await new Promise(resolve => requestAnimationFrame(resolve))
          
          if (videoRef.current && isCameraOn) {
            console.log('📹 Assegno stream al video element')
            videoRef.current.srcObject = stream
            // Forza il play (alcuni browser lo richiedono)
            try {
              await videoRef.current.play()
              console.log('✅ Video play avviato')
            } catch (playError) {
              console.warn('⚠️ Errore play (normale se già in play):', playError)
            }
          }
        } else if (mediaStream) {
          // Ferma lo stream se entrambi sono spenti
          console.log('🛑 Fermo stream')
          mediaStream.getTracks().forEach(track => track.stop())
          setMediaStream(null)
          if (videoRef.current) {
            videoRef.current.srcObject = null
          }
        }
      } catch (error) {
        console.error('❌ Errore accesso media:', error)
        alert('Impossibile accedere alla webcam/microfono. Verifica i permessi del browser.')
      }
    }
    
    startMedia()
    
    return () => {
      console.log('🧹 Cleanup useEffect mediaStream')
      isActive = false
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [isCameraOn, isMicOn, connectionStatus])
  
  // ✅ Reset completo quando si MONTA il componente (cliente rientra)
  useEffect(() => {
    console.log('🔄 AppointmentRoom montato - Reset iniziale')
    // Reset stati media al mount
    return () => {
      console.log('🧹 AppointmentRoom smontato - Cleanup finale')
      // Cleanup finale quando il componente si smonta completamente
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])
  
  // Cleanup quando si chiude la room
  useEffect(() => {
    return () => {
      if (mediaStream) {
        console.log('🧹 Cleanup stream per cambio stato')
        mediaStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [mediaStream])
  
  // Gestione camera
  const toggleCamera = async () => {
    console.log('📹 Toggle camera - Stato attuale:', isCameraOn)
    
    if (!isCameraOn) {
      setIsCameraOn(true)
    } else {
      setIsCameraOn(false)
      // Ferma solo il track video
      if (mediaStream) {
        const videoTrack = mediaStream.getVideoTracks()[0]
        if (videoTrack) {
          videoTrack.stop()
        }
      }
    }
  }
  
  // Gestione microfono e casse (audio in entrata e uscita)
  const toggleMic = () => {
    console.log('🎤 Toggle microfono/casse - Stato attuale:', isMicOn)
    
    if (!isMicOn) {
      // Abilita microfono (output) e casse (input)
      setIsMicOn(true)
      console.log('✅ Audio abilitato - Microfono ON, Casse ON')
      
      // Abilita il track audio se già presente
      if (mediaStream) {
        const audioTrack = mediaStream.getAudioTracks()[0]
        if (audioTrack) {
          audioTrack.enabled = true
        }
      }
    } else {
      // Disabilita microfono (output) e casse (input)
      setIsMicOn(false)
      console.log('🔇 Audio disabilitato - Microfono OFF, Casse OFF')
      
      // Disabilita il track audio
      if (mediaStream) {
        const audioTrack = mediaStream.getAudioTracks()[0]
        if (audioTrack) {
          audioTrack.enabled = false
        }
      }
    }
  }
  
  // Gestione chiusura chiamata
  const handleHangup = () => {
    console.log('📞 Chiusura chiamata')
    
    // Ferma tutti i media
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop())
      setMediaStream(null)
    }
    
    // Mostra modale conferma
    setShowExitModal(true)
  }
  
  // Handler per accettare cliente dalla sala d'attesa (NOTAIO)
  const handleAcceptGuest = () => {
    console.log('📋 Notaio apre modale conferma accettazione cliente')
    setShowAcceptGuestModal(true)
  }
  
  // Conferma accettazione cliente
  const confirmAcceptGuest = async () => {
    const appointmentData = activeAppointment?.rawData || activeAppointment
    const appointmentId = activeAppointment?.id || appointmentData?.id
    
    console.log('✅ Notaio conferma accettazione cliente dalla sala d\'attesa')
    console.log('📊 ActiveAppointment:', activeAppointment)
    console.log('🆔 AppointmentID:', appointmentId)
    
    // ❌ Verifica ID valido
    if (!appointmentId) {
      console.error('❌ Nessun appointmentId valido')
      alert('Errore: ID appuntamento non valido')
      return
    }
    
    try {
      // Chiamata API Django per accettare il cliente
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://localhost:8000/api/appointments/appuntamenti/${appointmentId}/accept-client/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Errore accettazione cliente:', errorData)
        alert(`Errore: ${errorData.error || 'Impossibile accettare il cliente'}`)
        return
      }
      
      const data = await response.json()
      console.log('✅ Cliente accettato tramite API:', data)
      
      // ✅ Aggiorna lo stato locale
      setIsClientAccepted(true)
      
      // Fallback: localStorage per tab stesso browser
      const storageKey = 'client_accepted_' + appointmentId
      localStorage.setItem(storageKey, 'true')
      sessionStorage.setItem(storageKey, 'true')
      
      // BroadcastChannel per tab stesso browser
      try {
        const channel = new BroadcastChannel('appointment_' + appointmentId)
        channel.postMessage({ type: 'CLIENT_ACCEPTED', appointmentId, timestamp: Date.now() })
        console.log('📡 Messaggio inviato via BroadcastChannel:', appointmentId)
        channel.close()
      } catch (error) {
        console.warn('⚠️ BroadcastChannel non disponibile:', error)
      }
      
    } catch (error) {
      console.error('❌ Errore chiamata API:', error)
      alert('Errore di connessione. Il cliente potrebbe non ricevere la notifica.')
    }
  }
  
  // Handler per bloccare cliente (richiede nuova accettazione)
  const handleBlockClient = async () => {
    const appointmentData = activeAppointment?.rawData || activeAppointment
    const appointmentId = activeAppointment?.id || appointmentData?.id
    
    // ❌ Verifica ID valido
    if (!appointmentId) {
      console.error('❌ Nessun appointmentId valido')
      alert('Errore: ID appuntamento non valido')
      return
    }
    
    if (!confirm('Vuoi bloccare il cliente? Dovrà essere riaccettato per entrare nuovamente.')) {
      return
    }
    
    console.log('🚫 Notaio blocca il cliente')
    console.log('🆔 AppointmentID:', appointmentId)
    
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://localhost:8000/api/appointments/appuntamenti/${appointmentId}/block-client/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Errore blocco cliente:', errorData)
        alert(`Errore: ${errorData.error || 'Impossibile bloccare il cliente'}`)
        return
      }
      
      const data = await response.json()
      console.log('✅ Cliente bloccato tramite API:', data)
      
      // ✅ Aggiorna lo stato locale
      setIsClientAccepted(false)
      
      // Rimuovi localStorage
      const storageKey = 'client_accepted_' + appointmentId
      localStorage.removeItem(storageKey)
      sessionStorage.removeItem(storageKey)
      
      alert('Cliente bloccato. Dovrà essere riaccettato per entrare.')
      
    } catch (error) {
      console.error('❌ Errore chiamata API:', error)
      alert('Errore di connessione.')
    }
  }
  
  // Handler per forzare camera sempre attiva (notaio)
  const handleToggleForceCamera = () => {
    setIsClientCameraForced(!isClientCameraForced)
    console.log(`📹 Camera cliente ${!isClientCameraForced ? 'FORZATA' : 'LIBERA'}`)
    // TODO: Implementare API per comunicare al client che camera è forzata
    // Il client non potrà disattivarla
  }
  
  // Handler per forzare microfono sempre attivo (notaio)
  const handleToggleForceMic = () => {
    setIsClientMicForced(!isClientMicForced)
    console.log(`🎤 Microfono cliente ${!isClientMicForced ? 'FORZATO' : 'LIBERO'}`)
    // TODO: Implementare API per comunicare al client che microfono è forzato
    // Il client non potrà disattivarlo
  }

  // Handlers per mouse move e mouse up usando useCallback con RAF
  const handleMouseMove = useCallback((e) => {
    // Cancella il RAF precedente se esiste
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
    }

    // Usa requestAnimationFrame per rendering fluido
    rafIdRef.current = requestAnimationFrame(() => {
      if (isDraggingRef.current && floatingRef.current) {
        const newX = e.clientX - dragOffsetRef.current.x
        const newY = e.clientY - dragOffsetRef.current.y

        // Aggiorna immediatamente il DOM per fluidità
        floatingRef.current.style.left = `${newX}px`
        floatingRef.current.style.top = `${newY}px`

        // Aggiorna lo stato con throttle
        setPosition({ x: newX, y: newY })
      }
    })
  }, [])

  const handleMouseUp = useCallback(() => {
    if (isResizingRef.current) {
      console.log('✅ Resize terminato')
    }
    
    // Cancella RAF se in corso
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    
    isDraggingRef.current = false
    isResizingRef.current = false
  }, [])

  // Aggiungi/rimuovi listeners globali con capture
  useEffect(() => {
    const options = { capture: true, passive: false }
    window.addEventListener('mousemove', handleMouseMove, options)
    window.addEventListener('mouseup', handleMouseUp, options)
    
    console.log('✅ Event listeners aggiunti')
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove, options)
      window.removeEventListener('mouseup', handleMouseUp, options)
      console.log('🗑️ Event listeners rimossi')
    }
  }, [handleMouseMove, handleMouseUp])

  // WebSocket sincronizzazione - Inizializza quando appointment è disponibile
  useEffect(() => {
    const appointmentData = activeAppointment?.rawData || activeAppointment
    if (!appointmentData?.id) {
      console.log('⚠️ WebSocket video call: nessun appointment ID, skip')
      return
    }
    
    const userRole = authService.getUserRole()
    const currentUser = authService.getUser()
    const notaryName = appointmentData.notaio_nome || appointmentData.notary_name || 'Notaio'
    const clientName = appointmentData.client_name || 
                       appointmentData.cliente_nome || 
                       appointmentData.clientName ||
                       activeAppointment.clientName || 
                       'Cliente'
    
    const wsUrl = `ws://localhost:8000/ws/pdf/${appointmentData.id}/`
    console.log('🔌 [VIDEO CALL WS] Inizializzo per:', {
      appointmentId: appointmentData.id,
      userRole,
      userId: currentUser?.id,
      userName: userRole === 'notaio' ? notaryName : clientName,
      wsUrl
    })
    
    try {
      wsVideoCallRef.current = new WebSocket(wsUrl)
      
      wsVideoCallRef.current.onopen = () => {
        console.log('✅ [VIDEO CALL WS] CONNESSO - Invio JOIN_CALL')
        wsVideoCallRef.current.send(JSON.stringify({
          type: 'JOIN_CALL',
          userId: currentUser?.id,
          userName: userRole === 'notaio' ? notaryName : clientName,
          userRole: userRole
        }))
      }
      
      wsVideoCallRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📨 [VIDEO CALL WS] Messaggio ricevuto:', data, 'userRole:', userRole)
          
          // Gestisci messaggi in base al tipo
          switch (data.type) {
            case 'OPEN_PDF':
              console.log('📄 [VIDEO CALL WS] OPEN_PDF ricevuto, userRole:', userRole)
              // Solo il cliente riceve e apre il PDF automaticamente
              if (userRole !== 'notaio' && userRole !== 'admin') {
                console.log('✅ [VIDEO CALL WS] Cliente: APRO PDF viewer automaticamente!')
                setSelectedDocument(data.document)
                setShowPDFViewer(true)
              } else {
                console.log('⏭️ [VIDEO CALL WS] Notaio: ignoro OPEN_PDF (l\'ho già aperto io)')
              }
              break
              
            case 'CLOSE_PDF':
              console.log('❌ [VIDEO CALL WS] CLOSE_PDF ricevuto, userRole:', userRole)
              // Tutti chiudono il PDF
              if (userRole !== 'notaio' && userRole !== 'admin') {
                console.log('✅ [VIDEO CALL WS] Cliente: CHIUDO PDF viewer automaticamente!')
                setShowPDFViewer(false)
                setSelectedDocument(null)
              } else {
                console.log('⏭️ [VIDEO CALL WS] Notaio: ignoro CLOSE_PDF (l\'ho già chiuso io)')
              }
              break
              
            default:
              console.log('ℹ️ [VIDEO CALL WS] Tipo messaggio:', data.type, '(potrebbe essere gestito dal PDF viewer)')
              break
          }
        } catch (error) {
          console.error('❌ [VIDEO CALL WS] Errore parsing messaggio:', error)
        }
      }
      
      wsVideoCallRef.current.onerror = (error) => {
        console.error('❌ [VIDEO CALL WS] ERROR:', error)
      }
      
      wsVideoCallRef.current.onclose = (event) => {
        console.log('🔌 [VIDEO CALL WS] CHIUSO - Code:', event.code, 'Reason:', event.reason)
      }
    } catch (error) {
      console.error('❌ [VIDEO CALL WS] Errore creazione WebSocket:', error)
    }
    
    return () => {
      if (wsVideoCallRef.current) {
        console.log('🧹 [VIDEO CALL WS] Cleanup - chiudo WebSocket')
        wsVideoCallRef.current.close()
      }
    }
  }, [activeAppointment, setSelectedDocument, setShowPDFViewer])

  // Handlers per drag
  const handleMouseDown = (e) => {
    if (e.target.closest('.appointment-room-controls')) return
    
    isDraggingRef.current = true
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    }
  }

  if (!activeAppointment || isMinimized) {
    return null
  }

  const appointmentData = activeAppointment.rawData || activeAppointment
  const appointmentType = activeAppointment.appointmentType || appointmentData.tipologia_atto_nome || appointmentData.appointment_type || 'Appuntamento'
  const appointmentDate = activeAppointment.date || appointmentData.date || ''
  const appointmentTime = activeAppointment.time || appointmentData.time || ''
  
  // 🔑 RECUPERA IL RUOLO E NOME DALLA SESSIONE CORRENTE (JWT Token / localStorage)
  const userRole = authService.getUserRole()
  const currentUser = authService.getUser()
  
  // Se l'utente è un notaio, usa il suo nome dalla sessione (nel notary_profile)
  const notaryName = (userRole === 'notaio' || userRole === 'notary' || userRole === 'admin')
    ? (currentUser?.notary_profile?.studio_name || 'Notaio')
    : (activeAppointment.notaryName || appointmentData.notaio_nome || 'Notaio')
  
  // NOME CLIENTE: usa SEMPRE il nome dall'appointment (come nelle mini card)
  // Il backend lo popola da richiedente.cliente.nome + richiedente.cliente.cognome
  const clientName = appointmentData.client_name || 
                     appointmentData.cliente_nome || 
                     appointmentData.clientName || 
                     activeAppointment.clientName || 
                     'Cliente'
  
  console.log('📊 AppointmentRoom - appointmentData:', appointmentData)
  console.log('👤 Current user dalla sessione:', currentUser)
  console.log('🔍 appointmentData.client_name:', appointmentData.client_name)
  console.log('🔍 appointmentData.cliente_nome:', appointmentData.cliente_nome)
  console.log('🔍 appointmentData.clientName:', appointmentData.clientName)
  console.log('👤 Notaio nome:', notaryName)
  console.log('👤 Cliente nome finale:', clientName)
  console.log('🎭 User role SESSIONE CORRENTE:', userRole)
  console.log('📍 Connection status:', connectionStatus)

  const handleClose = () => {
    setShowExitModal(true)
  }

  const handleConfirmExit = () => {
    exitAppointment()
  }

  return (
    <div 
      ref={floatingRef}
      className={`appointment-room ${isFloating ? 'floating' : 'fullscreen'}`}
      style={isFloating ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`
      } : {}}
    >
      {/* Background animato */}
      <div className="appointment-room-background">
        <div className="appointment-shape appointment-shape-1"></div>
        <div className="appointment-shape appointment-shape-2"></div>
        <div className="appointment-shape appointment-shape-3"></div>
      </div>


      {/* Header con controlli */}
              {connectionStatus === 'connected' ? (
                /* Header completo con tutti i controlli quando connesso */
                <div
                  className="appointment-room-header"
                  onMouseDown={isFloating ? handleMouseDown : undefined}
                  style={{ cursor: isFloating && !isDraggingRef.current ? 'move' : 'default' }}
                >
                  <div className="appointment-room-title">
                    {appointmentType} - {notaryName}
                  </div>
                  
                  <div className="appointment-room-controls">
                    <button
                      className="appointment-control-btn"
                      onClick={toggleFloating}
                      title={isFloating ? "Espandi a schermo intero" : "Riduci a finestra"}
                    >
                      <Maximize2 size={20} />
                    </button>
                    <button
                      className="appointment-control-btn appointment-control-btn-minimize"
                      onClick={minimizeAppointment}
                      title="Metti in background"
                    >
                      <Minus size={20} />
                    </button>
                    <button
                      className="appointment-control-btn appointment-control-btn-close"
                      onClick={handleClose}
                      title="Chiudi"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
      ) : connectionStatus === 'waiting' ? (
        /* Header minimale sala d'attesa */
        <div className="appointment-room-header-minimal">
          <button
            className="appointment-control-btn appointment-control-btn-close"
            onClick={handleClose}
            title="Chiudi"
          >
            <X size={24} />
          </button>
        </div>
      ) : null}

      {/* Contenuto principale */}
      <div className="appointment-room-content">
        {connectionStatus === 'waiting' ? (
          /* SALA D'ATTESA - Vista semplificata per CLIENTE */
          <div className="appointment-waiting">
            {/* Animazione sala d'attesa */}
            <div className="waiting-animation">
              <div className="waiting-circle waiting-circle-1"></div>
              <div className="waiting-circle waiting-circle-2"></div>
              <div className="waiting-circle waiting-circle-3"></div>
            </div>

            <h2 className="waiting-title">
              Sei in sala d'attesa
            </h2>

            <p className="waiting-subtitle">
              Il notaio ti farà entrare a breve...
            </p>

            {/* Card info appuntamento compatta */}
            <div className="waiting-info-card">
              <div className="waiting-info-row">
                <span className="waiting-info-label">Notaio:</span>
                <span className="waiting-info-value">{notaryName}</span>
              </div>
              <div className="waiting-info-row">
                <span className="waiting-info-label">Atto:</span>
                <span className="waiting-info-value">{appointmentType}</span>
              </div>
              <div className="waiting-info-row">
                <span className="waiting-info-label">Quando:</span>
                <span className="waiting-info-value">
                  {appointmentDate} {appointmentTime && `· ${appointmentTime}`}
                </span>
              </div>
            </div>

            <div className="waiting-tip">
              <p>💡 Assicurati che la tua webcam e il microfono siano funzionanti</p>
            </div>
          </div>
        ) : (
          /* VIDEO CHIAMATA - Vista diversa per NOTAIO vs CLIENTE/PARTNER */
          <div className="appointment-connected">
            {(userRole === 'cliente' || userRole === 'client' || userRole === 'partner') ? (
              /* LAYOUT CLIENTE/PARTNER: Video a schermo intero + Chat a scomparsa */
              <div className="video-call-layout video-call-layout-client">
                {/* Card video a schermo intero */}
                <div className={`video-client-main ${showChat ? 'chat-open' : ''}`}>
                  <div className="video-card video-card-client">
                    {/* Timer in alto a sinistra */}
                    <div className="video-timer">
                      <Clock size={14} />
                      <span>{formatDuration(callDuration)}</span>
                    </div>
                    
                    {/* Video feed - Cliente vede: il proprio video + video del notaio */}
                    <div className="video-feed">
                      <div className="video-participants-grid">
                        {/* Video del NOTAIO (principale) */}
                        <div className="video-participant-box">
                          {/* TODO: Stream WebRTC reale del notaio */}
                          <div className="video-participant-placeholder">
                            <div className="video-participant-avatar notary-avatar">
                              <Users size={64} />
                            </div>
                            <p className="video-participant-name">{notaryName}</p>
                            <p className="video-participant-status">
                              Connesso
                            </p>
                          </div>
                          <div className="video-participant-label">
                            <Users size={12} />
                            <span>{notaryName}</span>
                            {isMicOn && (
                              <span className="audio-enabled-badge" title="Audio attivo">🔊</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Video del CLIENTE stesso */}
                        <div className="video-participant-box">
                          {isCameraOn && mediaStream ? (
                            <>
                              <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted={true}
                                className="video-participant-stream"
                              />
                              <div className="video-participant-label">
                                <Users size={12} />
                                <span>Tu ({clientName})</span>
                                {isMicOn && (
                                  <Mic size={10} className="video-mic-indicator" />
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="video-participant-placeholder">
                              <div className="video-participant-avatar">
                                <Users size={48} />
                              </div>
                              <p className="video-participant-name">Tu ({clientName})</p>
                              <p className="video-participant-status">
                                {isCameraOn ? 'Connessione...' : 'Camera spenta'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Controlli video */}
                    <div className="video-controls">
                      <button 
                        className={`video-control-btn ${!isCameraOn ? 'disabled' : ''}`}
                        onClick={toggleCamera}
                        title={isCameraOn ? 'Disattiva camera' : 'Attiva camera'}
                      >
                        {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
                      </button>
                      
                      <button 
                        className={`video-control-btn ${!isMicOn ? 'disabled' : ''}`}
                        onClick={toggleMic}
                        title={isMicOn ? 'Disattiva microfono' : 'Attiva microfono'}
                      >
                        {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
                      </button>
                      
                      <button 
                        className="video-control-btn hangup"
                        onClick={handleHangup}
                        title="Termina chiamata"
                      >
                        <Phone size={20} />
                      </button>
                      
                      <button 
                        className={`video-control-btn ${isScreenSharing ? 'active' : ''}`}
                        onClick={() => setIsScreenSharing(!isScreenSharing)}
                        title={isScreenSharing ? 'Interrompi condivisione' : 'Condividi schermo'}
                      >
                        <Monitor size={18} />
                      </button>
                      
                      <button 
                        className={`video-control-btn ${showChat ? 'active' : ''}`}
                        onClick={() => setShowChat(!showChat)}
                        title={showChat ? 'Chiudi chat' : 'Apri chat'}
                      >
                        <MessageSquare size={18} />
                      </button>
                    </div>
                    
                    {/* Icona fullscreen in alto a destra */}
                    <button className="video-fullscreen-btn" title="Schermo intero">
                      <Maximize2 size={18} />
                    </button>
                  </div>
                </div>
                
                {/* Chat sidebar a scomparsa (slide da destra) */}
                <div className={`video-chat-sidebar video-chat-sidebar-client ${showChat ? 'open' : ''}`}>
                  <div className="chat-header">
                    <MessageSquare size={18} />
                    <span>Chat</span>
                    <button className="chat-close-btn" onClick={() => setShowChat(false)} title="Chiudi chat">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="chat-messages">
                    <p className="chat-empty">Nessun messaggio</p>
                  </div>
                  <div className="chat-input">
                    <input type="text" placeholder="Scrivi un messaggio..." />
                    <button className="chat-send-btn">
                      <MessageSquare size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* LAYOUT NOTAIO: Grid 2 righe x 3 colonne */
              <div className="video-call-layout-notary">
                {/* Prima riga: Contenitore Video Grid + Chat */}
                <div className="notary-top-row">
                  {/* Contenitore Video Grid Dinamico (1-4 video) */}
                  <div className="video-grid-container">
                    {/* Timer in alto a sinistra */}
                    <div className="video-timer">
                      <Clock size={14} />
                      <span>{formatDuration(callDuration)}</span>
                    </div>
                    
                    {/* Grid video dinamica - max 4 video principali */}
                    <div className={`video-grid video-grid-${Math.min(isClientAccepted ? 2 : 1, 4)}`}>
                      {/* Video del notaio (sempre visibile) */}
                      <div className="video-grid-item">
                        {isCameraOn && mediaStream ? (
                          <>
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted={true}
                              className="video-stream"
                            />
                            <div className="video-label">
                              <Users size={12} />
                              <span>Tu ({notaryName})</span>
                              {isMicOn && (
                                <Mic size={10} className="video-mic-indicator" />
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="video-placeholder">
                            <div className="video-avatar notary-avatar">
                              <Users size={48} />
                            </div>
                            <p className="video-name">Tu ({notaryName})</p>
                            <p className="video-status">
                              {isCameraOn ? 'Connessione...' : 'Camera spenta'}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Video cliente (se accettato) */}
                      {isClientAccepted && clientName && clientName !== 'Cliente' && (
                        <div className="video-grid-item">
                          <div className="video-placeholder">
                            <div className="video-avatar">
                              <Users size={32} />
                            </div>
                            <p className="video-name">{clientName}</p>
                            <p className="video-status">Connesso</p>
                          </div>
                          <div className="video-label">
                            <Users size={12} />
                            <span>{clientName}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* TODO: Aggiungi qui partecipanti 3 e 4 quando implementi WebRTC */}
                    </div>
                    
                    {/* Mini-cards per partecipanti oltre i 4 */}
                    {/* TODO: Mostrare quando ci sono più di 4 partecipanti */}
                    {false && ( // Placeholder - attivare quando ci sono più di 4 partecipanti
                      <div className="video-mini-cards">
                        {/* Esempio mini-card per partecipante 5+ */}
                        <div className="video-mini-card">
                          <div className="video-placeholder">
                            <div className="video-avatar">
                              <Users size={20} />
                            </div>
                            <p className="video-name">Partecipante 5</p>
                          </div>
                          <div className="video-label">
                            <Users size={10} />
                            <span>P5</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Controlli video */}
                    <div className="video-controls">
                      <button 
                        className={`video-control-btn ${!isCameraOn ? 'disabled' : ''}`}
                        onClick={toggleCamera}
                        title={isCameraOn ? 'Disattiva camera' : 'Attiva camera'}
                      >
                        {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
                      </button>
                      
                      <button 
                        className={`video-control-btn ${!isMicOn ? 'disabled' : ''}`}
                        onClick={toggleMic}
                        title={isMicOn ? 'Disattiva microfono' : 'Attiva microfono'}
                      >
                        {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
                      </button>
                      
                      <button 
                        className="video-control-btn hangup"
                        onClick={handleHangup}
                        title="Termina chiamata"
                      >
                        <Phone size={20} />
                      </button>
                      
                      <button 
                        className={`video-control-btn ${isScreenSharing ? 'active' : ''}`}
                        onClick={() => setIsScreenSharing(!isScreenSharing)}
                        title={isScreenSharing ? 'Interrompi condivisione' : 'Condividi schermo'}
                      >
                        <Monitor size={18} />
                      </button>
                    </div>
                    
                    {/* Icona fullscreen in alto a destra */}
                    <button className="video-fullscreen-btn" title="Schermo intero">
                      <Maximize2 size={18} />
                    </button>
                  </div>
                
                {/* Card Chat */}
                <div className="video-chat-sidebar-notary">
                  <div className="card-header">
                    <MessageSquare size={18} />
                    <h3>Chat</h3>
                  </div>
                  <div className="chat-messages">
                    <p className="chat-empty">Nessun messaggio</p>
                  </div>
                  <div className="chat-input">
                    <input type="text" placeholder="Scrivi un messaggio..." />
                    <button className="chat-send-btn">
                      <MessageSquare size={18} />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Seconda riga: Documenti + Prossimi Appuntamenti + Partecipanti */}
              <div className="notary-bottom-row">
                  {/* Card Documenti Richiesti */}
                  <div className="documents-card">
                    <div className="card-header">
                      <FileText size={18} />
                      <h3>Documenti Richiesti</h3>
                    </div>
                    <div className="documents-list">
                      {documenti.length > 0 ? (
                        documenti.map((doc) => (
                          <div 
                            key={doc.id} 
                            className="document-item document-item-clickable"
                            onClick={() => {
                              if (doc.file_path) {
                                // Apri il documento in una nuova tab
                                window.open(doc.file_path, '_blank')
                              } else {
                                console.warn('File non disponibile per:', doc.document_type_name)
                              }
                            }}
                            title="Clicca per visualizzare il documento"
                          >
                            <div className="document-info">
                              <FileText size={14} className="document-icon" />
                              <span className="document-name">{doc.document_type_name || doc.document_type?.name || 'Documento'}</span>
                            </div>
                            {/* Icone azioni documento */}
                            <div className="document-actions">
                              <button 
                                className="document-action-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  console.log('📤 Condividi in realtime:', doc.document_type_name)
                                  
                                  // Aggiungi appointment_id al documento per WebSocket
                                  const docWithAppointment = {
                                    ...doc,
                                    appuntamento_id: activeAppointment?.id || appointmentData?.id,
                                    appointment_id: activeAppointment?.id || appointmentData?.id
                                  }
                                  console.log('📄 Documento con appointment_id:', docWithAppointment)
                                  
                                  // Apri il PDF viewer per il notaio
                                  setSelectedDocument(docWithAppointment)
                                  setShowPDFViewer(true)
                                  
                                  // Invia messaggio WebSocket per aprire il PDF anche per il cliente
                                  if (wsVideoCallRef.current && wsVideoCallRef.current.readyState === WebSocket.OPEN) {
                                    wsVideoCallRef.current.send(JSON.stringify({
                                      type: 'OPEN_PDF',
                                      document: docWithAppointment,
                                      userId: authService.getUser()?.id,
                                      userName: notaryName
                                    }))
                                    console.log('📡 Messaggio OPEN_PDF inviato al cliente')
                                  } else {
                                    console.warn('⚠️ WebSocket non connesso, impossibile sincronizzare apertura PDF')
                                  }
                                }}
                                title="Condividi in realtime"
                              >
                                <Share2 size={14} />
                              </button>
                              <button 
                                className="document-action-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  console.log('✍️ Firma documento:', doc.document_type_name)
                                  // TODO: Implementare firma digitale
                                }}
                                title="Firma documento"
                              >
                                <PenTool size={14} />
                              </button>
                              <button 
                                className="document-action-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  console.log('📦 Conservazione:', doc.document_type_name)
                                  // TODO: Implementare conservazione sostitutiva
                                }}
                                title="Conservazione sostitutiva"
                              >
                                <Archive size={14} />
                              </button>
                              <button 
                                className="document-action-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  console.log('📧 Invia via PEC:', doc.document_type_name)
                                  // TODO: Implementare invio PEC
                                }}
                                title="Invia via PEC"
                              >
                                <Mail size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="documents-empty">Nessun documento caricato</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Card Prossimi Appuntamenti */}
                  <div className="next-meeting-card">
                  <div className="card-header">
                    <Clock size={18} />
                    <h3>Prossimi Appuntamenti</h3>
                  </div>
                  <div className="next-meeting-list">
                    {/* TODO: Questi saranno sostituiti con dati reali dal backend */}
                    {/* Appuntamento 1 */}
                    <div className="next-meeting-item">
                      <div className="next-meeting-info-full">
                        <div className="next-meeting-title">Compravendita Immobiliare</div>
                        <div className="next-meeting-client">Mario Rossi</div>
                        <div className="next-meeting-datetime">
                          <Clock size={10} />
                          <span>Oggi - 16:30</span>
                        </div>
                      </div>
                      <div className="next-meeting-actions">
                        <button className="meeting-action-btn" data-tooltip="Entra">
                          <LogIn size={14} />
                        </button>
                        <button className="meeting-action-btn" data-tooltip="Modifica">
                          <Edit size={14} />
                        </button>
                        <button className="meeting-action-btn meeting-action-btn-delete" data-tooltip="Annulla">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Appuntamento 2 */}
                    <div className="next-meeting-item">
                      <div className="next-meeting-info-full">
                        <div className="next-meeting-title">Testamento</div>
                        <div className="next-meeting-client">Laura Bianchi</div>
                        <div className="next-meeting-datetime">
                          <Clock size={10} />
                          <span>Oggi - 18:00</span>
                        </div>
                      </div>
                      <div className="next-meeting-actions">
                        <button className="meeting-action-btn" data-tooltip="Entra">
                          <LogIn size={14} />
                        </button>
                        <button className="meeting-action-btn" data-tooltip="Modifica">
                          <Edit size={14} />
                        </button>
                        <button className="meeting-action-btn meeting-action-btn-delete" data-tooltip="Annulla">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Appuntamento 3 */}
                    <div className="next-meeting-item">
                      <div className="next-meeting-info-full">
                        <div className="next-meeting-title">Procura</div>
                        <div className="next-meeting-client">Giuseppe Verdi</div>
                        <div className="next-meeting-datetime">
                          <Clock size={10} />
                          <span>Domani - 10:00</span>
                        </div>
                      </div>
                      <div className="next-meeting-actions">
                        <button className="meeting-action-btn" data-tooltip="Entra">
                          <LogIn size={14} />
                        </button>
                        <button className="meeting-action-btn" data-tooltip="Modifica">
                          <Edit size={14} />
                        </button>
                        <button className="meeting-action-btn meeting-action-btn-delete" data-tooltip="Annulla">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Appuntamento 4 */}
                    <div className="next-meeting-item">
                      <div className="next-meeting-info-full">
                        <div className="next-meeting-title">Donazione</div>
                        <div className="next-meeting-client">Anna Ferrari</div>
                        <div className="next-meeting-datetime">
                          <Clock size={10} />
                          <span>26 Ott - 14:30</span>
                        </div>
                      </div>
                      <div className="next-meeting-actions">
                        <button className="meeting-action-btn" data-tooltip="Entra">
                          <LogIn size={14} />
                        </button>
                        <button className="meeting-action-btn" data-tooltip="Modifica">
                          <Edit size={14} />
                        </button>
                        <button className="meeting-action-btn meeting-action-btn-delete" data-tooltip="Annulla">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Card Partecipanti */}
                <div className="meeting-room-card">
                    <div className="card-header">
                      <h3>Partecipanti</h3>
                    </div>
                    <div className="meeting-room-list">
                      {/* Box partecipante: sempre visibile */}
                      <div className="participant-waiting-item">
                        <div className="participant-waiting-info">
                          <div className="participant-waiting-avatar">
                            <Users size={14} />
                          </div>
                          <span className="participant-waiting-name">
                            {clientName}
                          </span>
                        </div>
                        
                        {/* Badge e pulsante: visibili SOLO se NON ancora accettato */}
                        {!isClientAccepted ? (
                          <div className="participant-waiting-actions">
                            <div className="waiting-badge">
                              <Clock size={10} />
                              <span>Sala d'Attesa</span>
                            </div>
                            <button className="accept-guest-btn" onClick={handleAcceptGuest}>
                              Accetta
                            </button>
                          </div>
                        ) : (
                          /* Icone di controllo: visibili quando cliente è accettato */
                          <div className="participant-control-actions">
                            <button 
                              className={`participant-control-btn ${isClientCameraForced ? 'active' : ''}`}
                              onClick={handleToggleForceCamera}
                              title={isClientCameraForced ? 'Camera forzata sempre ON' : 'Forza camera sempre ON'}
                            >
                              {isClientCameraForced ? <Video size={14} /> : <VideoOff size={14} />}
                            </button>
                            <button 
                              className={`participant-control-btn ${isClientMicForced ? 'active' : ''}`}
                              onClick={handleToggleForceMic}
                              title={isClientMicForced ? 'Microfono forzato sempre ON' : 'Forza microfono sempre ON'}
                            >
                              {isClientMicForced ? <Mic size={14} /> : <MicOff size={14} />}
                            </button>
                            <button 
                              className="participant-control-btn participant-control-btn-block"
                              onClick={handleBlockClient}
                              title="Blocca partecipante"
                            >
                              <Lock size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Slot vuoti per altri partecipanti */}
                      <div className="participant-empty-slot"></div>
                      <div className="participant-empty-slot"></div>
                      <div className="participant-empty-slot"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      

      {/* Modale conferma uscita */}
      {showExitModal && (
        <ConfirmExitAppointmentModal
          onClose={() => setShowExitModal(false)}
          onConfirm={handleConfirmExit}
        />
      )}
      
      {/* Modale conferma accettazione ospite */}
      {showAcceptGuestModal && (
        <AcceptGuestModal
          clientName={clientName}
          onClose={() => setShowAcceptGuestModal(false)}
          onConfirm={confirmAcceptGuest}
        />
      )}
      
      {/* Lettore PDF Collaborativo */}
      {showPDFViewer && selectedDocument && (
        <CollaborativePDFViewer
          document={selectedDocument}
          onClose={() => {
            console.log('🚪 Chiusura PDF viewer')
            setShowPDFViewer(false)
            setSelectedDocument(null)
            
            // Se è il notaio, invia CLOSE_PDF al cliente
            if ((userRole === 'notaio' || userRole === 'admin') && wsVideoCallRef.current && wsVideoCallRef.current.readyState === WebSocket.OPEN) {
              wsVideoCallRef.current.send(JSON.stringify({
                type: 'CLOSE_PDF',
                userId: authService.getUser()?.id,
                userName: notaryName
              }))
              console.log('📡 Messaggio CLOSE_PDF inviato al cliente')
            }
          }}
          userRole={userRole}
          participants={(() => {
            // Costruisci array partecipanti con ID reali
            const participants = []
            const currentUserId = authService.getUser()?.id
            
            console.log('🔍 DEBUG appointmentData completo:', appointmentData)
            console.log('🔍 appointmentData.notaio_id:', appointmentData.notaio_id)
            console.log('🔍 appointmentData.notaio:', appointmentData.notaio)
            console.log('🔍 appointmentData.cliente_id:', appointmentData.cliente_id)
            console.log('🔍 appointmentData.richiedente:', appointmentData.richiedente)
            console.log('🔍 appointmentData.client_id:', appointmentData.client_id)
            
            // Aggiungi notaio (se non è l'utente corrente)
            const notaryId = appointmentData.notaio_id || appointmentData.notaio || currentUser?.id
            console.log('🆔 Notary ID estratto:', notaryId, 'Current:', currentUserId, 'Match:', notaryId === currentUserId)
            if (notaryId && notaryId !== currentUserId) {
              participants.push({ id: notaryId, name: notaryName, role: 'notaio' })
              console.log('✅ Notaio aggiunto ai partecipanti')
            } else {
              console.log('⏭️ Notaio NON aggiunto (è l\'utente corrente o ID mancante)')
            }
            
            // Aggiungi cliente (se non è l'utente corrente)
            const clientId = appointmentData.cliente_id || 
                            appointmentData.richiedente?.cliente || 
                            appointmentData.client_id ||
                            appointmentData.richiedente_id ||
                            appointmentData.client
            console.log('🆔 Client ID estratto:', clientId, 'Current:', currentUserId, 'Match:', clientId === currentUserId)
            
            // Se non troviamo l'ID ma abbiamo un nome cliente diverso dall'utente corrente,
            // usiamo il nome come fallback per identificare il partecipante
            if (clientId && clientId !== currentUserId) {
              participants.push({ id: clientId, name: clientName, role: 'cliente' })
              console.log('✅ Cliente aggiunto ai partecipanti (con ID reale)')
            } else if (!clientId && clientName && clientName !== 'Cliente' && userRole === 'notaio') {
              // Fallback: se siamo notaio e abbiamo un nome cliente, aggiungiamo con ID temporaneo
              const tempClientId = 'client_' + appointmentData.id
              participants.push({ id: tempClientId, name: clientName, role: 'cliente' })
              console.log('⚠️ Cliente aggiunto con ID temporaneo (backend non fornisce ID cliente)')
            } else {
              console.log('⏭️ Cliente NON aggiunto (è l\'utente corrente o dati mancanti)')
            }
            
            console.log('👥 Participants costruiti FINAL:', participants)
            console.log('🆔 Current user ID:', currentUserId)
            
            return participants
          })()}
          currentUser={authService.getUser()}
        />
      )}
    </div>
  )
}

export default AppointmentRoom
