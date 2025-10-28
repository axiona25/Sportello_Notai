import React, { useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Download } from 'lucide-react'
import './VideoViewer.css'

/**
 * Player video con controlli HTML5
 */
function VideoViewer({ document, onClose, userRole, currentUser }) {
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  
  const videoUrl = document?.file_path || document?.file || document?.document_url
  const isNotary = userRole === 'notaio' || userRole === 'notary' || userRole === 'admin'
  
  // Play/Pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }
  
  // Mute/Unmute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }
  
  // Volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
  }
  
  // Progress change
  const handleProgressChange = (e) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
  }
  
  // Fullscreen
  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen()
      }
    }
  }
  
  // Download
  const handleDownload = () => {
    const link = window.document.createElement('a')
    link.href = videoUrl
    link.download = document?.filename || 'video.mp4'
    link.click()
  }
  
  // Format time
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Video events
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }
  
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }
  
  const handleEnded = () => {
    setIsPlaying(false)
  }
  
  return (
    <div className="video-viewer-container">
      {/* Video element */}
      <div className="video-viewer-content">
        <video
          ref={videoRef}
          className="video-player"
          src={videoUrl}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onClick={togglePlay}
        />
      </div>
      
      {/* Controlli video */}
      <div className="video-viewer-controls">
        <div className="video-progress-container">
          <input
            type="range"
            className="video-progress-bar"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleProgressChange}
          />
          <div className="video-time">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        <div className="video-controls-row">
          <div className="video-controls-left">
            <button 
              className="video-control-btn"
              onClick={togglePlay}
              title={isPlaying ? 'Pausa' : 'Play'}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            
            <button 
              className="video-control-btn"
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            
            <input
              type="range"
              className="video-volume-slider"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
            />
          </div>
          
          <div className="video-controls-right">
            {isNotary && (
              <button 
                className="video-control-btn"
                onClick={handleDownload}
                title="Scarica video"
              >
                <Download size={20} />
              </button>
            )}
            
            <button 
              className="video-control-btn"
              onClick={toggleFullscreen}
              title="Schermo intero"
            >
              <Maximize size={20} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Info video */}
      <div className="video-viewer-info">
        <span>{document?.filename || 'Video'}</span>
      </div>
    </div>
  )
}

export default VideoViewer

