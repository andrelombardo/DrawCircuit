# DrawCircuit per macOS

La versione desktop usa Tauri 2 e il WebKit di macOS. Il circuito si apre in una finestra autonoma, senza Brave, estensioni, menu del browser o barra del titolo separata. I semafori di macOS sono reali; i pulsanti Componenti e Proprietà restano nelle stesse posizioni quando i pannelli vengono nascosti. Il trascinamento della finestra è disponibile nelle intestazioni e sul bordo superiore.

I controlli della finestra condividono una fascia alta almeno 60 punti. Su macOS, una [toolbar AppKit di tipo unified](https://developer.apple.com/documentation/appkit/nswindow/toolbarstyle-swift.enum) trasparente dà ai semafori e all’indicatore di condivisione i margini nativi. L’app misura la geometria dei controlli della finestra per riservare la fascia superiore. I pulsanti delle barre laterali e il titolo Proprietà sono centrati tra il bordo superiore e il separatore dell’inspector; il pulsante sinistro è a 88 punti dal bordo. Il titolo Componenti occupa una riga compatta sotto i semafori e il pulsante della sidebar; entrambi i titoli usano lo stesso stile di sistema a 15 punti. A schermo intero, la toolbar AppKit vuota viene rimossa per evitare che copra il foglio; viene ripristinata uscendo dallo schermo intero. Il pulsante sinistro passa a 14 punti dal bordo. Il layout segue lo stato fullscreen nativo di [Tauri](https://v2.tauri.app/reference/javascript/api/namespacewindow/#isfullscreen), aggiornato durante ridimensionamenti e cambi di focus. Il separatore dell’inspector termina la fascia dell’intestazione.

Il modello, gli strumenti, la cronologia e gli esportatori sono condivisi con la versione web. L’app include tutti i file e i font necessari per lavorare offline. Le etichette matematiche usano il layout vettoriale dell’esportatore SVG, per evitare un problema di WebKit con HTML dentro SVG durante zoom e rotazione. Le misurazioni sono riutilizzate durante il trascinamento.

## Installazione e trasferimento

Apri il pacchetto `.dmg` e copia `DrawCircuit.app` in Applicazioni. Puoi anche usare la cartella Applicazioni del tuo utente. La build locale ha una firma ad hoc: la distribuzione pubblica con approvazione Gatekeeper richiede un certificato Apple Developer e notarizzazione, che non sono configurati in questo repository.

La versione Brave e i suoi dati rimangono separati. Per trasferire il lavoro:

1. Nell’app web aggiornata, apri **Esporta → Salva archivio DrawCircuit**. Il JSON contiene il circuito completo e tutti i blocchi personali.
2. Conserva questo file come copia di sicurezza.
3. Nell’app macOS usa **File → Apri archivio…** (`⌘O`). Il circuito viene aperto e i blocchi si aggiungono alla libreria esistente. Eventuali ID in conflitto ricevono un nuovo ID; il contenuto non viene sovrascritto.

È possibile aprire anche i precedenti JSON di circuito. TikZ, SVG, PNG e JSON utilizzano la finestra di salvataggio di macOS. **Copia PNG** e i comandi di testo usano gli appunti di sistema.

## Salvataggio

Il circuito, i blocchi e le preferenze vengono salvati automaticamente in:

```text
~/Library/Application Support/it.drawcircuit.desktop/workspace.json
```

La scrittura è atomica e mantiene la versione precedente in `workspace.backup.json`. Se il file principale non è leggibile, l’app recupera il backup e conserva l’originale in un file di recupero prima del prossimo salvataggio. Se nessuna copia è leggibile, l’app mostra l’errore senza sostituire i file. La chiusura attende il salvataggio; un errore lascia l’app aperta per permettere l’esportazione. Una seconda apertura porta in primo piano la finestra già aperta.

**File → Salva archivio…** (`⌘S`) crea una copia portabile del circuito e dei blocchi. **File → Esporta circuito…** (`⌘E`) apre gli esportatori. La chiusura e `⌘Q` salvano prima di uscire.

## Sviluppo e build

Richiede Node **26.5.0**, Rust stable e gli strumenti di sviluppo di Xcode. La build è stata verificata con Rust **1.99.0**. Le dipendenze Rust sono fissate in `src-tauri/Cargo.lock`.

```sh
npm ci
npm run lint
npm run test
npm run build
npm run desktop:test
npm run desktop:dev
```

Per creare l’app e il DMG per l’architettura del Mac corrente:

```sh
npm run desktop:build -- --config '{"bundle":{"createUpdaterArtifacts":false}}'
node scripts/package-macos.mjs
```

I risultati sono in `src-tauri/target/release/bundle/macos/` e `src-tauri/target/release/bundle/dmg/`. Il DMG viene creato con `hdiutil`, senza controllare Finder o modificare impostazioni del sistema. Tutti i file generati sono esclusi da Git. `dist-desktop/` non include il service worker della PWA; `npm run build` continua a produrre la versione web in `dist/`.

L’app autorizza il filesystem per i file scelti nelle finestre native. Non abilita comandi di shell, contenuti remoti o un server esterno.

## Aggiornamenti

Le nuove release macOS sono disponibili nei [download GitHub](https://github.com/andrelombardo/drawcircuit/releases/latest). L’app propone aggiornamenti firmati in una finestra centrale con icona, versione e pulsanti **Aggiorna** e **Più tardi**; i controlli automatici restano silenziosi finché non trovano un aggiornamento. È disponibile anche il controllo manuale dal menu DrawCircuit. Dopo **Aggiorna** salva tutto il workspace, verifica il pacchetto, installa e riavvia, mostrando l’avanzamento nella stessa finestra; un errore di salvataggio impedisce l’installazione. Le versioni precedenti senza updater richiedono la prima installazione manuale del nuovo DMG. Vedi [pubblicazioni e firma](releases.md) per versioni indipendenti, Secrets e build locali firmate.
