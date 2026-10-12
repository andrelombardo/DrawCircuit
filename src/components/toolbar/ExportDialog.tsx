import { shortcut } from '../../utils/platform';
import { copyPNG, exportPNG } from '../../png/exporter';
import { exportSVG } from '../../svg/exporter';
import { useMemo, useRef, useState } from 'react';
import { Check, Copy, Download, X } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { exportObsidian, exportStandalone, exportTikz } from '../../tikz/exporter';
import { getExportSelection } from '../../tikz/selection';
import { download, fileName } from '../../utils/files';
import { useDialogFocus } from './useDialogFocus';
export function ExportDialog({ onClose }: { onClose: () => void }) {
  const doc = useEditorStore((s) => s.document),
    selection = useEditorStore((s) => s.selection),
    [scope, setScope] = useState<'all' | 'selection'>('all'),
    [tab, setTab] = useState<'snippet' | 'obsidian' | 'standalone' | 'svg'>('snippet'),
    [copied, setCopied] = useState<'snippet' | 'obsidian' | 'svg' | 'png' | null>(null),
    [copyError, setCopyError] = useState(false);
  const [pngBusy, setPngBusy] = useState(false);
  const [pngError, setPngError] = useState('');
  const pngAction = async (action: 'copy' | 'download') => {
    setPngBusy(true);
    setPngError('');
    setCopied(null);
    try {
      if (action === 'copy') {
        await copyPNG(exportDoc);
        setCopied('png');
      } else download(await exportPNG(exportDoc), `${fileName(doc.title)}.png`, 'image/png');
    } catch (error) {
      const message =
        action === 'copy'
          ? 'Questo browser non consente la copia immagine. Usa Scarica PNG.'
          : error instanceof Error
            ? error.message
            : 'Impossibile esportare il PNG.';
      setPngError(message);
      useEditorStore.getState().notify(message);
    } finally {
      setPngBusy(false);
    }
  };
  const textarea = useRef<HTMLTextAreaElement>(null);
  const dialog = useRef<HTMLElement>(null);
  useDialogFocus(dialog, onClose);
  const subset = useMemo(() => getExportSelection(doc, selection), [doc, selection]);
  const exportDoc = scope === 'selection' ? subset : doc;
  const code =
    tab === 'svg'
      ? exportSVG(exportDoc)
      : tab === 'snippet'
        ? exportTikz(exportDoc)
        : tab === 'obsidian'
          ? exportObsidian(exportDoc)
          : exportStandalone(exportDoc);
  const copy = async (format: 'snippet' | 'obsidian' | 'svg') => {
    setTab(format);
    setCopied(null);
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(
        format === 'svg'
          ? exportSVG(exportDoc)
          : format === 'obsidian'
            ? exportObsidian(exportDoc)
            : exportTikz(exportDoc),
      );
      setCopied(format);
    } catch {
      requestAnimationFrame(() => {
        textarea.current?.select();
        setCopyError(true);
      });
    }
  };
  const selectTab = (format: typeof tab) => {
    setTab(format);
    setCopied(null);
    setCopyError(false);
    setPngError('');
  };
  return (
    <div
      className="modal-backdrop"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={dialog}
        className="export-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-heading"
      >
        <button
          className="modal-close"
          aria-label="Chiudi export"
          title="Chiudi export"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <h2 id="export-heading">Esporta circuito</h2>
        <p>Scegli il formato per LaTeX, Obsidian o un’immagine SVG / PNG.</p>
        <div className="export-scope" role="group" aria-label="Ambito export">
          <span>Esporta</span>
          <button
            aria-pressed={scope === 'all'}
            onClick={() => {
              setScope('all');
              setPngError('');
              setCopied(null);
              setCopyError(false);
            }}
          >
            Tutto il circuito
          </button>
          <button
            aria-pressed={scope === 'selection'}
            disabled={!subset.objects.length}
            title={
              !subset.objects.length
                ? 'Seleziona almeno un elemento sul foglio'
                : 'Esporta gli elementi selezionati e i fili interni'
            }
            onClick={() => {
              setScope('selection');
              setPngError('');
              setCopied(null);
              setCopyError(false);
            }}
          >
            Solo selezione
          </button>
        </div>
        <div className="code-tabs">
          <button
            className={tab === 'snippet' ? 'selected' : ''}
            onClick={() => selectTab('snippet')}
          >
            Codice TikZ
          </button>
          <button
            className={tab === 'obsidian' ? 'selected' : ''}
            onClick={() => selectTab('obsidian')}
          >
            Obsidian
          </button>
          <button
            className={tab === 'standalone' ? 'selected' : ''}
            onClick={() => selectTab('standalone')}
          >
            File .tex
          </button>
          <button className={tab === 'svg' ? 'selected' : ''} onClick={() => selectTab('svg')}>
            SVG
          </button>
          <div
            className="png-export-actions"
            role="group"
            aria-label="Azioni PNG"
            aria-busy={pngBusy}
          >
            <button
              disabled={pngBusy || !exportDoc.objects.length}
              onClick={() => pngAction('copy')}
            >
              <Copy size={14} /> {copied === 'png' ? 'PNG copiato' : 'Copia PNG'}
            </button>
            <button
              disabled={pngBusy || !exportDoc.objects.length}
              onClick={() => pngAction('download')}
            >
              <Download size={14} /> Scarica PNG
            </button>
          </div>
          <span>
            {exportDoc.objects.length}{' '}
            {exportDoc.objects.length === 1 ? 'oggetto vettoriale' : 'oggetti vettoriali'}
          </span>
        </div>
        <textarea
          ref={textarea}
          className="code-preview"
          aria-label={tab === 'svg' ? 'Codice SVG generato' : 'Codice TikZ generato'}
          value={code}
          readOnly
          spellCheck={false}
        />
        {pngError && (
          <p className="copy-error" role="alert">
            {pngError}
          </p>
        )}
        {copyError && (
          <p className="copy-error">Codice selezionato: premi {shortcut('C')} per copiarlo.</p>
        )}
        <div className="export-dialog-footer">
          <span>
            {tab === 'svg'
              ? 'SVG vettoriale · copia del codice XML'
              : tab === 'obsidian'
                ? 'Scala canvas · font e geometria preservati'
                : '1 cm = 40 px · orientamento preservato'}
          </span>
          {tab === 'svg' ? (
            <>
              <button className="secondary-button" onClick={() => copy('svg')}>
                {copied === 'svg' ? 'SVG copiato' : 'Copia codice SVG'}
              </button>
              <button
                className="secondary-button"
                onClick={() =>
                  download(exportSVG(exportDoc), `${fileName(doc.title)}.svg`, 'image/svg+xml')
                }
              >
                Scarica SVG
              </button>
            </>
          ) : (
            <>
              <button className="secondary-button" onClick={() => copy('snippet')}>
                {copied === 'snippet' ? <Check size={16} /> : <Copy size={16} />}{' '}
                {copied === 'snippet'
                  ? 'Copiato'
                  : scope === 'selection'
                    ? 'Copia TikZ selezione'
                    : 'Copia TikZ'}
              </button>
              <button className="secondary-button" onClick={() => copy('obsidian')}>
                {copied === 'obsidian' ? <Check size={16} /> : <Copy size={16} />}{' '}
                {copied === 'obsidian'
                  ? 'Copiato per Obsidian'
                  : scope === 'selection'
                    ? 'Copia selezione per Obsidian'
                    : 'Copia per Obsidian'}
              </button>
              <button
                className="secondary-button"
                onClick={() =>
                  download(
                    exportStandalone(exportDoc),
                    `${fileName(doc.title)}.tex`,
                    'application/x-tex',
                  )
                }
              >
                <Download size={16} />
                Scarica .tex
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
