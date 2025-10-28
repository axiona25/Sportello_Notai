import React, { useState } from 'react'
import { ZoomIn, ZoomOut, RotateCw, Maximize, Download } from 'lucide-react'
import './ImageViewer.css'

/**
 * Visualizzatore immagini con zoom, pan e rotazione
 */
function ImageViewer({ document, onClose, userRole, currentUser }) {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  const imageUrl = document?.file_path || document?.file || document?.document_url
  const isNotary = userRole === 'notaio' || userRole === 'notary' || userRole === 'admin'
  
  // Gestione zoom
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25))
  const handleResetZoom = () => {
    setZoom(100)
    setPosition({ x: 0, y: 0 })
  }
  
  // Gestione rotazione
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)
  
  // Gestione pan (drag)
  const handleMouseDown = (e) => {
    if (zoom > 100) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }
  
  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }
  
  const handleMouseUp = () => setIsDragging(false)
  
  // Download immagine
  const handleDownload = () => {
    const link = window.document.createElement('a')
    link.href = imageUrl
    link.download = document?.filename || 'immagine.jpg'
    link.click()
  }
  
  return (
    <div className="image-viewer-container">
      {/* Toolbar controlli */}
      <div className="image-viewer-toolbar">
        <div className="image-toolbar-section">
          <button 
            className="image-toolbar-btn"
            onClick={handleZoomOut}
            disabled={zoom <= 25}
            title="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
          
          <span className="image-zoom-indicator">{zoom}%</span>
          
          <button 
            className="image-toolbar-btn"
            onClick={handleZoomIn}
            disabled={zoom >= 300}
            title="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
          
          <button 
            className="image-toolbar-btn"
            onClick={handleResetZoom}
            title="Reset visualizzazione"
          >
            <Maximize size={18} />
          </button>
        </div>
        
        <div className="image-toolbar-section">
          {isNotary && (
            <>
              <button 
                className="image-toolbar-btn"
                onClick={handleRotate}
                title={`Ruota (${rotation}°)`}
              >
                <RotateCw size={18} />
              </button>
              
              <button 
                className="image-toolbar-btn"
                onClick={handleDownload}
                title="Scarica immagine"
              >
                <Download size={18} />
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Contenitore immagine */}
      <div 
        className="image-viewer-content"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: zoom > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <img
          src={imageUrl}
          alt={document?.filename || 'Immagine'}
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transition: isDragging ? 'none' : 'transform 0.3s ease',
            userSelect: 'none',
            pointerEvents: 'none'
          }}
          draggable={false}
        />
      </div>
      
      {/* Info immagine */}
      <div className="image-viewer-info">
        <span>{document?.filename || 'Immagine'}</span>
      </div>
    </div>
  )
}

export default ImageViewer

