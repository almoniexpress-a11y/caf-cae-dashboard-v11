
window.CAF_CAE_SERVICE_CATALOG = (() => {
  const euro = (n) => n;
  const svc = (key, title, cost, commission, special, description, required = []) => ({ key, title, cost, commission, special, description, required });
  const baseDesc = 'Domanda con dati cliente, delega, firma, upload documenti, note team e gestione stato pratica.';
  const cafComune = [
    svc('730','Modello 730',20,8,'730','Dichiarazione redditi con CU, spese, acconti, rate F24 e risultato credito/debito.'),
    svc('isee-ordinario','ISEE Ordinario',12,5,'isee','DSU ordinaria con nucleo, casa, patrimoni e redditi.'),
    svc('isee-universita','ISEE Università',12,5,'isee','ISEE per università e diritto allo studio.'),
    svc('isee-corrente','ISEE Corrente',12,5,'isee','Aggiornamento situazione reddituale/patrimoniale.'),
    svc('isee-minorenni','ISEE Minorenni',12,5,'isee','ISEE per minorenni con genitori non coniugati/non conviventi.'),
    svc('isee-socio-sanitario','ISEE Socio Sanitario',15,6,'isee','ISEE socio sanitario e prestazioni agevolate.'),
    svc('dsu-mini','DSU Mini',10,4,'isee','DSU Mini e simulazione veloce.'),
    svc('simulazione-isee','Simulazione ISEE',8,3,'isee','Pre-controllo ISEE da documenti cliente.'),
    svc('modello-redditi-pf','Modello Redditi PF',25,10,'redditi','Dichiarazione Redditi PF.'),
    svc('f24-compilazione','F24 Compilazione',5,2,'f24','Compilazione F24 e rate/scadenze.'),
    svc('imu-calcolo','IMU Calcolo',10,4,'imu','Calcolo IMU con dati catastali.'),
    svc('tari','TARI',8,3,'comune','Supporto TARI e pratiche tassa rifiuti.'),
    svc('rli-registrazione-affitto','RLI registrazione affitto',20,8,'affitto','Registrazione contratto affitto RLI.'),
    svc('registrazione-contratto-affitto','Registrazione Contratto Affitto',20,8,'affitto','Contratto affitto, registrazione e ricevuta.'),
    svc('proroga-contratto-affitto','Proroga Contratto Affitto',15,6,'affitto','Proroga contratto affitto.'),
    svc('risoluzione-contratto-affitto','Risoluzione Contratto Affitto',15,6,'affitto','Risoluzione contratto affitto.'),
    svc('contratti-comodato','Contratti comodato d’uso',18,7,'affitto','Contratto comodato e registrazione.'),
    svc('successione','Successione',40,15,'successione','Successione e documenti eredi/beni.'),
    svc('avvisi-bonari','Avvisi bonari',15,6,'fisco','Controllo avvisi bonari e risposta.'),
    svc('rottamazione-cartelle','Rottamazione Cartelle',18,7,'cartelle','Rottamazione cartelle e situazione debitoria.'),
    svc('rateizzazione-rottamazione','Rateizzazione / Rottamazione',18,7,'cartelle','Rateizzazione Agenzia Entrate Riscossione.'),
    svc('visure-catastali','Visure catastali',8,3,'visure','Richiesta visure catastali.'),
    svc('visure-camerali','Visure camerali',8,3,'visure','Visura camerale ordinaria/storica.'),
    svc('cu-supporto','CU supporto',8,3,'cu','Recupero/controllo CU e certificazioni.'),
    svc('duplicato-tessera-sanitaria','Duplicato Tessera Sanitaria',8,3,'documenti','Richiesta duplicato tessera sanitaria.'),
    svc('spid-cie','SPID / CIE',10,4,'identita','Supporto SPID/CIE e identità digitale.'),
    svc('attivazione-spid','Attivazione SPID / Identità Digitale',10,4,'identita','Attivazione identità digitale.'),
    svc('pec-firma-digitale','PEC + Firma Digitale',12,5,'pec','PEC e firma digitale.'),
    svc('stato-famiglia','Stato di Famiglia',8,3,'comune','Certificato stato di famiglia.'),
    svc('certificato-storico-residenza','Certificato Storico di Residenza',10,4,'comune','Certificato storico di residenza.'),
    svc('residenza','Residenza',12,5,'comune','Pratica residenza.'),
    svc('cambio-residenza','Cambio Residenza',12,5,'comune','Cambio residenza e dichiarazione ospitalità.'),
    svc('cambio-medico-base','Cambio medico base',8,3,'comune','Supporto scelta/cambio medico.'),
    svc('voltura-utenze','Voltura Utenze',10,4,'utenze','Voltura luce/gas/acqua.'),
    svc('subentro-utenze','Subentro Utenze',10,4,'utenze','Subentro utenze.'),
    svc('bonus-affitto','Bonus Affitto',10,4,'bonus','Domanda bonus affitto/comune.'),
    svc('bonus-energia-bollette','Bonus Energia / Bollette',8,3,'bonus','Bonus energia e bollette.'),
    svc('bonus-trasporti','Bonus Trasporti',8,3,'bonus','Bonus trasporti se aperto.'),
    svc('bonus-psicologo','Bonus Psicologo',10,4,'bonus','Bonus psicologo e verifica requisiti.'),
    svc('bonus-cultura','Bonus Cultura',8,3,'bonus','Bonus cultura / carta cultura.'),
    svc('bonus-mamma','Bonus Mamma',10,4,'bonus','Bonus mamma.'),
    svc('bonus-nuovi-nati','Bonus Nuovi Nati',10,4,'bonus','Bonus nuovi nati.'),
    svc('bonus-bebe','Bonus Bebè',10,4,'bonus','Bonus bebè.'),
    svc('bonus-asilo-nido','Bonus Asilo Nido',10,4,'bonus','Bonus asilo nido.'),
    svc('carta-acquisti','Carta Acquisti',8,3,'bonus','Carta acquisti.'),
    svc('carta-dedicata-te','Carta Dedicata a Te',8,3,'bonus','Carta dedicata a te.'),
    svc('carta-famiglia','Carta Famiglia',8,3,'bonus','Carta famiglia.'),
    svc('bonus-casa','Bonus Casa',15,6,'bonusCasa','Bonus casa.'),
    svc('bonus-ristrutturazione','Bonus Ristrutturazione',15,6,'bonusCasa','Bonus ristrutturazione.'),
    svc('bonus-mobili','Bonus Mobili',12,5,'bonusCasa','Bonus mobili.'),
    svc('bonus-libri','Bonus Libri',8,3,'scuola','Bonus libri scuola.'),
    svc('borsa-studio','Borsa di Studio',8,3,'scuola','Borsa di studio.'),
    svc('mensa-scolastica','Mensa scolastica agevolata',8,3,'scuola','Agevolazione mensa scolastica.'),
    svc('trasporto-scolastico','Trasporto scolastico agevolato',8,3,'scuola','Trasporto scolastico.'),
    svc('carta-studente','Carta dello Studente',8,3,'scuola','Carta dello studente.')
  ];
  const patronato = [
    svc('naspi','NASpI (Disoccupazione)',18,7,'naspi','Domanda NASpI con ultimo lavoro, IBAN, DID e centro impiego.'),
    svc('domanda-disoccupazione','Domanda disoccupazione',18,7,'naspi','Domanda disoccupazione.'),
    svc('dis-coll','DIS-COLL',18,7,'naspi','Domanda DIS-COLL.'),
    svc('disoccupazione-agricola','Disoccupazione Agricola',18,7,'naspi','Domanda agricola.'),
    svc('dimissioni','Dimissioni',12,5,'lavoro','Dimissioni telematiche.'),
    svc('did','DID',8,3,'lavoro','Dichiarazione immediata disponibilità.'),
    svc('patto-servizio','Patto di Servizio',8,3,'lavoro','Patto di servizio / CPI.'),
    svc('iscrizione-centro-impiego','Iscrizione Centro Impiego',8,3,'lavoro','Iscrizione CPI.'),
    svc('supporto-ricerca-lavoro','Supporto ricerca lavoro',8,3,'lavoro','Supporto ricerca lavoro.'),
    svc('sfl','Supporto per la Formazione e il Lavoro (SFL)',12,5,'inps','SFL supporto domanda.'),
    svc('supporto-formazione-lavoro','Supporto Formazione e Lavoro (SFL)',12,5,'inps','SFL supporto formazione e lavoro.'),
    svc('adi','Assegno di Inclusione (ADI)',12,5,'inps','ADI domanda.'),
    svc('assegno-unico-universale','Assegno Unico Universale',10,4,'inps','Assegno unico universale.'),
    svc('assegno-unico','Assegno Unico',10,4,'inps','Assegno unico.'),
    svc('assegno-maternita-comune','Assegno di Maternità Comune',10,4,'inps','Assegno maternità comune.'),
    svc('maternita','Maternità',12,5,'inps','Domanda maternità.'),
    svc('congedo-parentale','Congedo parentale supporto',12,5,'inps','Congedo parentale.'),
    svc('assegno-nucleo-familiare','Assegno Nucleo Familiare',10,4,'inps','ANF / assegno nucleo familiare.'),
    svc('pensione-vecchiaia','Pensione di Vecchiaia',25,10,'pensione','Domanda pensione vecchiaia.'),
    svc('pensione-anticipata','Pensione Anticipata',25,10,'pensione','Domanda pensione anticipata.'),
    svc('pensione-reversibilita','Pensione Reversibilità',25,10,'pensione','Domanda reversibilità.'),
    svc('assegno-sociale','Assegno Sociale',18,7,'pensione','Assegno sociale.'),
    svc('ape-sociale','APE Sociale',25,10,'pensione','APE sociale.'),
    svc('ricostituzione-pensione','Ricostituzione pensione',20,8,'pensione','Ricostituzione pensione.'),
    svc('invalidita-civile','Invalidità Civile',20,8,'invalidita','Invalidità civile.'),
    svc('invalidita-follow-up','Invalidità INPS follow-up',12,5,'invalidita','Follow-up pratica invalidità INPS.'),
    svc('accompagnamento','Accompagnamento',20,8,'invalidita','Indennità accompagnamento.'),
    svc('legge-104','Legge 104',15,6,'invalidita','Legge 104.'),
    svc('permessi-legge-104','Permessi Legge 104',12,5,'invalidita','Permessi 104.'),
    svc('supporto-bonus-lavoratori','Supporto bonus lavoratori',10,4,'lavoro','Bonus lavoratori.'),
    svc('pratiche-colf-badanti','Pratiche colf e badanti',25,10,'colf','Gestione colf/badanti.'),
    svc('assunzione-colf-badante','Assunzione colf/badante',25,10,'colf','Assunzione colf/badante.'),
    svc('licenziamento-colf-badante','Licenziamento colf/badante',18,7,'colf','Licenziamento colf/badante.'),
    svc('buste-paga-colf-badanti','Buste paga colf/badanti',15,6,'colf','Buste paga colf/badanti.')
  ];
  const immigration = [
    svc('permesso-rinnovo','Permesso di Soggiorno (Rinnovo)',20,8,'immigrazione','Kit rinnovo permesso.'),
    svc('carta-soggiorno','Carta di Soggiorno',25,10,'immigrazione','Carta soggiorno UE lungo periodo.'),
    svc('aggiornamento-permesso','Aggiornamento Permesso di Soggiorno',20,8,'immigrazione','Aggiornamento dati permesso.'),
    svc('conversione-permesso','Conversione Permesso di Soggiorno',25,10,'immigrazione','Conversione titolo soggiorno.'),
    svc('duplicato-permesso','Duplicato Permesso di Soggiorno',20,8,'immigrazione','Duplicato per smarrimento/deterioramento.'),
    svc('kit-permesso','Kit Permesso di Soggiorno',20,8,'immigrazione','Compilazione kit permesso.'),
    svc('appuntamento-questura','Prenotazione Appuntamento Questura',15,6,'immigrazione','Prenotazione appuntamento questura.'),
    svc('cittadinanza-italiana','Cittadinanza Italiana',30,12,'cittadinanza','Domanda cittadinanza.'),
    svc('cittadinanza-residenza','Cittadinanza per Residenza',30,12,'cittadinanza','Cittadinanza per residenza.'),
    svc('cittadinanza-matrimonio','Cittadinanza per Matrimonio',30,12,'cittadinanza','Cittadinanza per matrimonio.'),
    svc('test-lingua-cittadinanza','Supporto Test Lingua Cittadinanza',15,6,'cittadinanza','Supporto test lingua.'),
    svc('richiesta-asilo','Richiesta Asilo Politico',25,10,'asilo','Richiesta asilo politico.'),
    svc('protezione-internazionale','Domanda Protezione Internazionale',25,10,'asilo','Protezione internazionale.'),
    svc('protezione-speciale','Protezione Speciale',25,10,'asilo','Protezione speciale.'),
    svc('protezione-sussidiaria','Protezione Sussidiaria',25,10,'asilo','Protezione sussidiaria.'),
    svc('ricorso-diniego-asilo','Ricorso Diniego Asilo',35,14,'asilo','Ricorso diniego asilo.'),
    svc('commissione-territoriale','Supporto Commissione Territoriale',25,10,'asilo','Supporto commissione territoriale.'),
    svc('intervista-asilo','Preparazione Intervista Asilo',20,8,'asilo','Preparazione intervista asilo.'),
    svc('aggiornamento-asilo','Aggiornamento Pratica Asilo',18,7,'asilo','Aggiornamento asilo.'),
    svc('conversione-protezione-lavoro','Conversione Protezione Speciale → Lavoro',25,10,'asilo','Conversione protezione speciale in lavoro.'),
    svc('permesso-protezione-speciale','Permesso per Protezione Speciale',25,10,'asilo','Permesso protezione speciale.'),
    svc('ricongiungimento','Ricongiungimento familiare',30,12,'ricongiungimento','Ricongiungimento familiare.'),
    svc('idoneita-alloggiativa','Idoneità alloggiativa',18,7,'alloggio','Idoneità alloggiativa.'),
    svc('residenza-immigrazione','Residenza',12,5,'comune','Residenza per stranieri.')
  ];
  const flussi = [
    svc('decreto-flussi-supporto','Decreto Flussi Supporto',25,10,'flussi','Supporto generale decreto flussi.'),
    svc('domanda-decreto-flussi','Domanda Decreto Flussi',30,12,'flussi','Domanda decreto flussi.'),
    svc('verifica-stato-flussi','Verifica Stato Domanda Flussi',15,6,'flussi','Verifica stato pratica flussi.'),
    svc('correzione-domanda-flussi','Correzione Domanda Flussi',20,8,'flussi','Correzione errori flussi.'),
    svc('assistenza-click-day','Assistenza Click Day',30,12,'flussi','Assistenza click day.'),
    svc('registrazione-datore-lavoro','Registrazione Datore di Lavoro',20,8,'flussiDatore','Registrazione datore.'),
    svc('documenti-datore','Preparazione Documenti Datore',20,8,'flussiDatore','Preparazione documenti datore.'),
    svc('contratto-lavoro-flussi','Redazione Contratto di Lavoro',20,8,'flussiDatore','Contratto lavoro flussi.'),
    svc('invio-domanda-lavoratore-estero','Invio Domanda Lavoratore Estero',30,12,'flussiDatore','Invio domanda lavoratore estero.'),
    svc('assunzione-lavoratore','Supporto Assunzione Lavoratore',25,10,'flussiDatore','Assunzione lavoratore.'),
    svc('supporto-lavoratore-flussi','Supporto Lavoratore Flussi',20,8,'flussiLavoratore','Supporto lavoratore.'),
    svc('idoneita-flussi','Controllo Idoneità Flussi',15,6,'flussiLavoratore','Controllo idoneità.'),
    svc('verifica-requisiti-flussi','Verifica Requisiti',15,6,'flussiLavoratore','Verifica requisiti.'),
    svc('documenti-personali-flussi','Supporto Documenti Personali',15,6,'flussiLavoratore','Documenti personali.'),
    svc('ingresso-italia-flussi','Preparazione Ingresso Italia',20,8,'flussiLavoratore','Preparazione ingresso.'),
    svc('nulla-osta','Supporto Nulla Osta',20,8,'flussiAfter','Nulla osta.'),
    svc('visto-lavoro','Supporto Visto Lavoro',20,8,'flussiAfter','Visto lavoro.'),
    svc('prenotazione-prefettura','Prenotazione Prefettura',20,8,'flussiAfter','Prefettura.'),
    svc('firma-contratto-soggiorno','Firma Contratto di Soggiorno',20,8,'flussiAfter','Contratto soggiorno.'),
    svc('codice-fiscale-flussi','Richiesta Codice Fiscale',10,4,'flussiAfter','Codice fiscale.'),
    svc('attivazione-permesso-soggiorno','Attivazione Permesso di Soggiorno',20,8,'flussiAfter','Attivazione permesso.'),
    svc('flussi-rifiutata','Domanda Flussi Rifiutata',25,10,'flussiProblem','Domanda rifiutata.'),
    svc('errori-domanda-flussi','Correzione Errori Domanda',20,8,'flussiProblem','Errori domanda.'),
    svc('ritardo-risposta-flussi','Ritardo Risposta',18,7,'flussiProblem','Sollecito ritardo risposta.'),
    svc('cambio-datore-flussi','Cambio Datore di Lavoro',25,10,'flussiProblem','Cambio datore lavoro.'),
    svc('conversione-flussi-lavoro','Conversione Flussi → Lavoro',25,10,'flussiProblem','Conversione flussi lavoro.')
  ];
  const azienda = [
    svc('scia-inizio-attivita','SCIA INIZIO ATTIVITÀ',35,15,'azienda','SCIA inizio attività.'),
    svc('licenza-ristorante-bar','Licenza Ristorante / Bar',35,15,'azienda','Licenza ristorante/bar.'),
    svc('licenza-commercio-negozio','Licenza Commercio / Negozio',35,15,'azienda','Licenza commercio/negozio.'),
    svc('iscrizione-camera-commercio','Iscrizione Camera di Commercio',30,12,'azienda','Iscrizione CCIAA.'),
    svc('chiusura-partita-iva','Chiusura Partita IVA',25,10,'azienda','Chiusura P.IVA.'),
    svc('cessione-fabbricato','Cessione Fabbricato',15,6,'azienda','Cessione fabbricato.'),
    svc('apertura-partita-iva','Apertura Partita IVA',35,15,'azienda','Apertura partita IVA.'),
    svc('variazione-partita-iva','Variazione Partita IVA',25,10,'azienda','Variazione partita IVA.'),
    svc('haccp-document-support','HACCP document support',20,8,'azienda','Supporto documenti HACCP.'),
    svc('suap-practice-support','SUAP practice support',30,12,'azienda','Pratica SUAP.'),
    svc('codice-ateco-guidance','Codice ATECO guidance',10,4,'azienda','Scelta codice ATECO.')
  ];
  const academy = [
    svc('add-student','Add Student',0,0,'student','Aggiungi studente e dati corso/esame.'),
    svc('corso-caf','Corso CAF',30,10,'course','Iscrizione corso CAF.'),
    svc('corso-patronato','Corso Patronato',30,10,'course','Iscrizione corso Patronato.'),
    svc('corso-isee','Corso ISEE',25,8,'course','Iscrizione corso ISEE.'),
    svc('corso-730','Corso 730',25,8,'course','Iscrizione corso 730.'),
    svc('corso-immigrazione','Corso Immigrazione',25,8,'course','Iscrizione corso immigrazione.'),
    svc('esame-a2-b1','Esame A2/B1 Enroll',15,5,'exam','Iscrizione esame A2/B1.')
  ];
  const baseFields = [
    { name:'praticaPriority', label:'Priorità', type:'select', options:['Normale','Urgente','Scadenza vicina'] },
    { name:'deadline', label:'Scadenza / appuntamento', type:'date' },
    { name:'paymentMode', label:'Pagamento / credito agente', type:'select', options:['Credito agente'], locked:true },
    { name:'customerMessage', label:'Messaggio visibile al cliente', type:'textarea', placeholder:'Messaggio per cliente/agente...' },
    { name:'noteServizio', label:'Note interne per team', type:'textarea', placeholder:'Scrivi dettagli importanti per Team Bangla/Italy...' }
  ];
  const forms = {
    default: baseFields,
    comune: [{ name:'comuneCompetente', label:'Comune competente', type:'text' },{ name:'tipoCertificato', label:'Tipo certificato/pratica', type:'text' },...baseFields],
    bonus: [{ name:'bonusYear', label:'Anno bonus', type:'select', options:['2026','2025'] },{ name:'iseeValue', label:'Valore ISEE', type:'number' },{ name:'familyMembers', label:'Componenti nucleo', type:'number' },...baseFields],
    scuola: [{ name:'schoolName', label:'Scuola / istituto', type:'text' },{ name:'studentName', label:'Nome studente', type:'text' },{ name:'schoolYear', label:'Anno scolastico', type:'text' },...baseFields],
    isee: [{ name:'iseeType', label:'Tipo ISEE', type:'select', options:['ISEE Ordinario','ISEE Università','ISEE Corrente','ISEE Minorenni','ISEE Socio Sanitario','DSU Mini'] },{ name:'familyMembers', label:'Numero componenti nucleo', type:'number' },{ name:'rentContract', label:'Contratto affitto', type:'select', options:['No','Sì'] },{ name:'patrimonioMobiliare', label:'Patrimonio mobiliare totale', type:'number' },{ name:'redditiNucleo', label:'Redditi nucleo', type:'number' },...baseFields],
    naspi: [{ name:'lastEmployer', label:'Ultimo datore di lavoro', type:'text' },{ name:'lastWorkStart', label:'Data inizio ultimo lavoro', type:'date' },{ name:'lastWorkEnd', label:'Data fine ultimo lavoro', type:'date' },{ name:'jobType', label:'Tipo contratto', type:'select', options:['Tempo determinato','Tempo indeterminato','Part-time','Stagionale','Altro'] },{ name:'iban', label:'IBAN pagamento', type:'text' },{ name:'centroImpiego', label:'Centro per impiego', type:'text' },...baseFields],
    lavoro: [{ name:'employer', label:'Datore di lavoro', type:'text' },{ name:'contractType', label:'Tipo contratto', type:'text' },{ name:'workDate', label:'Data evento/domanda', type:'date' },...baseFields],
    inps: [{ name:'inpsBenefit', label:'Prestazione INPS', type:'text' },{ name:'iseeValue', label:'ISEE se richiesto', type:'number' },{ name:'iban', label:'IBAN', type:'text' },{ name:'childrenCount', label:'Numero figli', type:'number' },...baseFields],
    pensione: [{ name:'pensionType', label:'Tipo pensione', type:'text' },{ name:'contributiYears', label:'Anni contributi stimati', type:'number' },{ name:'lastEmployer', label:'Ultimo datore / gestione', type:'text' },...baseFields],
    invalidita: [{ name:'invalidityType', label:'Tipo richiesta', type:'select', options:['Invalidità civile','Legge 104','Accompagnamento','Permessi 104','Follow-up'] },{ name:'doctorCertificate', label:'Certificato medico introduttivo', type:'text' },{ name:'appointmentDate', label:'Data visita', type:'date' },...baseFields],
    colf: [{ name:'workerName', label:'Nome lavoratore', type:'text' },{ name:'employerName', label:'Datore famiglia', type:'text' },{ name:'workHours', label:'Ore settimanali', type:'number' },{ name:'salary', label:'Paga / stipendio', type:'number' },...baseFields],
    immigrazione: [{ name:'permitType', label:'Tipo permesso/pratica', type:'text' },{ name:'permitNumber', label:'Numero permesso/ricevuta', type:'text' },{ name:'permitExpiry', label:'Scadenza permesso', type:'date' },{ name:'questuraCity', label:'Questura/Comune', type:'text' },{ name:'passportNumber', label:'Passaporto', type:'text' },...baseFields],
    cittadinanza: [{ name:'citType', label:'Tipo cittadinanza', type:'select', options:['Residenza','Matrimonio','Altro'] },{ name:'yearsResidence', label:'Anni residenza', type:'number' },{ name:'incomeYears', label:'Redditi anni disponibili', type:'text' },{ name:'languageTest', label:'Test lingua', type:'select', options:['Presente','Da fare','Non necessario'] },...baseFields],
    asilo: [{ name:'asiloType', label:'Tipo protezione', type:'select', options:['Asilo politico','Protezione internazionale','Protezione speciale','Protezione sussidiaria','Ricorso'] },{ name:'commissionDate', label:'Data commissione/intervista', type:'date' },{ name:'territorialOffice', label:'Commissione/Questura', type:'text' },...baseFields],
    ricongiungimento: [{ name:'familyRelation', label:'Familiare da ricongiungere', type:'text' },{ name:'incomeAmount', label:'Reddito annuo', type:'number' },{ name:'housingOk', label:'Idoneità alloggio', type:'select', options:['Da fare','Presente','Non richiesta'] },{ name:'familyCountry', label:'Paese famiglia', type:'text' },...baseFields],
    alloggio: [{ name:'houseAddress', label:'Indirizzo alloggio', type:'text' },{ name:'rooms', label:'Vani / stanze', type:'text' },{ name:'ownerName', label:'Proprietario', type:'text' },{ name:'peopleCount', label:'Persone in casa', type:'number' },...baseFields],
    flussi: [{ name:'flussiYear', label:'Anno flussi', type:'select', options:['2026','2025'] },{ name:'applicationType', label:'Tipo domanda', type:'select', options:['Lavoro subordinato','Domestico','Stagionale','Conversione','Altro'] },{ name:'clickDay', label:'Click day / scadenza', type:'date' },{ name:'portalStatus', label:'Stato portale', type:'text' },...baseFields],
    flussiDatore: [{ name:'employerName', label:'Datore di lavoro', type:'text' },{ name:'vatOrCf', label:'P.IVA / CF datore', type:'text' },{ name:'companyAddress', label:'Sede datore', type:'text' },{ name:'workerName', label:'Lavoratore estero', type:'text' },{ name:'contractHours', label:'Ore/contratto', type:'text' },...baseFields],
    flussiLavoratore: [{ name:'workerName', label:'Nome lavoratore', type:'text' },{ name:'passportNo', label:'Passaporto', type:'text' },{ name:'country', label:'Paese origine', type:'text' },{ name:'employerName', label:'Datore collegato', type:'text' },...baseFields],
    flussiAfter: [{ name:'nullaOsta', label:'Numero Nulla Osta', type:'text' },{ name:'visaDate', label:'Data visto/appuntamento', type:'date' },{ name:'prefettura', label:'Prefettura', type:'text' },...baseFields],
    flussiProblem: [{ name:'problemType', label:'Tipo problema', type:'text' },{ name:'protocolNo', label:'Protocollo domanda', type:'text' },{ name:'requestedAction', label:'Azione richiesta', type:'textarea' },...baseFields],
    azienda: [{ name:'businessName', label:'Nome attività / ragione sociale', type:'text' },{ name:'vatNumber', label:'Partita IVA', type:'text' },{ name:'ateco', label:'Codice ATECO', type:'text' },{ name:'businessAddress', label:'Sede attività', type:'text' },{ name:'pec', label:'PEC', type:'email' },{ name:'sdi', label:'Codice SDI', type:'text' },{ name:'suapComune', label:'Comune/SUAP', type:'text' },{ name:'regime', label:'Regime fiscale', type:'select', options:['Forfettario','Ordinario','Semplificato','Da valutare'] },...baseFields],
    affitto: [{ name:'propertyAddress', label:'Indirizzo immobile', type:'text' },{ name:'ownerName', label:'Locatore/proprietario', type:'text' },{ name:'tenantName', label:'Conduttore/inquilino', type:'text' },{ name:'contractStart', label:'Inizio contratto', type:'date' },{ name:'rentAmount', label:'Canone', type:'number' },...baseFields],
    f24: [{ name:'taxCode', label:'Codice tributo', type:'text' },{ name:'taxYear', label:'Anno riferimento', type:'text' },{ name:'f24Amount', label:'Importo', type:'number' },{ name:'rateOption', label:'Rateizzazione', type:'select', options:['No','2 rate','3 rate','4 rate','5 rate','6 rate','7 rate'] },...baseFields],
    bonusCasa: [{ name:'propertyAddress', label:'Immobile', type:'text' },{ name:'bonusType', label:'Tipo bonus casa', type:'text' },{ name:'expenseAmount', label:'Spesa sostenuta', type:'number' },{ name:'invoiceCount', label:'Numero fatture', type:'number' },...baseFields],
    successione: [{ name:'deceasedName', label:'Defunto', type:'text' },{ name:'deathDate', label:'Data decesso', type:'date' },{ name:'heirsCount', label:'Numero eredi', type:'number' },{ name:'assets', label:'Beni/immobili/conti', type:'textarea' },...baseFields],
    cartelle: [{ name:'agencyLogin', label:'Accesso/estratto di ruolo', type:'select', options:['Da fare','Presente'] },{ name:'debtAmount', label:'Debito stimato', type:'number' },{ name:'installments', label:'Rate desiderate', type:'number' },...baseFields],
    visure: [{ name:'subjectName', label:'Intestatario / azienda', type:'text' },{ name:'subjectCfVat', label:'CF / P.IVA', type:'text' },{ name:'visuraType', label:'Tipo visura', type:'text' },...baseFields],
    documenti: [{ name:'documentType', label:'Tipo documento', type:'text' },{ name:'reason', label:'Motivo richiesta', type:'textarea' },...baseFields],
    identita: [{ name:'identityType', label:'Tipo identità', type:'select', options:['SPID','CIE','Entrambi'] },{ name:'provider', label:'Provider se scelto', type:'text' },...baseFields],
    pec: [{ name:'pecEmail', label:'PEC desiderata/esistente', type:'email' },{ name:'firmaDigitale', label:'Firma digitale', type:'select', options:['No','Sì'] },...baseFields],
    cu: [{ name:'cuYear', label:'Anno CU', type:'text' },{ name:'employer', label:'Datore/ente', type:'text' },{ name:'cuCount', label:'Numero CU', type:'number' },...baseFields],
    student: [{ name:'studentCourse', label:'Corso da assegnare', type:'select', options:['Corso CAF','Corso Patronato','Corso ISEE','Corso 730','Corso Immigrazione'] },{ name:'lessonAccess', label:'Accesso lezioni', type:'select', options:['Attivo','In attesa pagamento'] },{ name:'studentPassword', label:'Password studente', type:'text' },...baseFields],
    course: [{ name:'studentEmail', label:'Email studente', type:'email' },{ name:'courseStart', label:'Data inizio corso', type:'date' },{ name:'courseStatus', label:'Stato corso', type:'select', options:['Iscritto','Attivo','Completato'] },{ name:'progress', label:'Progress %', type:'number' },...baseFields],
    exam: [{ name:'examCity', label:'Città esame', type:'select', options:['Firenze','Roma','Genova','Venezia','Parma','Ancona','Ventimiglia','Sassari','Livorno','Vicenza','Sanremo'] },{ name:'examLevel', label:'Livello', type:'select', options:['A2','B1','A2/B1'] },{ name:'examDate', label:'Data esame', type:'date' },{ name:'examPayment', label:'Pagamento esame', type:'select', options:['Pagato','Da pagare'] },...baseFields]
  };
  const docs = {
    default:['Documento identità','Codice fiscale / Tessera sanitaria','Modulo richiesta','Delega firmata','Privacy firmata'],
    'Modello 730':['Documento identità','Codice fiscale','CU / CUD','Spese detraibili','IBAN','Delega 730 firmata','Firma privacy','Eventuali F24/acconti'],
    'ISEE Ordinario':['Documento identità','Codice fiscale famiglia','Giacenza media','Saldo conto','Contratto affitto','Patrimonio immobiliare','Targhe veicoli'],
    'NASpI (Disoccupazione)':['Documento identità','Codice fiscale','Ultima busta paga','Contratto / cessazione','IBAN','DID / centro impiego'],
    'Permesso di Soggiorno (Rinnovo)':['Passaporto','Permesso / ricevuta','Codice fiscale','Marca da bollo','Foto tessera','Contratto/CUD se necessario'],
    'Carta di Soggiorno':['Passaporto','Permesso','Codice fiscale','Reddito/CUD','Idoneità alloggio','Certificato residenza/stato famiglia'],
    'Cittadinanza Italiana':['Documento identità','Passaporto','Permesso / carta soggiorno','Residenza storica','Reddito','Certificato penale paese origine','Test lingua'],
    'Ricongiungimento familiare':['Documento identità','Permesso','Reddito','Idoneità alloggiativa','Stato famiglia','Documenti famiglia estero'],
    'Domanda Decreto Flussi':['Documenti datore','Documenti lavoratore','Contratto lavoro','Passaporto','Alloggio','SPID/CIE datore'],
    'Apertura Partita IVA':['Documento identità','Codice fiscale','Indirizzo attività','ATECO','PEC','Telefono / email'],
    'Iscrizione Camera di Commercio':['Documento identità','Codice fiscale','P.IVA','PEC','Indirizzo sede','Attività / ATECO'],
    'Esame A2/B1 Enroll':['Documento identità','Permesso / ricevuta','Codice fiscale','Residenza','Pagamento esame'],
    'Dimissioni':['Documento identità','Codice fiscale','Contratto lavoro','Ultima busta paga','PEC/email cliente'],
    'Assegno Unico Universale':['Documento identità','Codice fiscale genitori/figli','IBAN','ISEE se presente','Permesso se straniero'],
    'Invalidità Civile':['Documento identità','Codice fiscale','Certificato medico introduttivo','Referti medici','IBAN'],
    'Apertura Partita IVA':['Documento identità','Codice fiscale','Indirizzo attività','ATECO','PEC','Telefono / email'],
    'SCIA INIZIO ATTIVITÀ':['Documento identità','P.IVA/CF','Planimetria','Contratto locale','PEC','Requisiti attività'],
    'Licenza Ristorante / Bar':['Documento identità','P.IVA','SCIA/SUAP','HACCP','Contratto locale','Planimetria'],
    'Cessione Fabbricato':['Documento identità cedente','Documento ospite/acquirente','Contratto/ospitalità','Dati immobile']
  };
  return {
    agentServiceGroups: [
      { group:'CAF / Comune / Bonus / Scuola', icon:'fa-file-invoice-dollar', color:'blue', services:cafComune },
      { group:'Patronato / INPS / Lavoro', icon:'fa-landmark', color:'green', services:patronato },
      { group:'Immigrazione', icon:'fa-passport', color:'orange', services:immigration },
      { group:'Decreto Flussi', icon:'fa-plane-arrival', color:'red', services:flussi },
      { group:'Azienda', icon:'fa-building', color:'purple', services:azienda },
      { group:'Academy / Esami', icon:'fa-graduation-cap', color:'cyan', services:academy }
    ],
    serviceForms: forms,
    checklists: docs,
    commercialista: {
      companyTypes:['Ditta individuale','SRLS','SRL','SNC','SAS','Associazione','Cooperativa'],
      invoiceTypes:['Fattura vendita','Fattura acquisto','Nota credito','Proforma','Corrispettivi','Esterometro','F24','Busta paga'],
      taxRegimes:['Forfettario','Ordinario','Semplificato','Regime speciale']
    },
    sourceLinks: [
      { title:'INPS', url:'https://www.inps.it', category:'Patronato / INPS' },
      { title:'Agenzia Entrate', url:'https://www.agenziaentrate.gov.it', category:'Fisco / 730 / F24' },
      { title:'Portale Immigrazione', url:'https://www.portaleimmigrazione.it', category:'Immigrazione' },
      { title:'Ministero Interno', url:'https://www.interno.gov.it', category:'Cittadinanza / Flussi' },
      { title:'ANPR', url:'https://www.anagrafenazionale.interno.it', category:'Comune / Residenza' }
    ]
  };
})();

/* ========================= v16 Agent Pro CGN-style service forms ========================= */
(() => {
  const C = window.CAF_CAE_SERVICE_CATALOG;
  if (!C) return;
  const base = [
    { name:'praticaPriority', label:'Priorità pratica', type:'select', options:['Normale','Urgente','Scadenza vicina','Blocco / errore portale'], help:'Usato da Team Bangla/Italy per ordinare il lavoro.' },
    { name:'deadline', label:'Scadenza / appuntamento', type:'date', help:'Inserisci la scadenza cliente, bando, CPI, Questura o pagamento.' },
    { name:'portalLoginStatus', label:'Accesso portale cliente', type:'select', options:['Non necessario','SPID disponibile','CIE disponibile','Credenziali disponibili','Da richiedere al cliente'] },
    { name:'customerMessage', label:'Messaggio visibile al cliente', type:'textarea', optional:true, placeholder:'Messaggio/nota da inviare al cliente...' },
    { name:'noteServizio', label:'Note interne per team', type:'textarea', optional:true, placeholder:'Scrivi dettagli importanti, anomalie, urgenze, istruzioni...' }
  ];
  const f = (name,label,type='text',extra={}) => ({name,label,type,...extra});
  const forms = {
    'isee-ordinario': [
      f('iseeType','Tipo DSU / ISEE','select',{options:['Ordinario','Università','Corrente','Minorenni','Socio-sanitario','Residenze','Parificato']}),
      f('nucleoCount','Componenti nucleo','number'), f('minorChildren','Figli minori','number',{optional:true}),
      f('residenceHouse','Abitazione nucleo','select',{options:['Proprietà','Affitto','Comodato','Ospite','Estero']}),
      f('rentAmount','Canone annuo affitto','number',{optional:true}), f('contractRegistration','Contratto affitto registrato','select',{options:['No','Sì','Da controllare']}),
      f('incomeYear','Anno redditi','select',{options:['2024','2025','2026']}), f('bankDate','Saldo/giacenza al','select',{options:['31/12/2024','31/12/2025']}),
      f('vehicles','Veicoli / targhe','textarea',{optional:true}), f('propertyNote','Immobili / patrimonio','textarea',{optional:true}),
      ...base
    ],
    'isee-universita': [
      f('universityName','Università / ente borsa'), f('studentMatricola','Matricola / pre-iscrizione ID',{type:'text'}, {optional:true}),
      f('benefits','Benefici richiesti','select',{options:['Borsa di studio','Alloggio','Mensa','Riduzione tasse','Pacchetto completo']}),
      f('studentAbroad','Famiglia estero','select',{options:['No','Sì']}), f('countryFamily','Paese famiglia',{type:'text'}, {optional:true}),
      f('docsLegalized','Traduzione/apostille/legalizzazione','select',{options:['Completa','Provvisoria','Da integrare','Non richiesta']}),
      f('incomeYear','Anno redditi estero','select',{options:['2024','2025']}), f('bankAssetDate','Patrimonio/conti al','select',{options:['31/12/2024','31/12/2025']}),
      f('propertyStatus','Immobili famiglia','select',{options:['Nessuno','Presente','Da verificare']}), f('scholarshipPortal','Portale borsa','text',{optional:true}),
      ...base
    ],
    'isee-corrente': [
      f('ordinaryIseeProtocol','Protocollo ISEE ordinario'), f('reasonCurrent','Motivo corrente','select',{options:['Variazione lavoro','Variazione reddito','Variazione patrimonio','Altro']}),
      f('eventDate','Data evento'), f('newIncome','Reddito aggiornato stimato','number'), f('newJobStatus','Situazione lavoro attuale','text'), ...base
    ],
    'naspi': [
      f('lastEmployer','Ultimo datore di lavoro'), f('employerCfVat','CF/P.IVA datore','text',{optional:true}),
      f('lastWorkStart','Data inizio ultimo lavoro','date'), f('lastWorkEnd','Data fine lavoro','date'),
      f('cessationReason','Motivo cessazione','select',{options:['Licenziamento','Fine contratto','Dimissioni giusta causa','Risoluzione consensuale','Altro']}),
      f('contractType','Tipo contratto','select',{options:['Tempo determinato','Tempo indeterminato','Part-time','Stagionale','Apprendistato','Altro']}),
      f('workingDays','Giornate lavorate / settimane','text',{optional:true}), f('lastPayroll','Ultima busta paga mese','text',{optional:true}),
      f('ibanNaspi','IBAN pagamento'), f('didStatus','DID / Patto servizio','select',{options:['Da fare','Già fatto','Non so']}),
      f('cpi','Centro per l’Impiego','text',{optional:true}), ...base
    ],
    'dimissioni': [
      f('employer','Datore di lavoro'), f('employerEmail','Email/PEC datore','email',{optional:true}), f('contractStart','Data assunzione','date'),
      f('resignationDate','Data decorrenza dimissioni','date'), f('noticeDays','Giorni preavviso','number',{optional:true}),
      f('resignationType','Tipo dimissione','select',{options:['Volontarie','Giusta causa','Risoluzione consensuale','Periodo prova']}), ...base
    ],
    'assegno-unico-universale': [
      f('childrenCount','Numero figli','number'), f('childrenCf','CF figli','textarea'), f('parentStatus','Genitori','select',{options:['Coniugati/conviventi','Separati','Genitore unico','Altro']}),
      f('ibanAssegno','IBAN'), f('iseePresent','ISEE presente','select',{options:['Sì','No','Da fare']}), ...base
    ],
    'permesso-rinnovo': [
      f('permitType','Tipo permesso'), f('permitNumber','Numero permesso/ricevuta','text',{optional:true}), f('permitExpiry','Scadenza permesso','date'),
      f('questuraCity','Questura'), f('passportNumber','Passaporto'), f('passportExpiry','Scadenza passaporto','date'),
      f('kitType','Tipo kit','select',{options:['Rinnovo','Aggiornamento','Conversione','Duplicato','Carta UE']}),
      f('workIncome','Reddito/lavoro presente','select',{options:['Sì','No','Familiare','Studente','Altro']}), ...base
    ],
    'carta-soggiorno': [
      f('yearsInItaly','Anni soggiorno in Italia','number'), f('italianTest','Test lingua','select',{options:['Presente','Da prenotare','Esente']}),
      f('incomeAmount','Reddito annuo','number'), f('familyMembers','Componenti nucleo','number'), f('housingCertificate','Idoneità alloggio','select',{options:['Presente','Da fare','Non richiesta']}), ...base
    ],
    'cittadinanza-italiana': [
      f('citType','Tipo cittadinanza','select',{options:['Residenza','Matrimonio','Iure sanguinis/altro']}), f('residenceYears','Anni residenza','number'),
      f('incomeYears','Redditi disponibili anni','text'), f('languageB1','Certificato B1','select',{options:['Presente','Da fare','Esente']}),
      f('criminalDocs','Certificati penali origine','select',{options:['Completi','Da fare','Scaduti/da aggiornare']}), ...base
    ],
    'f24-compilazione': [f('taxCode','Codice tributo'),f('taxYear','Anno riferimento'),f('section','Sezione F24','select',{options:['Erario','INPS','Regioni','IMU e altri tributi locali','Accise']}),f('amount','Importo','number'),f('rateCode','Rateazione/regione/prov','text',{optional:true}),...base],
    'apertura-partita-iva': [f('businessName','Nome attività'),f('ateco','Codice ATECO'),f('businessAddress','Sede attività'),f('regime','Regime','select',{options:['Forfettario','Ordinario','Da valutare']}),f('pec','PEC','email',{optional:true}),f('startDate','Data inizio attività','date'),...base]
  };
  Object.entries(forms).forEach(([key, value]) => { C.serviceForms[key] = value; });
  C.serviceForms.isee = forms['isee-ordinario'];
  C.serviceForms.naspi = forms.naspi;
  C.serviceForms.immigrazione = forms['permesso-rinnovo'];
  Object.assign(C.checklists, {
    'ISEE Università':['Documento identità','Codice fiscale studente','Composizione nucleo familiare','Redditi famiglia anno richiesto','Saldo e giacenza conti','Patrimonio immobiliare al 31/12','Traduzione/apostille/legalizzazione','Portale borsa / matricola o pre-iscrizione'],
    'ISEE Corrente':['ISEE ordinario valido','Documento identità','Codice fiscale','Prova variazione lavoro/reddito','Buste paga o cessazione rapporto','Saldo/giacenza aggiornati se patrimoniale'],
    'Assegno Unico Universale':['Documento identità','Codici fiscali genitori e figli','IBAN','ISEE se presente','Permesso soggiorno se straniero','Eventuale sentenza separazione/affido'],
    'Dimissioni':['Documento identità','Codice fiscale','Contratto lavoro','Ultima busta paga','Dati datore lavoro','Data decorrenza dimissioni'],
    'F24 Compilazione':['Documento identità','Codice fiscale','Avviso/tributo da pagare','Anno riferimento','Importo e codice tributo','IBAN se pagamento richiesto'],
    'Apertura Partita IVA':['Documento identità','Codice fiscale','Indirizzo attività','Codice ATECO','PEC','Recapiti cliente','Regime scelto']
  });

  // v17 CGN-style catalog additions observed from user screen recording
  const v17Extra = [
    ['richieste-enti','Richieste Enti',8,3,'enti','Richieste enti e controlli portali collegati.'],
    ['red','RED',10,4,'red','Dichiarazione RED pensionati.'],
    ['visure-ipocatastali','Visure Ipocatastali Certificate',12,5,'visure','Visure ipocatastali certificate.'],
    ['contabilita','Contabilità',25,10,'azienda','Contabilità aziendale / ditta.'],
    ['fatturazione','Fatturazione',12,5,'azienda','Fatturazione e controllo vendite/incassi.'],
    ['dichiarazioni-comunicazioni-fiscali','Dichiarazioni e Comunicazioni Fiscali',25,10,'redditi','Dichiarazioni e comunicazioni fiscali.'],
    ['invio-telematico','Invio Telematico',15,6,'fisco','Invio telematico pratiche e documenti.'],
    ['bilancio-360','Bilancio 360°',30,12,'azienda','Bilancio 360 e riepilogo azienda.'],
    ['sportello-cciaa','Sportello CCIAA',15,6,'azienda','Sportello CCIAA.'],
    ['comunicazione-unica-cciaa','Comunicazione Unica CCIAA',20,8,'azienda','Comunicazione Unica CCIAA.'],
    ['deposito-bilancio','Deposito Bilancio',25,10,'azienda','Deposito bilancio.'],
    ['firme-contratti','Firme e Contratti',12,5,'pec','Firme e contratti digitali.'],
    ['firma-digitale','Firma Digitale',12,5,'pec','Firma digitale.'],
    ['posta-elettronica-certificata','Posta Elettronica Certificata',10,4,'pec','PEC.'],
    ['antiriciclaggio','Antiriciclaggio',15,6,'studio','Antiriciclaggio.'],
    ['privacy-gdpr','Privacy GDPR',15,6,'studio','Privacy GDPR.'],
    ['conservazione-norma','Conservazione a norma',15,6,'studio','Conservazione a norma.'],
    ['service-pratiche','Service Pratiche',10,4,'studio','Service pratiche.'],
    ['cgn-pos','CAF CAE POS',10,4,'pagamenti','POS e pagamenti.'],
    ['scanner-documenti','Scanner CAF CAE',8,3,'documenti','Scanner documenti e fascicolo.'],
    ['firma-elettronica-avanzata','Firma Elettronica Avanzata',12,5,'pec','Firma elettronica avanzata.'],
    ['pagamenti-digitali','Pagamenti Digitali',8,3,'pagamenti','Pagamenti digitali cliente.']
  ];
  const existingKeys = new Set(C.agentServiceGroups.flatMap(g => (g.services || []).map(s => s.key)));
  const aziendeGroup = C.agentServiceGroups.find(g => g.group === 'Azienda') || C.agentServiceGroups[0];
  v17Extra.forEach(([key,title,cost,commission,special,description]) => {
    if(!existingKeys.has(key) && aziendeGroup) aziendeGroup.services.push({ key, title, cost, commission, special, description, group: aziendeGroup.group });
  });
  const v17GenericForm = [
    f('portalReference','Riferimento portale / pratica','text',{optional:true}),
    f('requestType','Tipo richiesta','text'),
    f('dateRequest','Data richiesta / scadenza','date'),
    f('operatorNote','Note operatore','textarea',{optional:true}),
    ...base
  ];
  v17Extra.forEach(([key]) => { if(!C.serviceForms[key]) C.serviceForms[key] = v17GenericForm; });

})();
