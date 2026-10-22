import { linePoints } from '../../utils/geometry';
import { t } from '../../i18n';
import { GraphicView } from '../../circuit/annotations/GraphicView';
import { BraceView } from '../../circuit/annotations/BraceView';
import { ElectricalView } from '../../circuit/annotations/ElectricalView';
import { usePersonalBlocks } from '../../personalBlocks/library';
import { SelectionActions } from '../properties/SelectionActions';
import { ActionMenu } from '../toolbar/ActionMenu';
import { useEditActions } from '../toolbar/useEditActions';
import { useEffect, useRef, useState } from 'react';
import { CircleAlert, Grid2X2, HelpCircle, Magnet, Maximize, Minus, Plus } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { catalog } from '../../model/catalog';
import { componentTypes, GRID } from '../../model/types';
import { wirePoints, pointsPath } from '../../utils/geometry';
import type { ComponentType } from '../../model/types';
import { wirePreview } from '../../utils/wires';
import { TargetFeedbackLayer } from './TargetFeedbackLayer';
import { DistanceGuideLayer } from './DistanceGuideLayer';
import { CircuitLayer } from './CircuitLayer';
import { InlineTextEditor } from './InlineTextEditor';
import { inlineTextTarget } from '../../utils/labels';
import { useKeyboardNudge } from './useKeyboardNudge';
import { DrawingToolbar } from '../toolbar/Toolbar';
import { SidebarToggle } from '../toolbar/SidebarToggle';
import { useCanvasInteractions } from './useCanvasInteractions';
import { PropertiesInspector } from '../properties/PropertiesInspector';
import { useInspectorPreferences } from '../properties/useInspectorPreferences';
import { LanguageSwitcher } from '../toolbar/LanguageSwitcher';
import { IconButton } from '../toolbar/IconButton';
import logoUrl from '../../../assets/brand/drawcircuit-logo.svg?url';
import { LoopArrowView } from '../../circuit/annotations/LoopArrowView';
import { ArrowView } from '../../circuit/annotations/ArrowView';
import { PlacementLayer } from '../../smartPlacement/PlacementLayer';
import { PresetPlacementLayer } from '../../presets/PresetPlacementLayer';
import { presetRegistry } from '../../presets/registry';
import { inlineCompatible } from '../../smartPlacement/findCandidates';
import { useTerminalProximity } from './useTerminalProximity';
import { useCanvasFocus } from './useCanvasFocus';
type CanvasProps = {
  sidebarVisible?: boolean;
  onToggleSidebar?: () => void;
  onHelp?: () => void;
  inspector: ReturnType<typeof useInspectorPreferences>;
  onShowInspector: () => void;
};
export function Canvas(props: CanvasProps) {
  return (
    <SelectionActions>
      <CanvasContent {...props} />
    </SelectionActions>
  );
}
function CanvasContent({
  sidebarVisible = true,
  onToggleSidebar,
  onHelp,
  inspector,
  onShowInspector,
}: CanvasProps) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    canvasOnly: boolean;
    key: number;
  } | null>(null);
  const { contextItems } = useEditActions(contextMenu?.canvasOnly);
  useEffect(
    () =>
      useEditorStore.subscribe((s, previous) => {
        if (['highlight', 'highlight-eraser'].includes(s.tool) && s.tool !== previous.tool)
          onShowInspector();
      }),
    [onShowInspector],
  );
  const focusModality = useCanvasFocus();
  const svgRef = useRef<SVGSVGElement>(null),
    doc = useEditorStore((s) => s.document),
    tool = useEditorStore((s) => s.tool),
    pendingPresetId = useEditorStore((s) => s.pendingPresetId),
    grid = useEditorStore((s) => s.grid),
    snapEnabled = useEditorStore((s) => s.snapEnabled),
    selection = useEditorStore((s) => s.selection),
    gestureActive = useEditorStore((s) => Boolean(s.gestureStart)),
    wireRouting = useEditorStore((s) => s.wireRouting),
    arrowType = useEditorStore((s) => s.arrowType),
    storageError = useEditorStore((s) => s.storageError),
    eraserSize = useEditorStore((s) => s.eraserSize);
  const personalBlocks = usePersonalBlocks((s) => s.blocks);
  const personalName = personalBlocks.find((b) => b.id === pendingPresetId)?.name;
  const interactions = useCanvasInteractions(svgRef, onToggleSidebar),
    { viewport: v, overlay, draft, editing } = interactions;
  const editedObject = editing ? doc.objects.find((o) => o.id === editing.id) : null;
  const editTarget = inlineTextTarget(editedObject, doc);
  const nudgeDistances = useKeyboardNudge(v.zoom);
  const isComponent = componentTypes.includes(tool as ComponentType),
    gridSize = GRID * v.zoom * (v.zoom < 0.4 ? 2 : 1);
  const placementType =
    interactions.paletteDragType ?? (isComponent ? (tool as ComponentType) : null);
  const smart = interactions.smart;
  const terminalsNeeded =
    tool === 'wire' ||
    tool === 'line' ||
    tool === 'junction' ||
    tool === 'voltage' ||
    !!placementType ||
    !!draft ||
    interactions.dragging === 'wire';
  const terminalProximity = useTerminalProximity(
    svgRef,
    doc,
    v,
    !terminalsNeeded && !interactions.dragging && !gestureActive,
  );
  const smartHint =
    smart.preview?.phase === 'anchor-target'
      ? t('Click to anchor · then move and click to place')
      : smart.preview?.phase === 'anchored'
        ? t('Anchored · click to place and connect · R rotates')
        : smart.preview?.phase === 'snapped'
          ? t('Click to place and connect')
          : smart.preview?.phase === 'inline-candidate'
            ? t('Click to insert into the wire · one undo step')
            : null;
  let previewPath = '';
  if (draft && overlay.connection) {
    const candidate = overlay.connection;
    const wire = wirePreview(draft, candidate, doc);
    previewPath = pointsPath(wirePoints(wire, doc));
  }
  const hint =
    tool === 'highlight-eraser'
      ? t('Click a highlight to delete it · drag to erase part · Esc returns to Select')
      : tool === 'highlight'
        ? t('Drag to highlight all or part of wires and components · Esc returns to Select')
        : tool === 'rectangle'
          ? t('Drag to draw · Shift for a square · Option from center · Esc cancels')
          : tool === 'circle'
            ? t('Drag to draw a circle · Option from center · Esc cancels')
            : tool === 'line'
              ? draft ? t('Click to add a bend · click a target to finish · Enter finishes · Alt bypasses snap')
                : t('Click or drag to start a decorative line · Alt bypasses snap · Esc cancels')
              : tool === 'brace' || tool === 'bracket'
                ? t('Drag to group · double-click to label · R rotates · Flip side in Properties')
                : tool === 'preset'
                  ? t('{name} · click to place · R rotates · Esc cancels', {
                      name: pendingPresetId
                        ? presetRegistry[pendingPresetId]
                          ? t(presetRegistry[pendingPresetId].name)
                          : (personalName ?? t('Quick block'))
                        : t('Quick block'),
                    })
                  : tool === 'current'
                    ? t('Current · click a highlighted wire · Esc cancels')
                    : tool === 'polarity'
                      ? t('Polarity · click a highlighted component · Esc cancels')
                      : tool === 'voltage'
                        ? interactions.voltageStart
                          ? t('A selected · select the second point · Esc cancels')
                          : t('Select the first point · click or drag to the second · Esc cancels')
                        : tool === 'wire'
                          ? draft
                            ? t(
                                'Click to add a bend · click a target to connect · Enter finishes · Alt bypasses snap',
                              )
                            : t('Click to start a wire · Alt bypasses snap · Esc cancels')
                          : tool === 'junction'
                            ? t('Click to place junctions · Esc or V finishes')
                            : tool === 'text'
                              ? t('Click to place text · double-click to edit')
                              : tool === 'loop-arrow'
                                ? t('Drag an area for the loop · drag the tip handle to move it')
                                : tool === 'arrow'
                                  ? t('Drag to draw · select to edit handles')
                                  : isComponent
                                    ? t('{name} · click to place · R rotates · Esc finishes', {
                                        name: t(catalog.find((c) => c.type === tool)?.name ?? ''),
                                      })
                                    : tool === 'pan'
                                      ? t('Drag to pan the view')
                                      : null;
  return (
    <div className="editor-shell">
      <main className="editor" aria-label={t('Circuit editor')}>
        <DrawingToolbar sidebarVisible={sidebarVisible} />
        {!sidebarVisible && (
          <SidebarToggle side="left" visible={false} onToggle={onToggleSidebar} />
        )}
        {storageError && (
          <div className="persistence-error floating-surface" role="alert">
            <CircleAlert size={12} />
            {t('Local saving is unavailable. Keep this page open and use “Copy as image”.')}{' '}
          </div>
        )}
        {!inspector.preferences.visible && (
          <SidebarToggle side="right" visible={false} onToggle={inspector.toggle} />
        )}
        {(tool === 'wire' || tool === 'line') && (
          <div className="arrow-tool-options" role="group" aria-label={t(tool === 'line' ? 'Line routing' : 'Wire routing')}>
            {(['orthogonal', '45', 'free'] as const).map((routing, i) => (
              <button
                key={routing}
                aria-pressed={wireRouting === routing}
                className={wireRouting === routing ? 'selected' : ''}
                onClick={() => useEditorStore.getState().setWireRouting(routing)}
                title={t('Shift+W changes routing')}
              >
                {[t('Orthogonal'), '45°', t('Free')][i]}
              </button>
            ))}
          </div>
        )}
        {tool === 'arrow' && (
          <div className="arrow-tool-options" aria-label={t('Arrow shape')}>
            {(['straight', 'curve'] as const).map((type, i) => (
              <button
                key={type}
                className={arrowType === type ? 'selected' : ''}
                onClick={() => useEditorStore.getState().setArrowType(type)}
              >
                {[t('Straight'), t('Curved')][i]}
              </button>
            ))}
          </div>
        )}
        <svg
          ref={svgRef}
          tabIndex={0}
          className={`drawing-surface tool-${isComponent ? 'component' : tool}${interactions.space ? ' space-pan' : ''}${interactions.dragging ? ` dragging-${interactions.dragging}` : ''}${isComponent && smartHint ? (smart.preview?.phase === 'inline-candidate' ? ' smart-inline' : ' smart-connect') : ''}`}
          aria-label={t('Circuit SVG sheet')}
          data-testid="circuit-canvas"
          data-focus-modality={focusModality}
          onKeyDown={(e) => {
            if (e.key !== 'ContextMenu' && !(e.shiftKey && e.key === 'F10')) return;
            e.preventDefault();
            e.stopPropagation();
            const id = useEditorStore.getState().selection[0];
            const object = id
              ? [...(svgRef.current?.querySelectorAll('[data-object]') ?? [])].find(
                  (element) => element.getAttribute('data-object') === id,
                )
              : null;
            const rect = (object ?? svgRef.current)?.getBoundingClientRect();
            if (rect)
              setContextMenu({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                canvasOnly: !id,
                key: Date.now(),
              });
          }}
          onPointerDown={interactions.pointerDown}
          onPointerMove={(event) => {
            terminalProximity.move(event);
            interactions.pointerMove(event);
          }}
          onPointerUp={interactions.pointerUp}
          onPointerCancel={interactions.cancel}
          onLostPointerCapture={interactions.lostCapture}
          onDoubleClick={interactions.doubleClick}
          onPointerLeave={() => {
            terminalProximity.leave();
            interactions.leave();
          }}
          onDragOver={interactions.dragOver}
          onDragLeave={smart.leave}
          onDrop={interactions.drop}
          onContextMenu={(e) => {
            e.preventDefault();
            if (editing) return;
            if (useEditorStore.getState().gestureStart) interactions.cancel();
            const id = (e.target as Element).closest('[data-object]')?.getAttribute('data-object');
            const s = useEditorStore.getState();
            if (id && s.document.objects.some((o) => o.id === id)) {
              if (!s.selection.includes(id)) s.select(e.shiftKey ? [...s.selection, id] : [id]);
              // A body click targets the object; a selected label retains its subtarget.
              else if (!(e.target as Element).closest('[data-label]')) s.setActiveLabel(null);
            }
            setContextMenu({
              x: e.clientX,
              y: e.clientY,
              canvasOnly: !id,
              key: Date.now(),
            });
          }}
        >
          <defs>
            <pattern
              id="grid"
              width={gridSize}
              height={gridSize}
              patternUnits="userSpaceOnUse"
              x={(v.x % gridSize) - gridSize / 2}
              y={(v.y % gridSize) - gridSize / 2}
            >
              <circle cx={gridSize / 2} cy={gridSize / 2} r={0.7} fill="#dce2e8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={grid ? 'url(#grid)' : 'transparent'} />
          <g transform={`translate(${v.x} ${v.y}) scale(${v.zoom})`}>
            {!doc.objects.length && (
              <foreignObject x={-175} y={-110} width={350} height={250} pointerEvents="none">
                <div className="empty-sheet">
                  <div
                    className="empty-circuit"
                    aria-hidden="true"
                    style={{ maskImage: `url("${logoUrl}")` }}
                  />
                  <h2>{t('Ideas start with a blank sheet.')}</h2>
                  <p>
                    {t('Choose a component from the palette.')}
                    <br />
                    {t('One click brings your circuit to life.')}{' '}
                  </p>
                  <span>{t('Electrical circuits · handwritten notes')}</span>
                </div>
              </foreignObject>
            )}
            <CircuitLayer
              doc={doc}
              highlightDraft={overlay.highlight}
              selection={editing ? [] : selection}
              terminals={terminalsNeeded}
              nearbyComponents={editing ? [] : terminalProximity.ids}
              zoom={v.zoom}
              hoveredArrow={interactions.hoveredArrow}
              activeLabel={interactions.activeLabel}
              editingTextId={editedObject?.kind === 'text' ? editedObject.id : undefined}
              editingLabelId={editedObject?.kind !== 'text' ? editedObject?.id : undefined}
            />
            <DistanceGuideLayer
              guides={overlay.distances.length ? overlay.distances : nudgeDistances}
              zoom={v.zoom}
            />
            <g pointerEvents="none">
              {overlay.guides.x !== undefined && (
                <path
                  d={`M${overlay.guides.x} ${-100000}V${100000}`}
                  className="snap-guide"
                  strokeWidth={1 / v.zoom}
                />
              )}
              {overlay.guides.y !== undefined && (
                <path
                  d={`M${-100000} ${overlay.guides.y}H${100000}`}
                  className="snap-guide"
                  strokeWidth={1 / v.zoom}
                />
              )}
              {overlay.box && (
                <rect
                  {...overlay.box}
                  fill="#2463e8"
                  fillOpacity={0.05}
                  stroke="#2463e8"
                  strokeWidth={1 / v.zoom}
                />
              )}
              {previewPath && (
                <path
                  d={previewPath}
                  fill="none"
                  stroke="#5681d0"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                />
              )}
              {draft &&
                draft.vertices.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={3} fill="#2463e8" />
                ))}
              {overlay.target && (
                <>
                  <circle
                    cx={overlay.target.x}
                    cy={overlay.target.y}
                    r={10 / v.zoom}
                    className="snap-target"
                  />
                  <circle
                    cx={overlay.target.x}
                    cy={overlay.target.y}
                    r={3 / v.zoom}
                    fill="#2463e8"
                  />
                </>
              )}
              {overlay.arrow &&
                (overlay.arrow.kind === 'rectangle' ||
                overlay.arrow.kind === 'circle' ||
                overlay.arrow.kind === 'line' ? (
                  <GraphicView object={overlay.arrow} points={overlay.arrow.kind === 'line' ? linePoints(overlay.arrow, doc) : undefined} />
                ) : overlay.arrow.kind === 'brace' ? (
                  <BraceView object={overlay.arrow} zoom={v.zoom} />
                ) : overlay.arrow.kind === 'electrical' ? (
                  <ElectricalView object={overlay.arrow} doc={doc} zoom={v.zoom} />
                ) : overlay.arrow.kind === 'loop-arrow' ? (
                  <LoopArrowView object={overlay.arrow} zoom={v.zoom} />
                ) : (
                  <ArrowView object={overlay.arrow} zoom={v.zoom} />
                ))}
            </g>
            <PlacementLayer
              doc={doc}
              type={placementType}
              preview={placementType ? smart.preview : null}
              continueEndpoint={isComponent ? smart.continueEndpoint : null}
              viewport={v}
              size={interactions.surfaceSize}
            />
            <TargetFeedbackLayer
              doc={doc}
              componentId={overlay.componentTarget}
              wireId={overlay.wireTarget}
              firstPoint={tool === 'voltage' ? interactions.voltageStart : null}
              zoom={v.zoom}
            />
            <PresetPlacementLayer point={overlay.mouse} zoom={v.zoom} />
            {tool === 'highlight-eraser' &&
              !interactions.space &&
              interactions.dragging !== 'pan' &&
              overlay.mouse && (
                <circle
                  className="eraser-preview"
                  data-testid="eraser-preview"
                  cx={overlay.mouse.x}
                  cy={overlay.mouse.y}
                  r={eraserSize / 2}
                  fill="rgba(110, 110, 115, 0.06)"
                  stroke="#6e6e73"
                  strokeWidth={1 / v.zoom}
                  strokeDasharray={`${3 / v.zoom} ${2 / v.zoom}`}
                  pointerEvents="none"
                />
              )}
          </g>
        </svg>
        {contextMenu && (
          <ActionMenu
            key={contextMenu.key}
            label={contextMenu.canvasOnly ? t('Canvas actions') : t('Selection actions')}
            items={contextItems}
            context={{
              ...contextMenu,
              onClose: () => setContextMenu(null),
              returnFocus: () => svgRef.current?.focus({ preventScroll: true }),
            }}
          />
        )}
        {editing && editTarget && (
          <InlineTextEditor
            key={`inline:${editing.id}`}
            target={editTarget}
            text={editing.text}
            viewport={v}
            surfaceSize={interactions.surfaceSize}
            svgRef={svgRef}
            onChange={(text) => interactions.setEditing({ ...editing, text })}
            onSave={interactions.saveEdit}
            onCancel={() => interactions.setEditing(null)}
          />
        )}
        <div className="editor-bottom">
          <div className="zoom-controls floating-surface">
            <IconButton label={t('Zoom out')} onClick={() => interactions.zoomAt(1 / 1.2)}>
              <Minus size={15} />
            </IconButton>
            <button
              className="zoom-number"
              aria-label={t('Fit circuit to view')}
              title={t('Fit circuit to view')}
              onClick={() => interactions.fit()}
            >
              {Math.round(v.zoom * 100)}%
            </button>
            <IconButton label={t('Zoom in')} onClick={() => interactions.zoomAt(1.2)}>
              <Plus size={15} />
            </IconButton>
            <div className="toolbar-divider" />
            <IconButton label={t('Fit to view (1)')} onClick={() => interactions.fit()}>
              <Maximize size={15} />
            </IconButton>
            <IconButton
              label={t('Grid (G)')}
              active={grid}
              onClick={() => useEditorStore.getState().toggleGrid()}
            >
              <Grid2X2 size={15} />
            </IconButton>
            <IconButton
              label={t('Snapping · hold Alt/Option to bypass')}
              active={snapEnabled}
              onClick={() => useEditorStore.getState().toggleSnap()}
            >
              <Magnet size={15} />
            </IconButton>
          </div>
          {hint && (
            <div className={`placement-feedback${isComponent ? ' has-placement-controls' : ''}`}>
              {isComponent && inlineCompatible(tool as ComponentType) && (
                <div
                  className="placement-controls"
                  role="group"
                  aria-label={t('Placement assistance')}
                >
                  <button
                    aria-pressed={smart.session.kind === 'inline'}
                    onClick={smart.toggleInline}
                    title={t('Enable insertion only when the preview shows the wire being split')}
                  >
                    {t('Insert into wire')}{' '}
                  </button>
                </div>
              )}
              <div className="canvas-hint" role="status">
                {isComponent ? (smartHint ?? hint) : hint}
              </div>
            </div>
          )}
        </div>
        <LanguageSwitcher />
        <IconButton label={t('Help')} className="help-control floating-surface" onClick={onHelp}>
          <HelpCircle size={18} />
        </IconButton>
      </main>
      <PropertiesInspector {...inspector} />
    </div>
  );
}
