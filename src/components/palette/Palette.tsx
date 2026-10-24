import { t } from '../../i18n';
import { usePersonalBlocks } from '../../personalBlocks/library';
import { PersonalBlockPalette } from '../../personalBlocks/PersonalBlockPalette';
import { useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { SidebarToggle } from '../toolbar/SidebarToggle';
import { categories, catalog, matchesComponent } from '../../model/catalog';
import { useEditorStore } from '../../store/editorStore';
import { ComponentPreview } from './ComponentPreview';
import { circuitPresets, matchesPreset } from '../../presets/registry';
import { presetCategories } from '../../presets/types';
import { PresetThumbnail } from '../../presets/PresetThumbnail';
export function Palette({ onHide }: { onHide: () => void }) {
  const personalBlocks = usePersonalBlocks((s) => s.blocks);
  const [search, setSearch] = useState(''),
    [collapsed, setCollapsed] = useState<string[]>([]),
    [presetsOpen, setPresetsOpen] = useState(false),
    [collapsedPresets, setCollapsedPresets] = useState<string[]>([]);
  const tool = useEditorStore((s) => s.tool),
    setTool = useEditorStore((s) => s.setTool),
    pendingPresetId = useEditorStore((s) => s.pendingPresetId),
    selectPreset = useEditorStore((s) => s.selectPreset);
  return (
    <aside className="palette" aria-label={t('Component library')}>
      <div className="palette-heading">
        <h2>{t('Components')}</h2>
        <SidebarToggle side="left" visible onToggle={onHide} />
      </div>
      <div className="palette-scroll">
        <section className="preset-section" aria-label={t('Quick blocks')}>
          <button
            className="group-heading preset-heading"
            aria-expanded={presetsOpen || !!search}
            onClick={() => setPresetsOpen((open) => !open)}
          >
            <span>
              {t('Quick blocks')} <span className="count">{circuitPresets.length}</span>
            </span>
            <ChevronDown size={14} className={!presetsOpen && !search ? 'collapsed' : ''} />
          </button>
          {(presetsOpen || !!search) &&
            presetCategories.map((category) => {
              const items = circuitPresets.filter(
                (item) => item.category === category && matchesPreset(item, search),
              );
              if (!items.length) return null;
              const closed = collapsedPresets.includes(category) && !search;
              return (
                <section className="preset-category" key={category}>
                  <button
                    className="group-heading"
                    aria-expanded={!closed}
                    onClick={() =>
                      setCollapsedPresets((items) =>
                        items.includes(category)
                          ? items.filter((item) => item !== category)
                          : [...items, category],
                      )
                    }
                  >
                    {t(category)}
                    <ChevronDown size={14} className={closed ? 'collapsed' : ''} />
                  </button>
                  {!closed && (
                    <div className="preset-grid">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          className={`preset-card${tool === 'preset' && pendingPresetId === item.id ? ' chosen' : ''}`}
                          title={t('{name} · click to place · R rotates', {
                            name: t(item.name),
                          })}
                          aria-label={t('Insert block: {name}', {
                            name: t(item.name),
                          })}
                          aria-pressed={tool === 'preset' && pendingPresetId === item.id}
                          onClick={() => selectPreset(item.id)}
                        >
                          <PresetThumbnail preset={item} />
                          <span>{t(item.shortName)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
        </section>
        <PersonalBlockPalette search={search} />
        {categories.map((group) => {
          const items = catalog.filter((c) => c.group === group && matchesComponent(c, search));
          if (!items.length) return null;
          const closed = collapsed.includes(group) && !search;
          return (
            <section key={group} className="palette-group">
              <button
                className="group-heading"
                aria-expanded={!closed}
                onClick={() =>
                  setCollapsed((c) =>
                    c.includes(group) ? c.filter((g) => g !== group) : [...c, group],
                  )
                }
              >
                {t(group)}
                <ChevronDown size={14} className={closed ? 'collapsed' : ''} />
              </button>
              {!closed && (
                <div className="component-grid">
                  {items.map((c) => (
                    <button
                      key={c.type}
                      className={`component-card${tool === c.type ? ' chosen' : ''}`}
                      title={t('{name} · click to place, or drag', {
                        name: t(c.name),
                      })}
                      aria-label={t('Insert {name}', {
                        name: t(c.name).toLocaleLowerCase(),
                      })}
                      aria-pressed={tool === c.type}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/drawcircuit-component', c.type);
                        e.dataTransfer.effectAllowed = 'copy';
                        window.dispatchEvent(
                          new CustomEvent('drawcircuit:component-drag-start', {
                            detail: c.type,
                          }),
                        );
                      }}
                      onDragEnd={() =>
                        window.dispatchEvent(new Event('drawcircuit:component-drag-end'))
                      }
                      onClick={() => setTool(c.type)}
                    >
                      <ComponentPreview component={c} />
                      <span>{t(c.shortName)}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          );
        })}
        {!catalog.some((c) => matchesComponent(c, search)) &&
          !circuitPresets.some((item) => matchesPreset(item, search)) &&
          !personalBlocks.some((b) =>
            b.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
          ) && <p className="no-results">{t('No components or blocks found.')}</p>}
      </div>
      <div className="search-field">
        <Search size={15} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('Search components…')}
          aria-label={t('Search components')}
          title={t('Search components and blocks')}
        />
        {search && (
          <button
            aria-label={t('Clear search')}
            title={t('Clear search')}
            onClick={() => setSearch('')}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </aside>
  );
}
