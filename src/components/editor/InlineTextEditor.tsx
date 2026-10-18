import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { MathText } from '../../circuit/annotations/MathText';
import { CIRCUIT_FONT } from '../../model/fonts';
import type { Viewport } from '../../model/types';
import type { InlineTextTarget } from '../../utils/labels';
import { MAX_TEXT_LENGTH } from '../../model/limits';

/** Native keyboard/IME editing over the same SVG/KaTeX renderer used by the document.
 * The input is transparent; only the rendered text, selection and caret are painted. */
export function InlineTextEditor({
  target,
  text,
  viewport,
  svgRef,
  onChange,
  onSave,
  onCancel,
}: {
  target: InlineTextTarget;
  text: string;
  viewport: Viewport;
  surfaceSize: { width: number; height: number };
  svgRef: RefObject<SVGSVGElement | null>;
  onChange: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const settled = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const rendered = useRef<SVGGElement>(null);
  const [box, setBox] = useState({
    x: 0,
    y: -target.fontSize / 2,
    width: target.fontSize,
    height: target.fontSize,
  });
  const [advances, setAdvances] = useState<number[]>([]);
  const [selection, setSelection] = useState({ start: 0, end: text.length });
  // Map source positions to visible glyph advances. Syntax characters have no ink;
  // command names occupy a single glyph. The native input retains the exact source.
  const units = (source: string) => (source.match(/\\[a-zA-Z]+|[^{}_^$]/g) ?? []).length;
  const advance = (position: number) =>
    advances[position] ??
    box.x + (box.width * units(text.slice(0, position))) / Math.max(1, units(text));
  useLayoutEffect(() => {
    const element = rendered.current;
    if (!element) return;
    const measure = () => {
      const bounds = element.getBBox?.();
      const plain = element.querySelector('text');
      const next =
        plain?.getNumberOfChars?.() === text.length && text.length
          ? [
              plain.getStartPositionOfChar(0).x,
              ...Array.from({ length: text.length }, (_, i) => plain.getEndPositionOfChar(i).x),
            ]
          : [];
      setAdvances((old) =>
        old.length === next.length && old.every((x, i) => x === next[i]) ? old : next,
      );
      if (bounds?.width && bounds.height)
        setBox((old) =>
          old.x === bounds.x &&
          old.y === bounds.y &&
          old.width === bounds.width &&
          old.height === bounds.height
            ? old
            : { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
        );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    const mutation = new MutationObserver(measure);
    mutation.observe(element, { subtree: true, attributes: true, childList: true });
    return () => {
      observer.disconnect();
      mutation.disconnect();
    };
  }, [text, target.fontSize]);
  const save = () => {
    if (settled.current) return;
    settled.current = true;
    onSave();
  };
  const syncSelection = () =>
    setSelection({
      start: input.current?.selectionStart ?? 0,
      end: input.current?.selectionEnd ?? 0,
    });
  return (
    <form
      className="inline-editor inline-text-editor"
      data-inline-editor={target.id}
      style={{
        left: target.point.x * viewport.zoom + viewport.x,
        top: target.point.y * viewport.zoom + viewport.y,
        transform: `scale(${viewport.zoom}) rotate(${target.rotation}deg)`,
      }}
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <svg className="inline-render" width="1" height="1" aria-hidden="true">
        <g ref={rendered}>
          <MathText
            text={text || ' '}
            color={target.color}
            opacity={target.opacity}
            fontSize={target.fontSize}
            align={target.align}
          />
        </g>
        {selection.start !== selection.end ? (
          <rect
            x={advance(selection.start)}
            y={box.y}
            width={Math.max(1, advance(selection.end) - advance(selection.start))}
            height={box.height}
            fill={target.color}
            opacity={0.12}
          />
        ) : (
          <path
            className="inline-caret"
            d={`M ${advance(selection.end)} ${box.y} v ${box.height}`}
            stroke={target.color}
            strokeWidth={1 / viewport.zoom}
          />
        )}
      </svg>
      <input
        ref={input}
        autoFocus
        aria-label="Modifica testo sul foglio"
        style={{
          fontFamily: CIRCUIT_FONT,
          fontSize: target.fontSize,
          left: box.x,
          top: box.y,
          width: Math.max(target.fontSize, box.width),
          height: box.height,
        }}
        autoComplete="off"
        spellCheck={false}
        maxLength={MAX_TEXT_LENGTH}
        value={text}
        onFocus={(event) => event.currentTarget.select()}
        onSelect={syncSelection}
        onChange={(event) => {
          onChange(event.target.value);
          syncSelection();
        }}
        onBlur={save}
        onPointerDown={(event) => {
          event.preventDefault();
          const rect = event.currentTarget.getBoundingClientRect();
          const angle = (target.rotation * Math.PI) / 180;
          const dx =
            event.clientX -
            (target.point.x * viewport.zoom +
              viewport.x +
              (svgRef.current?.getBoundingClientRect().left ?? 0));
          const dy =
            event.clientY -
            (target.point.y * viewport.zoom +
              viewport.y +
              (svgRef.current?.getBoundingClientRect().top ?? 0));
          const x = rect.width
            ? (dx * Math.cos(angle) + dy * Math.sin(angle)) / viewport.zoom
            : box.x;
          let best = 0;
          for (let i = 1; i <= text.length; i++)
            if (Math.abs(advance(i) - x) < Math.abs(advance(best) - x)) best = i;
          event.currentTarget.focus();
          event.currentTarget.setSelectionRange(
            event.shiftKey ? Math.min(selection.start, best) : best,
            best,
          );
          syncSelection();
        }}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.nativeEvent.isComposing) return;
          if (event.key === 'Escape') {
            event.preventDefault();
            settled.current = true;
            onCancel();
            svgRef.current?.focus();
          } else if (event.key === 'Enter') {
            event.preventDefault();
            save();
          }
        }}
      />
    </form>
  );
}
