import { useRef } from 'react';
import { isMac, isStandalone, shortcut } from '../../utils/platform';
import { X } from 'lucide-react';
import { useDialogFocus } from './useDialogFocus';
export function HelpDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLElement>(null);
  useDialogFocus(dialog, onClose);
  return (
    <div className="modal-backdrop">
      <section
        ref={dialog}
        className="help-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-heading"
      >
        <button
          className="modal-close"
          aria-label="Chiudi guida"
          title="Chiudi guida"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <span className="eyebrow">POCHI GESTI, UN BEL CIRCUITO</span>
        <h2 id="help-heading">Disegna. Collega. Annota.</h2>
        <div className="help-steps">
          <p>
            <b>01 · Posiziona</b>Scegli un componente a sinistra, poi clicca sul foglio. Puoi anche
            trascinarlo. Ogni clic ne inserisce un altro; R ruota l’anteprima, Esc termina.
          </p>
          <p>
            <b>02 · Collega</b>Premi W, clicca un terminale, un nodo o un filo: sul filo nasce un
            nodo reale. I clic sul foglio aggiungono svolte; doppio clic o Enter termina su un punto
            libero. Il filo si allinea al punto iniziale e all’ultima svolta, anche fuori griglia.
            Backspace rimuove l’ultima svolta. Scegli Ortogonale, 45° o Libero; Shift + W cambia
            routing.
          </p>
          <p>
            <b>03 · Annota</b>Premi N per un nodo, A per una freccia, L per una maglia. Usa Testo
            nella toolbar per scrivere sul foglio. Trascina per disegnare una freccia o una maglia.
            Doppio clic modifica direttamente testi ed etichette; Enter o clic esterno conferma, Esc
            annulla. Nodo resta attivo fino a Esc, V o cambio strumento.
          </p>
        </div>
        <div className="shortcut-grid">
          {[
            ['Space + trascina', 'Sposta il foglio'],
            ['Rotellina / trackpad', 'Zoom'],
            ['↑ ↓ ← →', 'Sposta di precisione (1 unità)'],
            ['Shift + ↑↓←→', 'Spostamento maggiore (10 unità)'],
            ['Shift + clic', 'Selezione multipla'],
            ['N · clic ripetuti', 'Inserisci più nodi · Esc termina'],
            ['Shift + W', 'Cambia routing del filo'],
            ['Alt/Option + clic label', 'Scegli tra label sovrapposte'],
            ['Alt/Option + clic', 'Seleziona l’evidenziazione sotto al circuito'],
            ['Shift + Alt/Option + clic', 'Seleziona più evidenziazioni sovrapposte'],
            ['Shift + handle rotazione', 'Aggancia la freccia a multipli di 15°'],
            ['Trascina sul foglio', 'Selezione a rettangolo'],
            ['R', 'Ruota componente di 45° · graffa/staffa di 90°'],
            ['Enter', 'Modifica nome o etichetta'],
            ['Alt + clic handle', 'Rimuovi svolta filo'],
            ['L', 'Disegna maglia ellittica'],
            [shortcut('D'), 'Duplica'],
            [`${shortcut('C')} / ${shortcut('X')} / ${shortcut('V')}`, 'Copia / taglia / incolla'],
            ['Option/Alt + trascina', 'Disabilita snapping nello spostamento'],
            ['Shift durante spostamento', 'Mostra altre quote'],
            ['Delete / Backspace', 'Elimina selezione · su un’etichetta elimina solo il testo'],
            ['Shift + Delete / Backspace', 'Da un’etichetta elimina anche l’oggetto'],
            [shortcut('Z'), 'Annulla'],
            [shortcut('Z', true), 'Ripeti'],
            ['G', 'Mostra / nascondi griglia'],
            ['T', 'Mostra/nascondi componenti'],
            ['1', 'Adatta alla vista'],
            ['+ / −', 'Zoom avanti / indietro'],
            ['H · V', 'Pan / selezione'],
            [shortcut('A'), 'Seleziona tutto'],
            ['Esc', 'Selezione / annulla filo'],
            ...(isStandalone() && isMac() ? [['⌘T', 'Mostra / nascondi Componenti']] : []),
          ].map(([key, description]) => (
            <div key={key}>
              <span>{description}</span>
              <kbd>{key}</kbd>
            </div>
          ))}
        </div>
        <p className="help-note">
          Trascina le etichette per spostarle. Doppio clic su un filo aggiunge una svolta
          modificabile. I punti blu modificano frecce e fili; Alt + clic elimina una svolta. Nelle
          maglie trascina gli angoli per ridimensionare e il punto sulla punta per spostarla. Scrivi{' '}
          <code>r_&#123;AB&#125;</code> per un pedice.
        </p>
        <p className="help-note">
          La sidebar Proprietà regola colore e opacità, separatamente per simbolo e label, anche sui
          gruppi. Seleziona più componenti e usa Sostituisci nel menu contestuale per cambiarli
          insieme. L’inspector specchia frecce e maglie nei due assi; il piccolo handle che appare
          vicino a una freccia selezionata permette di ruotarla liberamente. Ogni gesto ha un solo
          undo. Distribuisci per centri o spazi liberi; la distanza esatta mantiene fermo il primo
          elemento. Scegli lo stile dei fili o Dividi filo per una continuazione tratteggiata.
          Rettangoli e linee decorative non creano connessioni elettriche.
          Evidenziatore, nel menu Disegno e annotazioni, segue fili, nodi e componenti collegati
          in un solo trascinamento in modalità Intelligente. Scegli tu dove iniziare e fermarti,
          anche a metà componente; un clic non evidenzia l’intero elemento. In modalità Libera
          disegni ovunque. Modalità, colore, opacità e
          spessore si regolano in Proprietà. Gli estremi si modificano selezionando un tratto e trascinando gli handle.
          Le evidenziazioni seguono il componente o filo; il comando “Scollega” le rende indipendenti.
        </p>
        <p className="help-note">
          L’anteprima Smart Placement indica aggancio e collegamento; Alt/Option li ignora.
          “Inserisci in filo” è nel feedback in basso. La matita “Disegno e annotazioni” raccoglie
          fili, nodi, frecce, maglie, rettangoli, linee decorative e annotazioni elettriche.
          “Corrente sul filo” crea direttamente una freccia integrata; dal menu contestuale di un
          filo selezionato si applica subito. “Polarità + / −” si applica direttamente anche dalle
          proprietà dei componenti compatibili. “Graffa / Staffa” apre Graffa e Staffa: trascina per
          raggruppare, poi aggiungi l’etichetta; R ruota di 90° e “Inverti lato” cambia lato. Clic
          destro sul foglio o sugli elementi apre le azioni pertinenti; le scorciatoie mantengono
          disponibili i comandi di modifica. Salva come blocco è anche nella libreria Blocchi
          personali. Trascina il grip per spostare la toolbar: la posizione viene ricordata.
          Per copiare il disegno, seleziona gli elementi e scegli “Copia come immagine” dal menu
          del tasto destro. Per copiare tutto il circuito, usa prima Seleziona tutto.
          Il circuito e il livello di zoom vengono salvati automaticamente
          in questo browser.
        </p>
      </section>
    </div>
  );
}
