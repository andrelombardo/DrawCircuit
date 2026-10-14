# Pubblicazioni e aggiornamenti

Il workflow `Deploy DrawCircuit` gestisce due canali indipendenti su `main`.

| File modificati                                                                       | Pubblicazione  |
| ------------------------------------------------------------------------------------- | -------------- |
| `src-tauri/**`, `src/desktop/**`, `scripts/package-macos.mjs`                         | Solo app macOS |
| `src/pwa/**`, `public/**`, `index.html`                                               | Solo sito/PWA  |
| Altri file in `src/**`, dipendenze npm, Vite/TypeScript, script di release e workflow | Entrambi       |
| Documentazione, test, esempi, asset del README, configurazione di formattazione       | Nessuna        |

I file non classificati raggiungono entrambi i canali, per evitare pubblicazioni mancanti. Per una rinomina si considerano sia il percorso vecchio sia quello nuovo. Il codice specifico di una piattaforma deve rimanere nella relativa cartella; modifiche a file condivisi, anche se condizionali, richiedono entrambe le build.

## Versioni

Il sito usa tag `web-vX.Y.Z`; l’app usa release/tag `desktop-vX.Y.Z`. Ogni canale aumenta la patch della propria ultima pubblicazione riuscita. Per esempio, dopo web `1.0.4` e desktop `1.0.2`, una modifica solo desktop produce desktop `1.0.3` e lascia web `1.0.4`. Una modifica condivisa produce web `1.0.5` e desktop `1.0.3`.

`release.config.json` stabilisce le versioni iniziali e il commit già pubblicato da cui iniziare. Una versione di base superiore all’ultima pubblicazione permette un aumento deliberato di major/minor. I numeri nei manifest npm/Cargo sono quelli del progetto sorgente; il numero distribuito viene calcolato dal workflow e inserito nella build, nel bundle Tauri e nei pacchetti senza commit automatici su `main`.

Il confronto avviene rispetto al tag riuscito di **ciascun canale**, non rispetto all’ultimo push. Modifiche saltate, run fallite e push accodati vengono quindi recuperati. Le pubblicazioni sono serializzate; i job macOS Apple Silicon e Intel lavorano in parallelo. Il tag web viene creato dopo la verifica di Pages. La release desktop resta in bozza fino al caricamento completo e alla verifica crittografica di entrambi i pacchetti.

`version.json` e i meta tag `drawcircuit-version`, `drawcircuit-channel`, `drawcircuit-commit` identificano ogni build. Pages espone [version.json](https://andrelombardo.github.io/drawcircuit/version.json). Il workflow confronta questi dati con lo SHA del run. Il bundle macOS usa lo stesso numero nel pannello Informazioni e in `Info.plist`.

Da GitHub Actions è possibile avviare manualmente il workflow con `auto`, `web`, `desktop` o `both`. Un canale esplicito forza una nuova versione anche senza modifiche. `npm run release:plan` mostra il piano automatico usando i tag locali; aggiornarli prima con `git fetch --tags`. `npm run test:release` verifica routing e versionamento.

## Firma dell’updater

La configurazione Tauri contiene solo la **chiave pubblica**. La chiave privata è nel Secret di repository `TAURI_SIGNING_PRIVATE_KEY`; una password, se impostata, appartiene a `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. La chiave iniziale viene conservata fuori dal checkout in `~/.config/drawcircuit/signing/updater.key`, con directory `0700` e file `0600`. Conservare una copia sicura: perdere o sostituire questa chiave impedisce alle app già installate di accettare aggiornamenti futuri firmati con un’altra chiave. Non generarla di nuovo a ogni release.

Tauri crea gli archivi `.app.tar.gz` e le firme `.sig`. Il job di pubblicazione verifica entrambi con Minisign e genera `latest.json`, che include versione, URL HTTPS e contenuto delle firme per `darwin-aarch64` e `darwin-x86_64`. L’app usa [l’endpoint GitHub Releases](https://github.com/andrelombardo/drawcircuit/releases/latest/download/latest.json), indipendente da Pages: una pubblicazione web non cambia l’updater desktop. Il plugin Tauri verifica la firma prima di installare. La firma dell’updater è distinta dalla firma Apple Developer/notarizzazione; le build attuali mantengono la firma macOS ad hoc.

## Comportamento dell’app

Il controllo avviene all’apertura, ogni ora online e quando ritorna la connessione. È disponibile anche **DrawCircuit → Controlla aggiornamenti…**. Una versione disponibile viene proposta in una finestra compatta con **Aggiorna** e **Più tardi**, senza installazioni automatiche. Il clic su **Aggiorna** conferma l’installazione.

Dopo la conferma, l’app impedisce nuove modifiche e la chiusura, salva il circuito e attende la scrittura atomica di tutto il workspace, inclusi blocchi e preferenze. Scarica e verifica il pacchetto, attende nuovamente eventuali scritture pendenti, installa e riavvia. Una gesture o un’etichetta ancora in modifica richiedono di concludere l’operazione prima di procedere. Errori di salvataggio, download, firma o installazione lasciano l’app aperta con il lavoro disponibile e consentono di riprovare. Se fallisce solo il riavvio, **Riavvia** non reinstalla il pacchetto.

Le app `1.0.0` precedenti all’introduzione dell’updater richiedono una prima installazione del nuovo DMG: non possono acquisire da sole una funzione che non possiedono. Identifier Tauri, cartella Application Support, chiavi di salvataggio e schema dei dati rimangono invariati.

## PWA e offline

Scope, URL di avvio, cache di font e asset e worker su richiesta mantengono il comportamento esistente. Le icone del nuovo logo usano URL distinti per aggiornare anche le installazioni precedenti. Il numero di versione inserito nell’HTML cambia la revisione precache anche per release senza cambiamenti agli asset. Il worker in attesa si attiva solo con **Aggiorna**, dopo il salvataggio e fuori dalle gesture; **Più tardi** lascia aperta la versione corrente. Nessun aggiornamento cancella LocalStorage, librerie personali o dati di recupero.

## Verifica prima della pubblicazione

```sh
npm ci
npm run lint
npm run test:release
npm run test
npm run build
npm run build:desktop-ui
npm run desktop:test -- --locked
```

Per una build locale senza pacchetti di aggiornamento e senza accesso alla chiave privata:

```sh
npm run desktop:build -- --config '{"bundle":{"createUpdaterArtifacts":false}}'
node scripts/package-macos.mjs
```

Per una build firmata locale, passare `TAURI_SIGNING_PRIVATE_KEY` come percorso del file esterno e l’eventuale password nell’ambiente. Non inserire il contenuto in script, log o file del repository. Le build CI richiedono esplicitamente il Secret e falliscono se manca.
