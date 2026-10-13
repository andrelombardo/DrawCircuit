/** Synchronous reads keep the existing editor stores intact. Writes are serialized
 * to the native atomic file writer, and closing awaits flush(). */
export class DesktopStorage implements Storage {
  private entries: Map<string, string>;
  private version = 0;
  private savedVersion = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private saving: Promise<void> | null = null;
  private readonly write: (entries: Record<string, string>) => Promise<void>;
  private readonly onError: (error: unknown) => void;
  private readonly onSaved: () => void;

  constructor(
    initial: Record<string, string>,
    write: (entries: Record<string, string>) => Promise<void>,
    onError: (error: unknown) => void,
    onSaved: () => void = () => {},
  ) {
    this.entries = new Map(Object.entries(initial));
    this.write = write;
    this.onError = onError;
    this.onSaved = onSaved;
  }
  get length() {
    return this.entries.size;
  }
  key(index: number) {
    return [...this.entries.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.entries.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (!key.startsWith('drawcircuit.')) throw new Error('Chiave di salvataggio non valida.');
    if (this.entries.get(key) === String(value)) return;
    this.entries.set(key, String(value));
    this.changed();
  }
  removeItem(key: string) {
    if (this.entries.delete(key)) this.changed();
  }
  clear() {
    if (this.entries.size) {
      this.entries.clear();
      this.changed();
    }
  }
  private changed() {
    this.version++;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      void this.flush().catch(this.onError);
    }, 100);
  }
  async flush(): Promise<void> {
    clearTimeout(this.timer);
    if (this.saving) {
      await this.saving;
      return this.flush();
    }
    if (this.version === this.savedVersion) return;
    this.saving = (async () => {
      while (this.savedVersion !== this.version) {
        const version = this.version;
        await this.write(Object.fromEntries(this.entries));
        this.savedVersion = version;
      }
      this.onSaved();
    })();
    try {
      await this.saving;
    } finally {
      this.saving = null;
    }
  }
}
