import { SvgIcon, type SvgIconProps } from '@mui/material';

// Custom bookshelf SVG used as the Library icon (header navigation and settings).
export function BookshelfIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <rect x={5} y={3.5} width={14} height={5} rx={0.7} />
        <path d="M7.25 3.5v5" />
        <rect x={3.5} y={9.5} width={15} height={5} rx={0.7} />
        <path d="M5.75 9.5v5" />
        <rect x={4.5} y={15.5} width={16} height={5} rx={0.7} />
        <path d="M6.75 15.5v5" />
      </g>
    </SvgIcon>
  );
}
