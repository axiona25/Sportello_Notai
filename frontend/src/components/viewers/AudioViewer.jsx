import React, { useRef, useState, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Download, Music } from 'lucide-react'
import './AudioViewer.css'

/**
 * Player audio con controlli HTML5 e visualizzazione forma d'onda
 */
function AudioViewer({ document, onClose, userRole, currentUser }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  
  const audioUrl = document?.file_path || document?.file || document?.document_url
  const isNotary = userRole === 'notaio' || userRole === 'notary' || userRole === 'admin'
  
  // Play/Pause
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }
  
  // Mute/Unmute
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }
  
  // Volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }
  
  // Progress change
  const handleProgressChange = (e) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }
  
  // Skip forward/backward
  const handleSkipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration)
    }
  }
  
  const handleSkipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0)
    }
  }
  
  // Download
  const handleDownload = () => {
    const link = window.document.createElement('a')
    link.href = audioUrl
    link.download = document?.filename || 'audio.mp3'
    link.click()
  }
  
  // Format time
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Audio events
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }
  
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }
  
  const handleEnded = () => {
    setIsPlaying(false)
  }
  
  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0
  
  return (
    <div className="audio-viewer-container">
      {/* Audio element (hidden) */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      
      {/* Visual player */}
      <div className="audio-viewer-content">
        <div className="audio-player-card">
          {/* Album art / Icon */}
          <div className="audio-album-art">
            <Music size={64} />
          </div>
          
          {/* Track info */}
          <div className="audio-track-info">
            <h3 className="audio-track-title">
              {document?.filename?.replace(/\.[^/.]+$/, "") || 'Audio'}
            </h3>
            <p className="audio-track-artist">
              {document?.document_type_name || 'File Audio'}
            </p>
          </div>
          
          {/* Progress bar */}
          <div className="audio-progress-container">
            <span className="audio-time">{formatTime(currentTime)}</span>
            <div className="audio-progress-wrapper">
              <input
                type="range"
                className="audio-progress-bar"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleProgressChange}
              />
              <div 
                className="audio-progress-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="audio-time">{formatTime(duration)}</span>
          </div>
          
          {/* Controls */}
          <div className="audio-controls">
            <button 
              className="audio-control-btn audio-control-secondary"
              onClick={handleSkipBackward}
              title="Indietro 10s"
            >
              <SkipBack size={20} />
            </button>
            
            <button 
              className="audio-control-btn audio-control-primary"
              onClick={togglePlay}
              title={isPlaying ? 'Pausa' : 'Play'}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            
            <button 
              className="audio-control-btn audio-control-secondary"
              onClick={handleSkipForward}
              title="Avanti 10s"
            >
              <SkipForward size={20} />
            </button>
          </div>
          
          {/* Volume and extras */}
          <div className="audio-extras">
            <div className="audio-volume-control">
              <button 
                className="audio-volume-btn"
                onClick={toggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              
              <input
                type="range"
                className="audio-volume-slider"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
              />
            </div>
            
            {isNotary && (
              <button 
                className="audio-download-btn"
                onClick={handleDownload}
                title="Scarica audio"
              >
                <Download size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AudioViewer

