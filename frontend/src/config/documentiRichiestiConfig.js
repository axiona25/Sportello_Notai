// Configurazione documenti richiesti per ogni tipologia di atto
// Basato su: ELENCO_ATTI_DOCUMENTI.md

export const DOCUMENTI_RICHIESTI_PER_ATTO = {
  // 1. PROCURE
  'PROCURA_GENERALE': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Codice fiscale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di stato civile", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Dati del mandatario", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Descrizione poteri conferiti", obbligatorio: true, provenienza: 'Cliente' }
  ],
  
  'PROCURA_SPECIALE_VENDITA': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Codice fiscale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di stato civile", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Dati del mandatario", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Descrizione poteri conferiti", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Atto di provenienza", obbligatorio: true, provenienza: 'Venditore' },
    { nome: "Visura catastale", obbligatorio: true, provenienza: 'PA' }
  ],
  
  'AUTENTICAZIONE_FIRMA': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' }
  ],
  
  // 2. ATTI RELATIVI ALLE PERSONE E ALLA FAMIGLIA
  'NOTORIETA_MATRIMONIO': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Codice fiscale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di stato civile", obbligatorio: true, provenienza: 'Cliente' }
  ],
  
  'REGIME_PATRIMONIALE': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Codice fiscale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di stato civile", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Estratto di matrimonio", obbligatorio: true, provenienza: 'Cliente' }
  ],
  
  // 3. SUCCESSIONI E DONAZIONI
  'TESTAMENTO_PUBBLICO': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Codice fiscale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di stato civile", obbligatorio: true, provenienza: 'Cliente' }
  ],
  
  'TESTAMENTO_SEGRETO': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Codice fiscale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di stato civile", obbligatorio: true, provenienza: 'Cliente' }
  ],
  
  'TESTAMENTO_OLOGRAFO': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Codice fiscale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di stato civile", obbligatorio: true, provenienza: 'Cliente' }
  ],
  
  'ACCETTAZIONE_EREDITA': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Codice fiscale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di stato civile", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di morte", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Dichiarazione di successione", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato degli eredi", obbligatorio: true, provenienza: 'Cliente' }
  ],
  
  'RINUNCIA_EREDITA': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Codice fiscale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di stato civile", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di morte", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Dichiarazione di successione", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato degli eredi", obbligatorio: true, provenienza: 'Cliente' }
  ],
  
  'DONAZIONE_IMMOBILI': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Codice fiscale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di stato civile", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Atto di provenienza", obbligatorio: true, provenienza: 'Venditore' },
    { nome: "Visura catastale", obbligatorio: true, provenienza: 'PA' },
    { nome: "Planimetria catastale", obbligatorio: true, provenienza: 'PA' },
    { nome: "Certificato di agibilità", obbligatorio: true, provenienza: 'PA' },
    { nome: "APE - Attestato di Prestazione Energetica", obbligatorio: true, provenienza: 'Professionista' },
    { nome: "Certificati di conformità impiantistica", obbligatorio: true, provenienza: 'Professionista' }
  ],
  
  // 4. PROPRIETÀ E COMPRAVENDITE IMMOBILIARI
  'COMPRAVENDITA_IMMOBILI': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Codice fiscale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di stato civile", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Atto di provenienza", obbligatorio: true, provenienza: 'Venditore' },
    { nome: "Visura catastale", obbligatorio: true, provenienza: 'PA' },
    { nome: "Planimetria catastale", obbligatorio: true, provenienza: 'PA' },
    { nome: "Certificato di agibilità", obbligatorio: true, provenienza: 'PA' },
    { nome: "APE - Attestato di Prestazione Energetica", obbligatorio: true, provenienza: 'Professionista' },
    { nome: "Certificati di conformità impiantistica", obbligatorio: true, provenienza: 'Professionista' }
  ],
  
  'COMPRAVENDITA_PRIMA_CASA': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Codice fiscale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di stato civile", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Atto di provenienza", obbligatorio: true, provenienza: 'Venditore' },
    { nome: "Visura catastale", obbligatorio: true, provenienza: 'PA' },
    { nome: "Planimetria catastale", obbligatorio: true, provenienza: 'PA' },
    { nome: "Certificato di agibilità", obbligatorio: true, provenienza: 'PA' },
    { nome: "APE - Attestato di Prestazione Energetica", obbligatorio: true, provenienza: 'Professionista' },
    { nome: "Certificati di conformità impiantistica", obbligatorio: true, provenienza: 'Professionista' },
    { nome: "Autodichiarazione requisiti prima casa", obbligatorio: true, provenienza: 'Acquirente' }
  ],
  
  'PERMUTA': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Codice fiscale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di stato civile", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Atto di provenienza", obbligatorio: true, provenienza: 'Venditore' },
    { nome: "Visura catastale", obbligatorio: true, provenienza: 'PA' },
    { nome: "Planimetria catastale", obbligatorio: true, provenienza: 'PA' },
    { nome: "Certificato di agibilità", obbligatorio: true, provenienza: 'PA' },
    { nome: "APE - Attestato di Prestazione Energetica", obbligatorio: true, provenienza: 'Professionista' },
    { nome: "Certificati di conformità impiantistica", obbligatorio: true, provenienza: 'Professionista' }
  ],
  
  'DIVISIONE_IMMOBILE': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Codice fiscale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di stato civile", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Atto di provenienza", obbligatorio: true, provenienza: 'Venditore' },
    { nome: "Visura catastale", obbligatorio: true, provenienza: 'PA' },
    { nome: "Planimetria catastale", obbligatorio: true, provenienza: 'PA' },
    { nome: "Certificato di agibilità", obbligatorio: true, provenienza: 'PA' },
    { nome: "APE - Attestato di Prestazione Energetica", obbligatorio: true, provenienza: 'Professionista' },
    { nome: "Certificati di conformità impiantistica", obbligatorio: true, provenienza: 'Professionista' }
  ],
  
  'LEASING': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Codice fiscale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di stato civile", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Atto di provenienza", obbligatorio: true, provenienza: 'Venditore' },
    { nome: "Visura catastale", obbligatorio: true, provenienza: 'PA' },
    { nome: "Planimetria catastale", obbligatorio: true, provenienza: 'PA' },
    { nome: "Certificato di agibilità", obbligatorio: true, provenienza: 'PA' },
    { nome: "APE - Attestato di Prestazione Energetica", obbligatorio: true, provenienza: 'Professionista' },
    { nome: "Certificati di conformità impiantistica", obbligatorio: true, provenienza: 'Professionista' },
    { nome: "Contratto di mutuo", obbligatorio: true, provenienza: 'Banca' }
  ],
  
  // 5. OBBLIGAZIONI E CONTRATTI
  'LOCAZIONE_IMMOBILE': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Codice fiscale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di stato civile", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Visura catastale", obbligatorio: true, provenienza: 'PA' },
    { nome: "Certificato di agibilità", obbligatorio: true, provenienza: 'PA' }
  ],
  
  'MUTUO_CON_IPOTECA': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Codice fiscale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di stato civile", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Contratto di mutuo", obbligatorio: true, provenienza: 'Banca' },
    { nome: "Delibera di concessione mutuo", obbligatorio: true, provenienza: 'Banca' },
    { nome: "Documentazione reddituale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Visura catastale", obbligatorio: true, provenienza: 'PA' },
    { nome: "Perizia di stima immobile", obbligatorio: true, provenienza: 'Professionista' }
  ],
  
  'MUTUO_SENZA_IPOTECA': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Codice fiscale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di stato civile", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Contratto di mutuo", obbligatorio: true, provenienza: 'Banca' },
    { nome: "Delibera di concessione mutuo", obbligatorio: true, provenienza: 'Banca' },
    { nome: "Documentazione reddituale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Visura catastale", obbligatorio: true, provenienza: 'PA' },
    { nome: "Perizia di stima immobile", obbligatorio: true, provenienza: 'Professionista' }
  ],
  
  'CANCELLAZIONE_IPOTECA': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Codice fiscale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Visura catastale", obbligatorio: true, provenienza: 'PA' }
  ],
  
  // 6. SOCIETÀ
  'COSTITUZIONE_SPA': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Codice fiscale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di iscrizione al Registro delle Imprese", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Statuto sociale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Delibera assembleare", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Atto costitutivo", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato versamento capitale sociale", obbligatorio: true, provenienza: 'Banca' }
  ],
  
  'COSTITUZIONE_SRL': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Codice fiscale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di iscrizione al Registro delle Imprese", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Statuto sociale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Delibera assembleare", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Atto costitutivo", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato versamento capitale sociale", obbligatorio: true, provenienza: 'Banca' }
  ],
  
  'VERBALE_ASSEMBLEA': [
    { nome: "Certificato di iscrizione al Registro delle Imprese", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Statuto sociale", obbligatorio: true, provenienza: 'Cliente' }
  ],
  
  'CESSIONE_QUOTE_SRL': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Codice fiscale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di iscrizione al Registro delle Imprese", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Statuto sociale", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Delibera assembleare", obbligatorio: true, provenienza: 'Cliente' }
  ],
  
  // 7. FORMALITÀ E TUTELA
  'TRASCRIZIONI': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Atto da trascrivere", obbligatorio: true, provenienza: 'Cliente' }
  ],
  
  'ISCRIZIONI': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Atto da iscrivere", obbligatorio: true, provenienza: 'Cliente' }
  ],
  
  'DICHIARAZIONE_GIURATA': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' }
  ],
  
  'CERTIFICAZIONE_COPIE': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Documento da certificare", obbligatorio: true, provenienza: 'Cliente' }
  ],
  
  // 8. NORME SPECIALI
  'SCRITTURA_PRIVATA': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' }
  ],
  
  'VENDITA_AUTOVEICOLO': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Carta di circolazione", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di proprietà", obbligatorio: true, provenienza: 'Cliente' }
  ],
  
  'COMPRAVENDITA_IMBARCAZIONE': [
    { nome: "Documento d'identità valido", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Certificato di proprietà imbarcazione", obbligatorio: true, provenienza: 'Cliente' },
    { nome: "Licenza di navigazione", obbligatorio: true, provenienza: 'Cliente' }
  ]
}

// Funzione helper per ottenere i documenti richiesti per un atto
export const getDocumentiRichiestiPerAtto = (codiceAtto) => {
  if (!codiceAtto) {
    console.warn('⚠️ getDocumentiRichiestiPerAtto: codiceAtto non fornito')
    return []
  }
  
  // Normalizza il codice atto a maiuscolo per evitare problemi di case-sensitivity
  const codiceNormalizzato = codiceAtto.toUpperCase()
  const documenti = DOCUMENTI_RICHIESTI_PER_ATTO[codiceNormalizzato] || []
  
  console.log(`📋 Documenti per ${codiceNormalizzato}:`, documenti.length, 'documenti trovati')
  
  return documenti
}

// Icone per i diversi tipi di provenienza
export const ICONE_PROVENIENZA = {
  'Cliente': '👤',
  'Venditore': '🏢',
  'Acquirente': '🏢',
  'Banca': '🏦',
  'PA': '🏛️',
  'Professionista': '👨‍💼'
}

