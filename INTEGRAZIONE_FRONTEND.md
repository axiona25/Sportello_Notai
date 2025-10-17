# Guida Integrazione Frontend - Sistema Ruoli Utenti

## 🎯 Obiettivo

Questa guida mostra come integrare il sistema di gestione ruoli utente (Clienti, Notai, Partners) nel frontend React.

## 🔐 Autenticazione

Prima di accedere alle API dei profili, è necessario autenticarsi:

```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:8001/api/accounts/login/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  // Salva i token
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
};
```

## 👤 Gestione Clienti

### 1. Creare un Cliente

```javascript
const createCliente = async (clienteData) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('http://localhost:8001/api/accounts/clienti/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      email: clienteData.email,
      password: clienteData.password,
      nome: clienteData.nome,
      cognome: clienteData.cognome,
      sesso: clienteData.sesso, // 'M', 'F', 'A'
      data_nascita: clienteData.dataNascita, // 'YYYY-MM-DD'
      luogo_nascita: clienteData.luogoNascita,
      codice_fiscale: clienteData.codiceFiscale,
      indirizzo: clienteData.indirizzo,
      civico: clienteData.civico,
      cap: clienteData.cap,
      citta: clienteData.citta,
      nazione: clienteData.nazione || 'Italia',
      stato_civile: clienteData.statoCivile, // 'celibe_nubile', 'coniugato', etc.
      regime_patrimoniale: clienteData.regimePatrimoniale, // opzionale
      cellulare: clienteData.cellulare,
      mail: clienteData.mail,
    }),
  });
  
  return await response.json();
};
```

### 2. Ottenere Lista Clienti

```javascript
const getClienti = async (filters = {}) => {
  const token = localStorage.getItem('access_token');
  
  // Costruisci query params
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.citta) params.append('citta', filters.citta);
  if (filters.statoCivile) params.append('stato_civile', filters.statoCivile);
  
  const response = await fetch(
    `http://localhost:8001/api/accounts/clienti/?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  return await response.json();
};
```

### 3. Aggiornare Cliente

```javascript
const updateCliente = async (clienteId, updateData) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(
    `http://localhost:8001/api/accounts/clienti/${clienteId}/`,
    {
      method: 'PATCH', // Usa PATCH per aggiornamento parziale
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    }
  );
  
  return await response.json();
};
```

### 4. Upload Documenti Cliente

```javascript
const uploadDocumentoCliente = async (clienteId, documentType, file) => {
  const token = localStorage.getItem('access_token');
  
  const formData = new FormData();
  formData.append(documentType, file); // 'carta_identita', 'passaporto', etc.
  
  const response = await fetch(
    `http://localhost:8001/api/accounts/clienti/${clienteId}/`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    }
  );
  
  return await response.json();
};
```

## 📋 Componente React - Form Cliente

```jsx
import React, { useState } from 'react';

const ClienteForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nome: '',
    cognome: '',
    sesso: 'M',
    dataNascita: '',
    luogoNascita: '',
    codiceFiscale: '',
    indirizzo: '',
    civico: '',
    cap: '',
    citta: '',
    nazione: 'Italia',
    statoCivile: 'celibe_nubile',
    regimePatrimoniale: 'non_applicabile',
    cellulare: '',
    mail: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const cliente = await createCliente(formData);
      alert('Cliente creato con successo!');
      console.log('Cliente:', cliente);
    } catch (error) {
      alert('Errore nella creazione del cliente');
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Registrazione Cliente</h2>
      
      {/* Account */}
      <section>
        <h3>Credenziali Account</h3>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
      </section>

      {/* Dati Anagrafici */}
      <section>
        <h3>Dati Anagrafici</h3>
        <input
          type="text"
          name="nome"
          placeholder="Nome"
          value={formData.nome}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="cognome"
          placeholder="Cognome"
          value={formData.cognome}
          onChange={handleChange}
          required
        />
        <select
          name="sesso"
          value={formData.sesso}
          onChange={handleChange}
          required
        >
          <option value="M">Maschio</option>
          <option value="F">Femmina</option>
          <option value="A">Altro</option>
        </select>
        <input
          type="date"
          name="dataNascita"
          value={formData.dataNascita}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="luogoNascita"
          placeholder="Luogo di Nascita"
          value={formData.luogoNascita}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="codiceFiscale"
          placeholder="Codice Fiscale"
          value={formData.codiceFiscale}
          onChange={handleChange}
          maxLength={16}
          required
        />
      </section>

      {/* Residenza */}
      <section>
        <h3>Residenza</h3>
        <input
          type="text"
          name="indirizzo"
          placeholder="Indirizzo"
          value={formData.indirizzo}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="civico"
          placeholder="Civico"
          value={formData.civico}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="cap"
          placeholder="CAP"
          value={formData.cap}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="citta"
          placeholder="Città"
          value={formData.citta}
          onChange={handleChange}
          required
        />
      </section>

      {/* Stato Civile */}
      <section>
        <h3>Stato Civile</h3>
        <select
          name="statoCivile"
          value={formData.statoCivile}
          onChange={handleChange}
          required
        >
          <option value="celibe_nubile">Celibe/Nubile</option>
          <option value="coniugato">Coniugato/a</option>
          <option value="divorziato">Divorziato/a</option>
          <option value="vedovo">Vedovo/a</option>
          <option value="separato">Separato/a</option>
          <option value="unione_civile">Unione Civile</option>
        </select>
        <select
          name="regimePatrimoniale"
          value={formData.regimePatrimoniale}
          onChange={handleChange}
        >
          <option value="non_applicabile">Non Applicabile</option>
          <option value="comunione_beni">Comunione dei Beni</option>
          <option value="separazione_beni">Separazione dei Beni</option>
          <option value="fondo_patrimoniale">Fondo Patrimoniale</option>
        </select>
      </section>

      {/* Contatti */}
      <section>
        <h3>Contatti</h3>
        <input
          type="tel"
          name="cellulare"
          placeholder="Cellulare"
          value={formData.cellulare}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="mail"
          placeholder="Email"
          value={formData.mail}
          onChange={handleChange}
          required
        />
      </section>

      <button type="submit">Registra Cliente</button>
    </form>
  );
};

export default ClienteForm;
```

## 📊 Dashboard Cliente

```jsx
import React, { useEffect, useState } from 'react';

const ClienteDashboard = () => {
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClienteProfile = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (user.role === 'cliente') {
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(
            'http://localhost:8001/api/accounts/clienti/',
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );
          
          const data = await response.json();
          
          // Il cliente vede solo il proprio profilo
          if (data.results && data.results.length > 0) {
            setCliente(data.results[0]);
          }
        } catch (error) {
          console.error('Errore nel caricamento profilo:', error);
        }
      }
      
      setLoading(false);
    };

    fetchClienteProfile();
  }, []);

  if (loading) return <div>Caricamento...</div>;
  if (!cliente) return <div>Profilo non trovato</div>;

  return (
    <div className="cliente-dashboard">
      <h1>Benvenuto, {cliente.nome_completo}</h1>
      
      <section className="profilo">
        <h2>Il Tuo Profilo</h2>
        <div>
          <p><strong>Nome Completo:</strong> {cliente.nome_completo}</p>
          <p><strong>Codice Fiscale:</strong> {cliente.codice_fiscale}</p>
          <p><strong>Data di Nascita:</strong> {cliente.data_nascita}</p>
          <p><strong>Residenza:</strong> {cliente.indirizzo_completo}</p>
          <p><strong>Email:</strong> {cliente.mail}</p>
          <p><strong>Cellulare:</strong> {cliente.cellulare}</p>
          <p><strong>Stato Civile:</strong> {cliente.stato_civile}</p>
        </div>
      </section>

      <section className="documenti">
        <h2>Documenti</h2>
        <div>
          {cliente.carta_identita && (
            <a href={cliente.carta_identita} target="_blank" rel="noopener noreferrer">
              📄 Carta d'Identità
            </a>
          )}
          {cliente.documento_codice_fiscale && (
            <a href={cliente.documento_codice_fiscale} target="_blank" rel="noopener noreferrer">
              📄 Codice Fiscale
            </a>
          )}
          {cliente.passaporto && (
            <a href={cliente.passaporto} target="_blank" rel="noopener noreferrer">
              📄 Passaporto
            </a>
          )}
        </div>
      </section>

      <section className="azioni">
        <h2>Azioni Rapide</h2>
        <button>Prenota Appuntamento</button>
        <button>Richiedi Atto</button>
        <button>Modifica Profilo</button>
      </section>
    </div>
  );
};

export default ClienteDashboard;
```

## 🔄 Gestione dello Stato con Context

```jsx
// contexts/UserContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carica utente dal localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      loadUserProfile(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const loadUserProfile = async (user) => {
    const token = localStorage.getItem('access_token');
    
    let endpoint = '';
    if (user.role === 'cliente') {
      endpoint = '/api/accounts/clienti/';
    } else if (user.role === 'notaio') {
      endpoint = '/api/accounts/notai/';
    } else if (user.role === 'partner') {
      endpoint = '/api/accounts/partners/';
    }

    if (endpoint) {
      try {
        const response = await fetch(`http://localhost:8001${endpoint}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          setUserProfile(data.results[0]);
        }
      } catch (error) {
        console.error('Errore caricamento profilo:', error);
      }
    }
  };

  const login = async (email, password) => {
    const response = await fetch('http://localhost:8001/api/accounts/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    setUser(data.user);
    await loadUserProfile(data.user);
    
    return data;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setUserProfile(null);
  };

  return (
    <UserContext.Provider value={{
      user,
      userProfile,
      loading,
      login,
      logout,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
```

## 🛣️ Routing Basato su Ruoli

```jsx
// App.js
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from './contexts/UserContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useUser();

  if (loading) return <div>Caricamento...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Dashboard Cliente */}
          <Route
            path="/dashboard/cliente"
            element={
              <ProtectedRoute allowedRoles={['cliente']}>
                <ClienteDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Dashboard Notaio */}
          <Route
            path="/dashboard/notaio"
            element={
              <ProtectedRoute allowedRoles={['notaio']}>
                <NotaioDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}
```

## 📝 Note Importanti

1. **Gestione Token:** Implementa un refresh token automatico quando l'access token scade
2. **Validazione:** Valida i dati lato client prima di inviarli al backend
3. **Errori:** Gestisci gli errori in modo appropriato e mostra messaggi utili all'utente
4. **Upload File:** Per l'upload di file, usa `FormData` invece di JSON
5. **Sicurezza:** Non salvare dati sensibili nel localStorage in produzione

## 🚀 Prossimi Passi

1. Implementare il refresh automatico dei token
2. Aggiungere validazione real-time dei form
3. Implementare notifiche per le azioni degli utenti
4. Creare componenti riutilizzabili per i form
5. Aggiungere gestione errori globale

