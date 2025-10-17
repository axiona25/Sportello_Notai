import React from 'react'
import { Star, FileText, Calendar, Phone, Mail, PenTool, UserX } from 'lucide-react'
import './NotarySelection.css'

function NotarySelection() {
  const notaries = [
    {
      id: 1,
      name: 'Pier Luigi Bacciocchi',
      address: 'Via G. Fabbro n.12 - Borgo Maggiore',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=300&fit=crop&crop=faces'
    },
    {
      id: 2,
      name: 'Dennis Beccari',
      address: 'Via 28 Luglio n.212 - Borgo Maggiore',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=300&fit=crop&crop=faces'
    },
    {
      id: 3,
      name: 'Chiara Benedettini',
      address: 'Via 28 Luglio n.212 - Borgo Maggiore',
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop&crop=faces'
    },
    {
      id: 4,
      name: 'Orietta Berardi',
      address: 'Via 28 Luglio n.212 - Borgo Maggiore',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=300&fit=crop&crop=faces'
    },
    {
      id: 5,
      name: 'Monica Bernardi',
      address: 'Piazza Marino Tini n.10 - Dogana',
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&h=300&fit=crop&crop=faces'
    },
    {
      id: 6,
      name: 'Gianni Cardelli',
      address: 'Piazza Grande n.12 - Borgo Maggiore',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=faces'
    },
    {
      id: 7,
      name: 'Daniele Cherubini',
      address: 'Via 28 Luglio n.218 - Borgo Maggiore',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=300&fit=crop&crop=faces'
    },
    {
      id: 8,
      name: 'Fabio Di Pasquale',
      address: 'Via L. Cibrario n.25 - Borgo Maggiore',
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop&crop=faces'
    },
    {
      id: 9,
      name: 'Marco Rossini',
      address: 'Piazza della Libertà n.8 - Città',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=300&fit=crop&crop=faces'
    },
    {
      id: 10,
      name: 'Stefano Paolini',
      address: 'Via del Serrone n.19 - Fiorentino',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=300&fit=crop&crop=faces'
    },
    {
      id: 11,
      name: 'Paolo Gatti',
      address: 'Contrada Omerelli n.34 - Domagnano',
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&h=300&fit=crop&crop=faces'
    },
    {
      id: 12,
      name: 'Giovanni Casadei',
      address: 'Via Montegiardino n.15 - Montegiardino',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=300&fit=crop&crop=faces'
    }
  ]

  return (
    <div className="notary-selection">
      <div className="notary-selection-header">
        <h2 className="notary-selection-title">Scegli il tuo Notaio</h2>
        <a href="#" className="notary-selection-link">Vedi Tutti</a>
      </div>

      <div className="notary-cards-wrapper">
        <div className="notary-cards-container">
          {notaries.map(notary => (
            <div key={notary.id} className="notary-card">
              <img src={notary.image} alt={notary.name} className="notary-image" />
              <div className="notary-name-rating">
                <h3 className="notary-name">{notary.name}</h3>
                <div className="notary-rating">
                  <Star size={14} className="star-icon" fill="currentColor" />
                  <span>{notary.rating}</span>
                </div>
              </div>
              <p className="notary-address">{notary.address}</p>
              <div className="notary-services">
                <span className="services-label">Servizi Offerti</span>
                <span className="services-separator"></span>
                <div className="services-icons">
                  <Calendar size={14} />
                  <span className="icon-separator"></span>
                  <Phone size={14} />
                  <span className="icon-separator"></span>
                  <Mail size={14} />
                  <span className="icon-separator"></span>
                  <FileText size={14} />
                  <span className="icon-separator"></span>
                  <PenTool size={14} />
                </div>
              </div>
            </div>
          ))}
          
          <div className="notary-card notary-card-placeholder">
            <div className="placeholder-content">
              <UserX size={48} className="placeholder-icon" strokeWidth={1.5} />
              <p className="placeholder-text">Non ci sono altri notai disponibili</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotarySelection

