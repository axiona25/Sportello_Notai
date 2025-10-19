import React, { useState } from 'react'
import { 
  Image, 
  Video, 
  Music, 
  FolderOpen, 
  File, 
  Star,
  FileArchive,
  FileText,
  Link,
  MoreVertical
} from 'lucide-react'
import './DocumentiContent.css'

function DocumentiContent() {
  const [favorites, setFavorites] = useState([2, 4, 8, 11])

  const categories = [
    { icon: Image, name: 'Foto', count: '2451 foto', color: '#1668B0' },
    { icon: Video, name: 'Video', count: '31 video', color: '#1668B0' },
    { icon: Music, name: 'Audio', count: '19 audio', color: '#1668B0' },
    { icon: FolderOpen, name: 'Documenti', count: '961 files', color: '#1668B0' },
    { icon: File, name: 'Altro', count: '61 Files', color: '#1668B0' }
  ]

  const files = [
    { id: 1, name: 'Designerzafor.', type: 'File Zip', size: '512 MB', date: '24 Mag, 2020 alle 17:30', icon: FileArchive, linked: false },
    { id: 2, name: '@designerzafor at twitter', type: 'Compresso', size: '128 MB', date: '8 Set, 2020 alle 17:30', icon: FileArchive, linked: false },
    { id: 3, name: 'Dribbble, Behance & Portfolio Project List & Details', type: 'File PDF', size: '128 MB', date: '1 Feb, 2020 alle 12:43', icon: FileText, linked: false },
    { id: 4, name: 'Templatecookie Logo v1.0', type: 'File PDF', size: '12 MB', date: '17 Ott, 2020 alle 12:43', icon: FileText, linked: true },
    { id: 5, name: 'Templatecookie', type: 'Cartella', size: '1.2 GB', date: '22 Ott, 2020 alle 12:43', icon: FolderOpen, linked: false },
    { id: 6, name: 'Templatecookie - Themeforest Templates', type: 'File Zip', size: '128 MB', date: '1 Feb, 2020 alle 17:30', icon: FileArchive, linked: true },
    { id: 7, name: 'Codeshikhi', type: 'File PDF', size: '256 MB', date: '17 Ott, 2020 alle 12:43', icon: FileText, linked: false },
    { id: 8, name: 'Echotemplate Logo v1.0', type: 'Compresso', size: '1.2 GB', date: '24 Mag, 2020 alle 12:43', icon: FileArchive, linked: false },
    { id: 9, name: 'Echotemplate', type: 'File Zip', size: '14.6 GB', date: '1 Feb, 2020 alle 17:30', icon: FileArchive, linked: false },
    { id: 10, name: 'Zakirsoft Logo v1.0', type: 'Compresso', size: '16 MB', date: '22 Ott, 2020 alle 12:43', icon: FileArchive, linked: false },
    { id: 11, name: 'Zakirsoft', type: 'File PDF', size: '128 MB', date: '21 Set, 2020 alle 17:30', icon: FileText, linked: false }
  ]

  const toggleFavorite = (id) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    )
  }

  return (
    <div className="documenti-content-main">
      {/* Header */}
      <div className="documenti-content-header">
        <h2 className="documenti-content-title">I miei Files</h2>
      </div>

      {/* Categories Cards */}
      <div className="documenti-categories">
        {categories.map((category, index) => {
          const IconComponent = category.icon
          return (
            <div key={index} className="documenti-category-card">
              <div className="documenti-category-icon" style={{ color: category.color }}>
                <IconComponent size={28} strokeWidth={2} />
              </div>
              <div className="documenti-category-info">
                <h3 className="documenti-category-name">{category.name}</h3>
                <p className="documenti-category-count">{category.count}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Files Table */}
      <div className="documenti-table-container">
        <table className="documenti-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th style={{ textAlign: 'left' }}>NOME</th>
              <th style={{ textAlign: 'left', width: '140px' }}>TIPO</th>
              <th style={{ textAlign: 'left', width: '120px' }}>DIMENSIONI</th>
              <th style={{ textAlign: 'left', width: '220px' }}>DATA DI CARICAMENTO</th>
              <th style={{ width: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => {
              const FileIcon = file.icon
              const isFavorite = favorites.includes(file.id)
              
              return (
                <tr key={file.id} className="documenti-table-row">
                  <td>
                    <button 
                      className="documenti-favorite-btn"
                      onClick={() => toggleFavorite(file.id)}
                    >
                      <Star 
                        size={18} 
                        strokeWidth={2}
                        fill={isFavorite ? '#FFB800' : 'none'}
                        color={isFavorite ? '#FFB800' : '#9CA3AF'}
                      />
                    </button>
                  </td>
                  <td>
                    <div className="documenti-file-name">
                      <FileIcon size={20} strokeWidth={2} color="#6B7280" />
                      <span>{file.name}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'left' }}>
                    <div className="documenti-file-type">
                      <span>{file.type}</span>
                      {file.linked && <Link size={14} strokeWidth={2} color="#6B7280" />}
                    </div>
                  </td>
                  <td style={{ textAlign: 'left' }}>
                    <span className="documenti-file-size">{file.size}</span>
                  </td>
                  <td style={{ textAlign: 'left' }}>
                    <span className="documenti-file-date">{file.date}</span>
                  </td>
                  <td>
                    <button className="documenti-options-btn">
                      <MoreVertical size={18} strokeWidth={2} color="#9CA3AF" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DocumentiContent

