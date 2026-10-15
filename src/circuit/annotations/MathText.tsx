import { memo, useLayoutEffect, useRef, useState } from 'react';
import { CIRCUIT_FONT } from '../../model/fonts';
import type { Rotation } from '../../model/types';
import { renderLatex } from '../../math/latex';

export function LatexPreview({ text }: { text: string }) {
  const result = renderLatex(text);
  return result.kind === 'math' ? (
    <span className="latex-preview" dangerouslySetInnerHTML={{ __html: result.html }} />
  ) : (
    <span
      style={{ fontFamily: CIRCUIT_FONT }}
      data-latex-error={result.kind === 'invalid' || undefined}
    >
      {text || '…'}
      {result.kind === 'invalid' && <small className="latex-error"> · LaTeX da correggere</small>}
    </span>
  );
}

export const MathText = memo(function MathText({
  text,
  x = 0,
  y = 0,
  color,
  opacity,
  fontSize = 22,
  align = 'middle',
  rotation = 0,
  labelId,
  selected = false,
}: {
  text: string;
  x?: number;
  y?: number;
  color: string;
  opacity?: number;
  fontSize?: number;
  align?: 'start' | 'middle' | 'end';
  rotation?: Rotation;
  labelId?: string;
  selected?: boolean;
}) {
  const result = renderLatex(text);
  const content = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1, height: 1 });
  useLayoutEffect(() => {
    const el = content.current;
    if (!el) return;
    let active = true;
    const measure = () => {
      if (!active) return;
      const width = Math.max(1, el.offsetWidth),
        height = Math.max(1, el.offsetHeight);
      setSize((previous) =>
        previous.width === width && previous.height === height ? previous : { width, height },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    void document.fonts?.ready.then(measure);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [text, fontSize, result.kind]);
  if (result.kind === 'math') {
    return (
      <g
        transform={`translate(${x} ${y}) rotate(${rotation})`}
        opacity={opacity}
        data-label={labelId}
        data-source={text}
        aria-label={text}
        className={`math-label${selected ? ' selected-label' : ''}`}
        data-active-label={selected || undefined}
      >
        <foreignObject
          x={align === 'start' ? 0 : align === 'end' ? -size.width : -size.width / 2}
          y={-size.height / 2}
          width={size.width}
          height={size.height}
          overflow="visible"
        >
          <div
            ref={content}
            className="math-label-content"
            style={{ fontSize, color }}
            dangerouslySetInnerHTML={{ __html: result.html }}
          />
        </foreignObject>
      </g>
    );
  }
  return (
    <text
      x={x}
      y={y}
      fill={color}
      opacity={opacity}
      fontSize={fontSize}
      pointerEvents="bounding-box"
      textAnchor={align}
      dominantBaseline="middle"
      className={`handwriting${selected ? ' selected-label' : ''}`}
      data-active-label={selected || undefined}
      style={{ fontFamily: CIRCUIT_FONT }}
      data-font="Comic Relief"
      transform={rotation ? `rotate(${rotation} ${x} ${y})` : undefined}
      data-label={labelId}
      data-source={text}
      data-latex-error={result.kind === 'invalid' || undefined}
    >
      {result.kind === 'invalid' && <title>LaTeX da correggere · doppio clic per modificare</title>}
      {text.split('\n').map((line, index) => (
        <tspan key={index} x={x} dy={index ? fontSize * 1.35 : 0}>
          {line}
        </tspan>
      ))}
    </text>
  );
});
