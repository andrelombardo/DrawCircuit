import { Languages } from 'lucide-react';
import { t, useLanguage } from '../../i18n';
import type { Language } from '../../i18n';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  return (
    <label className="language-control floating-surface" title={t('Language')}>
      <Languages size={15} aria-hidden="true" />
      <select
        aria-label={t('Language')}
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
      >
        <option value="en" lang="en">
          English
        </option>
        <option value="it" lang="it">
          Italiano
        </option>
      </select>
    </label>
  );
}
