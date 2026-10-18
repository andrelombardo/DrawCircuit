# Contribuire a DrawCircuit

<p align="center">
  <a href="CONTRIBUTING.md"><img src="assets/readme/english.svg" alt="Read in English" width="100" height="28" /></a>
</p>

Grazie per il tuo interesse a migliorare DrawCircuit! Ogni tipo di contributo è benvenuto, dalle correzioni di bug ai miglioramenti della documentazione fino alle nuove funzionalità.

## Prima di iniziare

Consulta le [issue esistenti](https://github.com/andrelombardo/DrawCircuit/issues) per verificare se la tua idea o il bug sono già stati discussi.

- Le issue con l’etichetta [good first issue](https://github.com/andrelombardo/DrawCircuit/labels/good%20first%20issue) sono un buon punto di partenza.
- L’etichetta [help wanted](https://github.com/andrelombardo/DrawCircuit/labels/help%20wanted) segnala attività aperte ai contributi.
- [Segnala un bug](https://github.com/andrelombardo/DrawCircuit/issues/new?template=bug_report.yml) o [proponi una funzionalità](https://github.com/andrelombardo/DrawCircuit/issues/new?template=feature_request.yml) se hai qualcosa di nuovo da condividere.

Per modifiche più ampie, apri una issue o lascia un commento prima di scrivere codice. Questo aiuta a evitare lavoro duplicato e a mantenere chiaro l’ambito delle modifiche.

## Esegui in locale

Servono [Node.js](https://nodejs.org/) e npm. La versione consigliata di Node.js è indicata in [`.nvmrc`](.nvmrc).

1. Crea un fork del repository e clonalo.
2. Crea un branch per le tue modifiche.
3. Installa le dipendenze e avvia il server di sviluppo.

```sh
git clone https://github.com/YOUR_USERNAME/DrawCircuit.git
cd DrawCircuit
nvm install
nvm use
npm ci
npm run dev
```

Apri [http://127.0.0.1:5173](http://127.0.0.1:5173) nel browser.

Per approfondire, consulta la [documentazione sull’architettura](docs/architecture.md) e la [guida utente](docs/it/guide.md).

## Linee guida per lo sviluppo

Mantieni le modifiche mirate e coerenti con il codice esistente. In particolare:

- Conserva il comportamento di disegno, selezione, modifica e annulla/ripeti, salvo quando la modifica intende aggiornarlo.
- Evita di compromettere i documenti salvati, i dati nel browser o la compatibilità con il formato JSON attuale.
- Mantieni l’interfaccia accessibile e utilizzabile su schermi di dimensioni diverse.
- Aggiorna la documentazione pertinente quando cambi il funzionamento di una funzionalità.
- Conserva le risorse incluse, i relativi avvisi di licenza e il percorso di pubblicazione `/DrawCircuit/`.
- Se modifichi l’installazione dell’app o il comportamento della cache, consulta prima la [documentazione PWA](docs/pwa.md) ed evita di cancellare dati utente non pertinenti.

## Verifica le modifiche

Prima di inviare una pull request, esegui:

```sh
npm run lint
npm test
npm run build
npm run preview -- --base /DrawCircuit/
```

Controlla l’anteprima di produzione su [http://127.0.0.1:4173/DrawCircuit/](http://127.0.0.1:4173/DrawCircuit/).

Prova anche il comportamento interessato dalle tue modifiche. Quando pertinente, verifica disegno e modifica, annulla/ripeti, salvataggio dopo la ricarica, copia come immagine, interazioni da tastiera e adattamento a schermi di dimensioni diverse.

Controlla le modifiche con `git diff` prima di creare un commit. Non includere segreti, file di build generati, configurazioni locali o materiale temporaneo usato per il debug.

## Invia una pull request

Apri una pull request verso `main` e descrivi brevemente:

- **Cosa è cambiato** e perché.
- **Come hai verificato le modifiche.**
- Le **issue correlate**, se presenti.

Screenshot o brevi registrazioni sono benvenuti quando aiutano a illustrare una modifica visibile. I controlli automatici vengono eseguiti sulle pull request; la pubblicazione viene gestita separatamente. Consulta la [guida alla pubblicazione](docs/releases.md) per i dettagli.

## Licenza

Contribuendo, accetti che i tuoi contributi vengano distribuiti con la [licenza MIT](LICENSE) del progetto. Conserva gli avvisi di licenza delle risorse di terze parti esistenti.
