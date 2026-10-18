/** Keep an unreadable saved value intact until a recovery copy can be written.
 * A failed read/parse must never silently destroy the previous user's data. */
export function localPersistence<T>(
  key: string,
  parse: (raw: string) => T,
  serialize: (value: T) => string,
  fallback: () => T,
) {
  let unreadable: string | null = null;
  return {
    load(): { value: T; error: string } {
      let raw: string | null = null;
      try {
        raw = localStorage.getItem(key);
        return { value: raw === null ? fallback() : parse(raw), error: '' };
      } catch {
        unreadable = raw;
        return {
          value: fallback(),
          error:
            raw === null
              ? 'Salvataggio locale non disponibile. Mantieni aperta la pagina.'
              : 'Salvataggio locale non leggibile. I dati originali saranno conservati prima di salvare nuove modifiche. Mantieni aperta la pagina.',
        };
      }
    },
    save(value: T) {
      const raw = serialize(value);
      // Refuse values that this same application could not reopen. Validate
      // before backing up or replacing anything already in storage.
      parse(raw);
      if (unreadable !== null) {
        const prefix = `${key}.recovery.${Date.now()}`;
        let recoveryKey = prefix;
        for (let suffix = 1; localStorage.getItem(recoveryKey) !== null; suffix++)
          recoveryKey = `${prefix}.${suffix}`;
        // If storage/quota prevents the backup, do not overwrite the original.
        localStorage.setItem(recoveryKey, unreadable);
        unreadable = null;
      }
      localStorage.setItem(key, raw);
    },
  };
}
