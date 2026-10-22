import { useCallback, useEffect, useRef, useState } from 'react';
import { componentRegistry } from '../model/catalog';
import { componentTypes } from '../model/types';
import type { ComponentType, Endpoint, Point, Viewport } from '../model/types';
import { useEditorStore } from '../store/editorStore';
import { distance, resolveEndpoint, snapPoint } from '../utils/geometry';
import {
  alignmentGuides,
  anchorOrientation,
  anchorTerminal,
  findAnchorTarget,
  findInlineCandidate,
  findSnapCandidate,
  inlineCompatible,
  snappedPosition,
} from './findCandidates';
import { smartPlacement } from './smartConnection';
import { freeSession } from './types';
import type { PlacementPreview, PlacementSession } from './types';

export function useSmartPlacement(viewport: Viewport) {
  const [session, setSession] = useState<PlacementSession>(freeSession);
  const [preview, setPreview] = useState<PlacementPreview | null>(null);
  const [continueEndpoint, setContinueEndpoint] = useState<Endpoint | null>(null);
  const sessionRef = useRef(session),
    previewRef = useRef(preview);
  const pointer = useRef<{ point: Point; type: ComponentType; alt: boolean } | null>(null);
  const recompute = useRef<() => void>(() => {});
  function changeSession(next: PlacementSession) {
    sessionRef.current = next;
    setSession(next);
  }
  function changePreview(next: PlacementPreview | null) {
    // Grid cells and held snap positions often do not change between pointer events.
    if (JSON.stringify(next) === JSON.stringify(previewRef.current)) return;
    previewRef.current = next;
    setPreview(next);
  }
  const reset = useCallback(() => {
    const next = freeSession();
    sessionRef.current = next;
    setSession(next);
    previewRef.current = null;
    setPreview(null);
    setContinueEndpoint(null);
    pointer.current = null;
  }, []);
  function move(type: ComponentType, point: Point, alt = false): PlacementPreview {
    pointer.current = { point, type, alt };
    const s = useEditorStore.getState(),
      current = sessionRef.current;
    let position = alt || !s.snapEnabled ? { ...point } : snapPoint(point),
      rotation = s.placementRotation;
    let next: PlacementPreview = { phase: 'free', position, rotation, guides: [] };
    if (!alt && s.snapEnabled) {
      if (current.kind === 'anchored') {
        if (!current.manualRotation && inlineCompatible(type))
          rotation = anchorOrientation(
            point,
            current.target.point,
            previewRef.current?.rotation ?? rotation,
          );
        const terminalId =
          current.terminalId ?? anchorTerminal(type, position, current.target.point, rotation);
        next = {
          phase: 'anchored',
          target: current.target,
          terminalId,
          position,
          rotation,
          guides: [],
        };
      } else if (current.kind === 'inline') {
        const held =
          previewRef.current?.phase === 'inline-candidate' ? previewRef.current.candidate : null;
        const candidate = findInlineCandidate(
          s.document,
          type,
          point,
          rotation,
          viewport.zoom,
          current.manualRotation,
          held,
        );
        if (candidate)
          next = {
            phase: 'inline-candidate',
            candidate,
            position: candidate.position,
            rotation: candidate.rotation,
            guides: [],
          };
      } else {
        const anchor = findAnchorTarget(s.document, point, viewport.zoom);
        const held = previewRef.current?.phase === 'snapped' ? previewRef.current.candidate : null;
        const candidate = findSnapCandidate(
          s.document,
          type,
          point,
          rotation,
          viewport.zoom,
          current.terminalId,
          held,
        );
        const anchorDistance = anchor ? distance(point, anchor.point) * viewport.zoom : Infinity;
        // At low zoom the center and a preview pin can both be inside a target's hitbox.
        // A clearly closer preview pin wins; a direct click on the target still anchors.
        if (
          anchor &&
          (anchorDistance <= 2 || !candidate || anchorDistance + 2 < candidate.distance)
        )
          next = { phase: 'anchor-target', target: anchor, position, rotation, guides: [] };
        else {
          if (candidate) {
            position = snappedPosition(type, rotation, candidate);
            next = { phase: 'snapped', candidate, position, rotation, guides: [] };
          }
        }
      }
      next.guides = alignmentGuides(s.document, type, next.position, next.rotation, viewport.zoom);
    }
    changePreview(next);
    return next;
  }
  // Events read current state through refs; rotation and modifiers refresh a stationary ghost too.
  useEffect(() => {
    recompute.current = () => {
      const p = pointer.current;
      if (p) move(p.type, p.point, p.alt);
    };
  });
  useEffect(
    () =>
      useEditorStore.subscribe((s, prev) => {
        if (
          s.tool !== prev.tool ||
          (componentTypes.includes(s.tool as ComponentType) &&
            s.selection !== prev.selection &&
            !s.selection.length)
        ) {
          reset();
        } else if (s.snapEnabled !== prev.snapEnabled) {
          recompute.current();
        } else if (s.placementRotation !== prev.placementRotation) {
          changeSession({ ...sessionRef.current, manualRotation: true });
          recompute.current();
        } else if (s.document !== prev.document) {
          // Never retain a candidate referring to a document that has been replaced.
          if (sessionRef.current.kind === 'anchored') {
            const anchored = sessionRef.current;
            try {
              const point = resolveEndpoint(anchored.target.endpoint, s.document);
              changeSession({ ...anchored, target: { ...anchored.target, point } });
            } catch {
              reset();
            }
          }
          changePreview(null);
        }
      }),
    [reset],
  );
  const modifierKey = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Alt' || !pointer.current) return;
    pointer.current.alt = e.type === 'keydown';
    recompute.current();
  }, []);
  const blur = useCallback(() => {
    if (pointer.current) pointer.current.alt = false;
    previewRef.current = null;
    setPreview(null);
  }, []);
  const leave = useCallback(() => {
    previewRef.current = null;
    pointer.current = null;
    setPreview(null);
  }, []);
  const rotatePlacement = useCallback(() => {
    const s = useEditorStore.getState(),
      current = previewRef.current;
    // R rotates the orientation actually visible during an assisted placement.
    if (
      (current?.phase === 'anchored' || current?.phase === 'inline-candidate') &&
      current.rotation !== s.placementRotation
    )
      useEditorStore.setState({ placementRotation: current.rotation });
    s.rotatePlacement();
  }, []);
  useEffect(() => {
    recompute.current();
  }, [viewport]);
  function confirm(type: ComponentType, point: Point, alt: boolean, drop = false): boolean {
    const visible = previewRef.current;
    const next = move(type, point, alt);
    if (next.phase === 'anchor-target' && !drop) {
      changeSession({
        kind: 'anchored',
        target: next.target,
        terminalId: sessionRef.current.terminalId,
        manualRotation: sessionRef.current.manualRotation,
      });
      move(type, point, alt);
      return true;
    }
    const confirmedSnap =
      next.phase === 'snapped' &&
      visible?.phase === 'snapped' &&
      next.candidate.key === visible.candidate.key;
    const confirmedInline =
      next.phase === 'inline-candidate' &&
      visible?.phase === 'inline-candidate' &&
      next.candidate.segment.key === visible.candidate.segment.key;
    if (confirmedSnap || next.phase === 'anchored' || confirmedInline) {
      const s = useEditorStore.getState(),
        result = smartPlacement(s.document, type, next);
      s.commit(result.doc);
      s.select([result.component.id]);
      setContinueEndpoint(result.continueEndpoint);
      const mode = sessionRef.current.kind === 'inline' ? 'inline' : 'free';
      changeSession({
        kind: mode,
        terminalId: sessionRef.current.terminalId,
        manualRotation: false,
      });
      changePreview(null);
      pointer.current = null;
      return true;
    }
    // The original placement function handles all free clicks and Alt/Option placements.
    changeSession({
      kind: sessionRef.current.kind === 'inline' ? 'inline' : 'free',
      terminalId: sessionRef.current.terminalId,
      manualRotation: false,
    });
    changePreview(null);
    setContinueEndpoint(null);
    pointer.current = null;
    return false;
  }
  function chooseTerminal(terminalId: string | null) {
    changeSession({ ...sessionRef.current, terminalId });
    recompute.current();
  }
  function toggleInline() {
    changeSession({
      kind: sessionRef.current.kind === 'inline' ? 'free' : 'inline',
      terminalId: sessionRef.current.terminalId,
      manualRotation: sessionRef.current.manualRotation,
    });
    recompute.current();
  }
  const tool = useEditorStore.getState().tool as ComponentType;
  return {
    session,
    preview,
    continueEndpoint,
    move,
    confirm,
    chooseTerminal,
    toggleInline,
    reset,
    modifierKey,
    blur,
    rotatePlacement,
    leave,
    terminalOptions: componentRegistry[tool]?.terminals ?? [],
  };
}
