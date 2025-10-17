import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import Calendar from './Calendar'
import AppointmentCard from './AppointmentCard'
import DeedDetailCard from './DeedDetailCard'
import NotarySelection from './NotarySelection'
import './Dashboard.css'

function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(2)

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-main">
        <Header />
        <div className="dashboard-content">
          <div className="welcome-section">
            <div className="welcome-container">
              <div className="welcome-text-group">
                <h1 className="welcome-title">
                  Benvenuto 
                </h1>
                <div className="welcome-name-container">
                  <span className="welcome-name">Antonio Rossi</span>
                  <img src="/assets/element.png" alt="" className="welcome-underline" />
                </div>
              </div>
              <button className="btn-primary">Nuovo</button>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-left">
              <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            </div>

            <div className="dashboard-center">
              <AppointmentCard
                type="document"
                title="Documenti Catastali"
                description="Revisionare i documenti allegati"
                deadline="19/09/25"
              />
              <AppointmentCard
                type="appointment"
                title="Rogito - Notaio Francesco Spada"
                location="Piazza Cavour n.19 - Dogana (S. Marino)"
                time="11:15 - 12:30 AM"
                isActive={true}
              />
              <AppointmentCard
                type="document"
                title="Contratto di Compravendita"
                description="Verifica documenti preliminari"
                deadline="22/09/25"
              />
              <AppointmentCard type="empty" />
            </div>

            <div className="dashboard-right">
              <DeedDetailCard />
            </div>
          </div>

          <div className="notary-section">
            <NotarySelection />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

