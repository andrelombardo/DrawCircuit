export function SidebarIcon({ side = 'left' }: { side?: 'left' | 'right' }) {
  return (
    <svg
      width="20"
      height="18"
      viewBox="0 0 24 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <g transform={side === 'right' ? 'translate(24 0) scale(-1 1)' : undefined}>
        <rect x="1.5" y="2" width="21" height="16" rx="3" />
        <path d="M8.5 2v16M4.5 5.5h1.5M4.5 8.5h1.5M4.5 11.5h1.5" />
      </g>
    </svg>
  );
}
