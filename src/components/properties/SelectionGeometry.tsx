import { t } from '../../i18n';
import { useState } from 'react';
import {
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  Check,
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import type { CircuitObject } from '../../model/types';
import { distributionPlan, layoutTargets } from '../../utils/selectionGeometry';
import type { Axis, DistributionMode } from '../../utils/selectionGeometry';
import { PropertySelect } from './PropertyControls';

const axes = [
  {
    axis: 'x',
    name: 'Horizontal',
    distribute: 'Distribute horizontally',
    Icon: AlignHorizontalDistributeCenter,
  },
  {
    axis: 'y',
    name: 'Vertical',
    distribute: 'Distribute vertically',
    Icon: AlignVerticalDistributeCenter,
  },
] as const;
const alignments = [
  ['x', 'start', 'Left', 'Align left', AlignHorizontalJustifyStart],
  ['x', 'center', 'Center', 'Align horizontal centers', AlignHorizontalJustifyCenter],
  ['x', 'end', 'Right', 'Align right', AlignHorizontalJustifyEnd],
  ['y', 'start', 'Top', 'Align top', AlignVerticalJustifyStart],
  ['y', 'center', 'Center', 'Align vertical centers', AlignVerticalJustifyCenter],
  ['y', 'end', 'Bottom', 'Align bottom', AlignVerticalJustifyEnd],
] as const;

export function SelectionGeometry({ objects, showAlignment = true }: { objects: CircuitObject[]; showAlignment?: boolean }) {
  const document = useEditorStore((s) => s.document);
  const [distribution, setDistribution] = useState<DistributionMode>('centers');
  const [spacingMode, setSpacingMode] = useState<DistributionMode>('centers');
  const [spacing, setSpacing] = useState({ x: '', y: '' });
  const state = () => useEditorStore.getState();
  const ids = objects.map((o) => o.id);
  const targets = layoutTargets(document, ids);
  const exactReason = (axis: Axis) =>
    !spacing[axis].trim()
      ? t('Enter a distance.')
      : distributionPlan(document, ids, axis, spacingMode, Number(spacing[axis])).reason;
  const exact = (axis: Axis) => {
    if (!exactReason(axis)) state().distribute(axis, spacingMode, Number(spacing[axis]));
  };
  if (targets.length < 2)
    return (
      <p className="inspector-note inspector-scope">
        {t(
          'Select at least two independent elements to arrange. Wires and annotations follow their references.',
        )}{' '}
      </p>
    );
  return (
    <>
      {targets.length !== objects.length && (
        <p
          className="inspector-note inspector-scope"
          title={t(
            'Connected wires and annotations follow their references; they are not moved a second time.',
          )}
        >
          {targets.length
            ? t('Arrange: {count} of {total} elements.', {
                count: targets.length,
                total: objects.length,
              })
            : t(
                'Select the components or junctions to arrange: these elements are constrained by their connections.',
              )}
        </p>
      )}
      {showAlignment && <div className="inspector-geometry-group" role="group" aria-label={t('Alignment')}>
        <h4>{t('Alignment')}</h4>
        {axes.map(({ axis, name }) => (
          <div className="inspector-axis-group" key={axis}>
            <span className="inspector-field-caption">{t(name)}</span>
            <div className="inspector-alignment-buttons">
              {alignments
                .filter(([a]) => a === axis)
                .map(([a, alignment, caption, label, Icon]) => (
                  <button
                    key={label}
                    className="inspector-property-action"
                    aria-label={t(label)}
                    title={
                      targets.length < 2
                        ? t('At least two independent elements are required.')
                        : t(label)
                    }
                    disabled={targets.length < 2}
                    onClick={() => state().align(a, alignment)}
                  >
                    <Icon size={16} />
                    <span>{t(caption)}</span>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>}
      <div className="inspector-geometry-group" role="group" aria-label={t('Distribution')}>
        <h4>{t('Distribution')}</h4>
        <PropertySelect
          label={t('Distribution criterion')}
          caption={t('Measurement')}
          value={distribution}
          onChange={(v) => setDistribution(v as DistributionMode)}
        >
          <option value="centers">{t('Distance between centers')}</option>
          <option value="gaps">{t('Clearance between edges')}</option>
        </PropertySelect>
        <div className="inspector-axis-actions">
          {axes.map(({ axis, name, distribute, Icon }) => {
            const reason = distributionPlan(document, ids, axis, distribution).reason;
            return (
              <span
                key={axis}
                title={
                  reason ?? t('Equalize distances while keeping the two outermost elements fixed.')
                }
              >
                <button
                  className="inspector-property-action"
                  aria-label={t(distribute)}
                  disabled={!!reason}
                  title={
                    reason ??
                    t('{action} · outermost elements stay fixed', {
                      action: t(distribute),
                    })
                  }
                  onClick={() => state().distribute(axis, distribution)}
                >
                  <Icon size={16} />
                  {t(name)} ({axis.toUpperCase()})
                </button>
              </span>
            );
          })}
        </div>
      </div>
      <div className="inspector-geometry-group" role="group" aria-label={t('Spacing')}>
        <h4>
          {t('Exact spacing')}{' '}
          <span
            className="inspector-field-caption"
            title={t('Document units, independent of zoom. The grid measures 20 u.')}
          >
            {t('· canvas units (u)')}{' '}
          </span>
        </h4>
        <PropertySelect
          label={t('Spacing measurement')}
          caption={t('Measurement')}
          value={spacingMode}
          onChange={(v) => setSpacingMode(v as DistributionMode)}
        >
          <option value="centers">{t('Distance between centers')}</option>
          <option value="gaps">{t('Clearance between edges')}</option>
        </PropertySelect>
        {axes.map(({ axis, name }) => {
          const reason = exactReason(axis);
          const hint =
            reason ??
            t(
              axis === 'x'
                ? 'The leftmost element stays fixed; the others keep their order.'
                : 'The topmost element stays fixed; the others keep their order.',
            );
          return (
            <div className="inspector-exact-spacing" key={axis}>
              <label className="inspector-field-caption" htmlFor={`spacing-${axis}`}>
                {t(name)} ({axis.toUpperCase()})
              </label>
              <span className="inspector-input">
                <input
                  id={`spacing-${axis}`}
                  type="number"
                  aria-label={t(axis === 'x' ? 'Horizontal spacing (u)' : 'Vertical spacing (u)')}
                  min={0}
                  max={1e7}
                  step="any"
                  value={spacing[axis]}
                  placeholder={t('Distance')}
                  title={t(
                    "Distance to apply, in canvas units. This field does not show the selection's current measurement.",
                  )}
                  onChange={(e) => setSpacing((p) => ({ ...p, [axis]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      exact(axis);
                    }
                  }}
                />
                <span className="inspector-unit">u</span>
              </span>
              <span title={hint}>
                <button
                  className="inspector-property-action"
                  aria-label={t(
                    axis === 'x' ? 'Apply horizontal spacing' : 'Apply vertical spacing',
                  )}
                  title={hint}
                  disabled={!!reason}
                  onClick={() => exact(axis)}
                >
                  <Check size={16} />
                </button>
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
