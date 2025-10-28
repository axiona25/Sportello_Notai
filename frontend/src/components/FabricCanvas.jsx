import React, { useEffect, useRef, useState } from 'react'

// Usa window.fabric caricato da CDN
const fabric = window.fabric

/**
 * Canvas Fabric.js per editing interattivo del PDF
 * 
 * Features:
 * - Testo libero (font, size, colore personalizzabili)
 * - Disegno a mano libera (pennello)
 * - Forme (rettangoli, cerchi, linee, frecce)
 * - Evidenziatore avanzato
 * - Gomma per cancellare
 * - Sincronizzazione real-time via WebSocket
 */
function FabricCanvas({ 
  pageNumber, 
  width, 
  height, 
  scale = 1,
  selectedTool = 'pointer', // 'pointer', 'text', 'draw', 'rectangle', 'circle', 'arrow', 'highlight', 'eraser'
  toolOptions = {},
  onObjectAdded,
  onObjectModified,
  onObjectRemoved,
  isReadOnly = false,
  initialObjects = []
}) {
  const canvasRef = useRef(null)
  const fabricRef = useRef(null)
  const isDrawingRef = useRef(false)
  
  // Inizializza Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return
    
    // ✅ Verifica che Fabric.js sia caricato con retry
    if (!fabric) {
      console.warn('⏳ Fabric.js non ancora caricato, attendo...')
      // Retry dopo 500ms
      const retryTimer = setTimeout(() => {
        if (fabric && canvasRef.current && !fabricRef.current) {
          console.log('✅ Fabric.js caricato al secondo tentativo')
          // Forza re-render
          window.dispatchEvent(new Event('fabric-loaded'))
        } else {
          console.warn('⚠️ Fabric.js non disponibile - Le annotazioni saranno disabilitate')
        }
      }, 500)
      return () => clearTimeout(retryTimer)
    }
    
    console.log(`🎨 Inizializzazione Fabric.js canvas per pagina ${pageNumber}`)
    
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: width * scale,
      height: height * scale,
      selection: selectedTool === 'pointer',
      backgroundColor: 'transparent',
      isDrawingMode: selectedTool === 'draw',
      renderOnAddRemove: true
    })
    
    // Configura pennello per disegno
    canvas.freeDrawingBrush.color = toolOptions.color || '#000000'
    canvas.freeDrawingBrush.width = toolOptions.brushWidth || 2
    
    fabricRef.current = canvas
    
    // Event listeners per sincronizzazione
    canvas.on('object:added', (e) => {
      if (e.target && !e.target.isLoading) {
        console.log('📝 Oggetto aggiunto:', e.target.type)
        onObjectAdded?.({
          type: e.target.type,
          data: e.target.toJSON(['id', 'pageNumber'])
        })
      }
    })
    
    canvas.on('object:modified', (e) => {
      console.log('✏️ Oggetto modificato:', e.target.type)
      onObjectModified?.({
        id: e.target.id,
        data: e.target.toJSON(['id', 'pageNumber'])
      })
    })
    
    canvas.on('object:removed', (e) => {
      console.log('🗑️ Oggetto rimosso:', e.target.type)
      onObjectRemoved?.({
        id: e.target.id
      })
    })
    
    // Carica oggetti iniziali
    if (initialObjects.length > 0) {
      initialObjects.forEach(obj => {
        fabric.util.enlivenObjects([obj], ([fabricObj]) => {
          fabricObj.isLoading = true
          canvas.add(fabricObj)
          delete fabricObj.isLoading
        }, '')
      })
    }
    
    console.log(`✅ Canvas Fabric.js pronto per pagina ${pageNumber}`)
    
    return () => {
      console.log(`🧹 Cleanup canvas Fabric.js pagina ${pageNumber}`)
      canvas.dispose()
      fabricRef.current = null
    }
  }, [pageNumber, width, height, scale])
  
  // Aggiorna dimensioni canvas
  useEffect(() => {
    if (!fabricRef.current) return
    
    const canvas = fabricRef.current
    canvas.setWidth(width * scale)
    canvas.setHeight(height * scale)
    canvas.renderAll()
  }, [width, height, scale])
  
  // Aggiorna modalità disegno
  useEffect(() => {
    if (!fabricRef.current) return
    
    const canvas = fabricRef.current
    canvas.isDrawingMode = selectedTool === 'draw'
    canvas.selection = selectedTool === 'pointer'
    
    // Disabilita selezione per strumenti di creazione
    const creationTools = ['text', 'rectangle', 'circle', 'arrow']
    if (creationTools.includes(selectedTool)) {
      canvas.selection = false
      canvas.forEachObject(obj => {
        obj.selectable = false
        obj.evented = false
      })
    } else if (selectedTool === 'pointer') {
      canvas.forEachObject(obj => {
        obj.selectable = true
        obj.evented = true
      })
    }
    
    canvas.renderAll()
  }, [selectedTool])
  
  // Aggiorna opzioni strumento
  useEffect(() => {
    if (!fabricRef.current) return
    
    const canvas = fabricRef.current
    
    // Aggiorna colore e dimensione pennello
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = toolOptions.color || '#000000'
      canvas.freeDrawingBrush.width = toolOptions.brushWidth || 2
    }
  }, [toolOptions])
  
  // Gestione click per aggiungere oggetti
  useEffect(() => {
    if (!fabricRef.current) return
    
    const canvas = fabricRef.current
    
    const handleMouseDown = (e) => {
      if (!e.pointer) return
      
      const pointer = canvas.getPointer(e.e)
      
      switch (selectedTool) {
        case 'text':
          addText(pointer.x, pointer.y)
          break
        case 'rectangle':
          startDrawingShape('rectangle', pointer)
          break
        case 'circle':
          startDrawingShape('circle', pointer)
          break
        case 'arrow':
          startDrawingShape('arrow', pointer)
          break
        // ✅ 'highlight' e 'eraser' sono gestiti dal componente principale tramite selezione testo PDF
        // case 'highlight':
        //   startDrawingHighlight(pointer)
        //   break
        // case 'eraser':
        //   eraseObject(pointer)
        //   break
        default:
          break
      }
    }
    
    canvas.on('mouse:down', handleMouseDown)
    
    return () => {
      canvas.off('mouse:down', handleMouseDown)
    }
  }, [selectedTool, toolOptions])
  
  // Funzione per aggiungere testo
  const addText = (x, y) => {
    if (!fabricRef.current) return
    
    const canvas = fabricRef.current
    const text = new fabric.IText('Inserisci testo', {
      left: x,
      top: y,
      fontSize: toolOptions.fontSize || 16,
      fill: toolOptions.color || '#000000',
      fontFamily: toolOptions.fontFamily || 'Arial',
      id: Date.now(),
      pageNumber: pageNumber
    })
    
    canvas.add(text)
    canvas.setActiveObject(text)
    text.enterEditing()
    text.selectAll()
  }
  
  // Funzione per iniziare a disegnare forme
  const startDrawingShape = (shapeType, pointer) => {
    if (!fabricRef.current || isDrawingRef.current) return
    
    isDrawingRef.current = true
    const canvas = fabricRef.current
    const startX = pointer.x
    const startY = pointer.y
    
    let shape
    
    switch (shapeType) {
      case 'rectangle':
        shape = new fabric.Rect({
          left: startX,
          top: startY,
          width: 0,
          height: 0,
          fill: 'transparent',
          stroke: toolOptions.color || '#FF0000',
          strokeWidth: toolOptions.strokeWidth || 2,
          id: Date.now(),
          pageNumber: pageNumber
        })
        break
      case 'circle':
        shape = new fabric.Circle({
          left: startX,
          top: startY,
          radius: 0,
          fill: 'transparent',
          stroke: toolOptions.color || '#FF0000',
          strokeWidth: toolOptions.strokeWidth || 2,
          id: Date.now(),
          pageNumber: pageNumber
        })
        break
      case 'arrow':
        shape = new fabric.Line([startX, startY, startX, startY], {
          stroke: toolOptions.color || '#FF0000',
          strokeWidth: toolOptions.strokeWidth || 2,
          id: Date.now(),
          pageNumber: pageNumber
        })
        break
      default:
        return
    }
    
    canvas.add(shape)
    
    const handleMouseMove = (e) => {
      if (!isDrawingRef.current) return
      
      const pointer = canvas.getPointer(e.e)
      
      if (shapeType === 'rectangle') {
        shape.set({
          width: Math.abs(pointer.x - startX),
          height: Math.abs(pointer.y - startY),
          left: pointer.x < startX ? pointer.x : startX,
          top: pointer.y < startY ? pointer.y : startY
        })
      } else if (shapeType === 'circle') {
        const radius = Math.sqrt(Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2))
        shape.set({ radius: radius })
      } else if (shapeType === 'arrow') {
        shape.set({ x2: pointer.x, y2: pointer.y })
      }
      
      canvas.renderAll()
    }
    
    const handleMouseUp = () => {
      isDrawingRef.current = false
      canvas.off('mouse:move', handleMouseMove)
      canvas.off('mouse:up', handleMouseUp)
      
      // Riabilita selezione
      canvas.selection = true
      canvas.forEachObject(obj => {
        obj.selectable = true
        obj.evented = true
      })
    }
    
    canvas.on('mouse:move', handleMouseMove)
    canvas.on('mouse:up', handleMouseUp)
  }
  
  // Funzione per evidenziare
  const startDrawingHighlight = (pointer) => {
    if (!fabricRef.current || isDrawingRef.current) return
    
    isDrawingRef.current = true
    const canvas = fabricRef.current
    const startX = pointer.x
    const startY = pointer.y
    
    const highlight = new fabric.Rect({
      left: startX,
      top: startY,
      width: 0,
      height: 20, // Altezza fissa per evidenziatore
      fill: toolOptions.highlightColor || 'rgba(255, 235, 59, 0.4)',
      stroke: 'transparent',
      selectable: true,
      id: Date.now(),
      pageNumber: pageNumber
    })
    
    canvas.add(highlight)
    
    const handleMouseMove = (e) => {
      if (!isDrawingRef.current) return
      
      const pointer = canvas.getPointer(e.e)
      highlight.set({
        width: Math.abs(pointer.x - startX),
        left: pointer.x < startX ? pointer.x : startX
      })
      canvas.renderAll()
    }
    
    const handleMouseUp = () => {
      isDrawingRef.current = false
      canvas.off('mouse:move', handleMouseMove)
      canvas.off('mouse:up', handleMouseUp)
    }
    
    canvas.on('mouse:move', handleMouseMove)
    canvas.on('mouse:up', handleMouseUp)
  }
  
  // Funzione gomma
  const eraseObject = (pointer) => {
    if (!fabricRef.current) return
    
    const canvas = fabricRef.current
    const objects = canvas.getObjects()
    
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i]
      if (obj.containsPoint(pointer)) {
        canvas.remove(obj)
        break
      }
    }
  }
  
  // Metodo pubblico per caricare oggetto da WebSocket
  const loadObject = (objectData) => {
    if (!fabricRef.current) return
    
    fabric.util.enlivenObjects([objectData], ([fabricObj]) => {
      fabricObj.isLoading = true
      fabricRef.current.add(fabricObj)
      delete fabricObj.isLoading
    }, '')
  }
  
  // Metodo pubblico per aggiornare oggetto da WebSocket
  const updateObject = (objectId, objectData) => {
    if (!fabricRef.current) return
    
    const canvas = fabricRef.current
    const obj = canvas.getObjects().find(o => o.id === objectId)
    
    if (obj) {
      obj.set(objectData)
      canvas.renderAll()
    }
  }
  
  // Metodo pubblico per rimuovere oggetto da WebSocket
  const removeObject = (objectId) => {
    if (!fabricRef.current) return
    
    const canvas = fabricRef.current
    const obj = canvas.getObjects().find(o => o.id === objectId)
    
    if (obj) {
      canvas.remove(obj)
    }
  }
  
  // Metodo pubblico per esportare canvas
  const exportCanvas = () => {
    if (!fabricRef.current) return null
    
    return fabricRef.current.toJSON(['id', 'pageNumber'])
  }
  
  // Esponi metodi pubblici via ref
  useEffect(() => {
    if (fabricRef.current) {
      fabricRef.current.loadObject = loadObject
      fabricRef.current.updateObject = updateObject
      fabricRef.current.removeObject = removeObject
      fabricRef.current.exportCanvas = exportCanvas
    }
  }, [])
  
  return (
    <div 
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        // ✅ Disabilita pointer-events per highlight/eraser per permettere selezione testo PDF
        pointerEvents: isReadOnly ? 'none' : (selectedTool === 'highlight' || selectedTool === 'eraser' || selectedTool === 'textEdit') ? 'none' : 'auto',
        zIndex: selectedTool === 'pointer' ? 10 : (selectedTool === 'highlight' || selectedTool === 'eraser' || selectedTool === 'textEdit') ? 5 : 500 // Priorità bassa per highlight/eraser
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  )
}

export default FabricCanvas

