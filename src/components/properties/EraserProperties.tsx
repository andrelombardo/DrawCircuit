import { t } from '../../i18n';
import { useEditorStore } from '../../store/editorStore';
import { InspectorSection } from './PropertyControls';

export function EraserProperties() {
  const size = useEditorStore((s) => s.eraserSize);
  return (
    <div className="inspector-properties">
      <p className="inspector-context-note">{t('Only affects highlights')}</p>
      <p className="inspector-context-note">
        {t(
          'Click to delete a whole stroke. Drag to erase only the area you cross. Each gesture is one undo step.',
        )}
      </p>
      <InspectorSection title={t('Size')}>
        <label className="eraser-size-label" htmlFor="eraser-size">
          <span>{t('Eraser diameter')}</span>
          <output htmlFor="eraser-size">{size} u</output>
        </label>
        <input
          id="eraser-size"
          className="eraser-size"
          type="range"
          min={6}
          max={160}
          step={2}
          value={size}
          aria-label={t('Eraser diameter')}
          aria-valuetext={t('{size} canvas units', { size })}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              useEditorStore.getState().setTool('select');
            }
          }}
          onChange={(event) => useEditorStore.getState().setEraserSize(Number(event.target.value))}
        />
        <p className="inspector-geometry-note">
          {t(
            'Size applies to dragging. The outline follows the same canvas scale at every zoom level.',
          )}
        </p>
      </InspectorSection>
    </div>
  );
}
