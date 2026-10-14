import type { DownloadEvent } from '@tauri-apps/plugin-updater';

export interface SignedUpdate {
  version: string;
  download: (progress?: (event: DownloadEvent) => void) => Promise<void>;
  install: () => Promise<void>;
  close: () => Promise<void>;
}
export interface UpdateState {
  phase:
    | 'idle'
    | 'checking'
    | 'available'
    | 'confirming'
    | 'saving'
    | 'downloading'
    | 'installing'
    | 'restarting'
    | 'installed'
    | 'error';
  version?: string;
  message?: string;
  progress?: number;
}
interface Dependencies {
  check: () => Promise<SignedUpdate | null>;
  confirm: (version: string) => Promise<boolean>;
  assertReady: () => void;
  save: () => Promise<void>;
  restart: () => Promise<void>;
  lock: (locked: boolean) => void;
}

let installing = false;
export const isDesktopUpdateBusy = () => installing;

/** Installation can only follow approval, a durable save and signature-verified download. */
export class DesktopUpdateController {
  private state: UpdateState = { phase: 'idle' };
  private listeners = new Set<() => void>();
  private update: SignedUpdate | null = null;
  private busy = false;
  private installed = false;
  private readonly dependencies: Dependencies;
  constructor(dependencies: Dependencies) {
    this.dependencies = dependencies;
  }
  snapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private set(state: UpdateState) {
    this.state = state;
    this.listeners.forEach((listener) => listener());
  }
  async check(manual = false) {
    if (this.busy || this.installed || (!manual && this.state.phase !== 'idle')) return;
    this.busy = true;
    const previous = this.update;
    if (manual) this.set({ phase: 'checking' });
    try {
      const update = await this.dependencies.check();
      this.update = update;
      if (previous) await previous.close().catch(() => {});
      this.set(
        update
          ? { phase: 'available', version: update.version }
          : { phase: 'idle', message: manual ? 'DrawCircuit è aggiornato.' : undefined },
      );
    } catch {
      this.set(
        previous
          ? {
              phase: 'available',
              version: previous.version,
              message: 'Controllo non riuscito. Puoi riprovare quando sei online.',
            }
          : {
              phase: 'idle',
              message: manual
                ? 'Controllo non riuscito. Puoi riprovare quando sei online.'
                : undefined,
            },
      );
    } finally {
      this.busy = false;
    }
  }
  dismiss() {
    if (!this.busy && !this.installed) this.set({ phase: 'idle' });
  }
  async apply() {
    if (this.busy || !this.update) return;
    this.busy = true;
    const update = this.update;
    let locked = false;
    try {
      this.dependencies.assertReady();
      if (!this.installed) {
        this.set({ phase: 'confirming', version: update.version });
        if (!(await this.dependencies.confirm(update.version))) {
          this.set({ phase: 'available', version: update.version });
          return;
        }
      }
      this.dependencies.assertReady();
      installing = locked = true;
      this.dependencies.lock(true);
      this.set({ phase: 'saving', version: update.version });
      await this.dependencies.save();
      if (!this.installed) {
        this.set({ phase: 'downloading', version: update.version });
        let total = 0,
          received = 0;
        // The native updater checks the embedded public key before download resolves.
        await update.download((event) => {
          if (event.event === 'Started') total = event.data.contentLength ?? 0;
          if (event.event === 'Progress') received += event.data.chunkLength;
          this.set({
            phase: 'downloading',
            version: update.version,
            progress: total ? Math.min(100, Math.round((received / total) * 100)) : undefined,
          });
        });
        // Also flush preferences or delayed writes that arrived during download.
        await this.dependencies.save();
        this.set({ phase: 'installing', version: update.version });
        await update.install();
        this.installed = true;
      }
      this.set({ phase: 'restarting', version: update.version });
      await this.dependencies.restart();
      this.set({
        phase: 'installed',
        version: update.version,
        message: 'Aggiornamento installato. Riavvia DrawCircuit.',
      });
    } catch (error) {
      this.set({
        phase: this.installed ? 'installed' : 'error',
        version: update.version,
        message: this.installed
          ? 'Aggiornamento installato. Il riavvio non è riuscito: riprova.'
          : `Aggiornamento interrotto: ${error instanceof Error ? error.message : String(error)}. Il lavoro resta disponibile.`,
      });
    } finally {
      if (locked) {
        this.dependencies.lock(false);
        installing = false;
      }
      this.busy = false;
    }
  }
}
