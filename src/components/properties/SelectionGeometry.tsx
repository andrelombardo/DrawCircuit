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
    name: 'Orizzontale',
    distribute: 'Distribuisci orizzontalmente',
    Icon: AlignHorizontalDistributeCenter,
  },
  {
    axis: 'y',
    name: 'Verticale',
    distribute: 'Distribuisci verticalmente',
    Icon: AlignVerticalDistributeCenter,
  },
] as const;
const alignments = [
  ['x', 'start', 'Sinistra', 'Allinea a sinistra', AlignHorizontalJustifyStart],
  ['x', 'center', 'Centro', 'Allinea al centro orizzontalmente', AlignHorizontalJustifyCenter],
  ['x', 'end', 'Destra', 'Allinea a destra', AlignHorizontalJustifyEnd],
  ['y', 'start', 'Alto', 'Allinea in alto', AlignVerticalJustifyStart],
  ['y', 'center', 'Centro', 'Allinea al centro verticalmente', AlignVerticalJustifyCenter],
  ['y', 'end', 'Basso', 'Allinea in basso', AlignVerticalJustifyEnd],
] as const;

export function SelectionGeometry({ objects }: { objects: CircuitObject[] }) {
  const document = useEditorStore((s) => s.document);
  const [distribution, setDistribution] = useState<DistributionMode>('centers');
  const [spacingMode, setSpacingMode] = useState<DistributionMode>('centers');
  const [spacing, setSpacing] = useState({ x: '', y: '' });
  const state = () => useEditorStore.getState();
  const ids = objects.map((o) => o.id);
  const targets = layoutTargets(document, ids);
  const exactReason = (axis: Axis) =>
    !spacing[axis].trim()
      ? 'Inserisci una distanza.'
      : distributionPlan(document, ids, axis, spacingMode, Number(spacing[axis])).reason;
  const exact = (axis: Axis) => {
    if (!exactReason(axis)) state().distribute(axis, spacingMode, Number(spacing[axis]));
  };
  if (targets.length < 2)
    return (
      <p className="inspector-note inspector-scope">
        Seleziona almeno due elementi indipendenti da disporre. Fili e annotazioni seguono i loro
        riferimenti.
      </p>
    );
  return (
    <>
      {targets.length !== objects.length && (
        <p
          className="inspector-note inspector-scope"
          title="Fili e annotazioni collegati seguono i loro riferimenti; non vengono spostati una seconda volta."
        >
          {targets.length
            ? `Disposizione: ${targets.length} elementi su ${objects.length}.`
            : 'Seleziona i componenti o i nodi da disporre: questi elementi sono vincolati ai collegamenti.'}
        </p>
      )}
      <div className="inspector-geometry-group" role="group" aria-label="Allineamento">
        <h4>Allineamento</h4>
        {axes.map(({ axis, name }) => (
          <div className="inspector-axis-group" key={axis}>
            <span className="inspector-field-caption">{name}</span>
            <div className="inspector-alignment-buttons">
              {alignments
                .filter(([a]) => a === axis)
                .map(([a, alignment, caption, label, Icon]) => (
                  <button
                    key={label}
                    className="inspector-property-action"
                    aria-label={label}
                    title={targets.length < 2 ? 'Servono almeno due elementi indipendenti.' : label}
                    disabled={targets.length < 2}
                    onClick={() => state().align(a, alignment)}
                  >
                    <Icon size={16} />
                    <span>{caption}</span>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
      <div className="inspector-geometry-group" role="group" aria-label="Distribuzione">
        <h4>Distribuzione</h4>
        <PropertySelect
          label="Criterio distribuzione"
          caption="Misura"
          value={distribution}
          onChange={(v) => setDistribution(v as DistributionMode)}
        >
          <option value="centers">Distanza tra i centri</option>
          <option value="gaps">Spazio libero tra i bordi</option>
        </PropertySelect>
        <div className="inspector-axis-actions">
          {axes.map(({ axis, name, distribute, Icon }) => {
            const reason = distributionPlan(document, ids, axis, distribution).reason;
            return (
              <span
                key={axis}
                title={
                  reason ?? 'Rende uguali le distanze mantenendo fermi i due elementi estremi.'
                }
              >
                <button
                  className="inspector-property-action"
                  aria-label={distribute}
                  disabled={!!reason}
                  title={reason ?? `${distribute} · i due estremi restano fermi`}
                  onClick={() => state().distribute(axis, distribution)}
                >
                  <Icon size={16} />
                  {name} ({axis.toUpperCase()})
                </button>
              </span>
            );
          })}
        </div>
      </div>
      <div className="inspector-geometry-group" role="group" aria-label="Spaziatura">
        <h4>
          Spaziatura esatta{' '}
          <span
            className="inspector-field-caption"
            title="Unità del documento, indipendenti dallo zoom. La griglia misura 20 u."
          >
            · unità canvas (u)
          </span>
        </h4>
        <PropertySelect
          label="Misura spaziatura"
          caption="Misura"
          value={spacingMode}
          onChange={(v) => setSpacingMode(v as DistributionMode)}
        >
          <option value="centers">Distanza tra i centri</option>
          <option value="gaps">Spazio libero tra i bordi</option>
        </PropertySelect>
        {axes.map(({ axis, name }) => {
          const reason = exactReason(axis);
          const hint =
            reason ??
            `Resta fermo l’elemento più ${axis === 'x' ? 'a sinistra' : 'in alto'}; gli altri mantengono il loro ordine.`;
          return (
            <div className="inspector-exact-spacing" key={axis}>
              <label className="inspector-field-caption" htmlFor={`spacing-${axis}`}>
                {name} ({axis.toUpperCase()})
              </label>
              <span className="inspector-input">
                <input
                  id={`spacing-${axis}`}
                  type="number"
                  aria-label={`Spaziatura ${axis === 'x' ? 'orizzontale' : 'verticale'} (u)`}
                  min={0}
                  max={1e7}
                  step="any"
                  value={spacing[axis]}
                  placeholder="Distanza"
                  title="Distanza da applicare, in unità canvas. Il campo non rappresenta una misura attuale della selezione."
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
                  aria-label={`Applica spaziatura ${axis === 'x' ? 'orizzontale' : 'verticale'}`}
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
