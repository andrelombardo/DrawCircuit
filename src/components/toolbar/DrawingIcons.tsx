import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };
function DrawingIcon({ size = 18, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function LoopPathIcon(props: IconProps) {
  return (
    <DrawingIcon {...props}>
      <path d="M18 5H8a4 4 0 0 0-4 4v6a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-4" />
      <path d="m15 2 3 3-3 3" />
    </DrawingIcon>
  );
}

export function BraceToolIcon(props: IconProps) {
  return (
    <DrawingIcon {...props}>
      <path d="M8 3H6a2 2 0 0 0-2 2v4a3 3 0 0 1-2 3 3 3 0 0 1 2 3v4a2 2 0 0 0 2 2h2M16 3h2a2 2 0 0 1 2 2v4a3 3 0 0 0 2 3 3 3 0 0 0-2 3v4a2 2 0 0 1-2 2h-2" />
    </DrawingIcon>
  );
}

export function BracketToolIcon(props: IconProps) {
  return (
    <DrawingIcon {...props}>
      <path d="M8 4H4v16h4M16 4h4v16h-4" />
    </DrawingIcon>
  );
}

export function PolarityIcon(props: IconProps) {
  return (
    <DrawingIcon {...props}>
      <path d="M3 8h8M7 4v8M15 16h6" />
    </DrawingIcon>
  );
}

export function VoltageIcon(props: IconProps) {
  return (
    <DrawingIcon {...props}>
      <circle cx="3" cy="12" r="1.5" />
      <circle cx="21" cy="12" r="1.5" />
      <path d="M5 12h2M17 12h2M9 8l3 8 3-8" />
    </DrawingIcon>
  );
}

export function CurrentInlineIcon(props: IconProps) {
  return (
    <DrawingIcon {...props}>
      <path d="M2 12h20M11 8l4 4-4 4" />
    </DrawingIcon>
  );
}
