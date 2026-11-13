import type { SVGProps } from 'react';

const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...p,
});

export const IconHex = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 2.5 20.5 7.25v9.5L12 21.5 3.5 16.75v-9.5Z" />
  </svg>
);
export const IconFullscreen = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);
export const IconSoundOn = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </svg>
);
export const IconSoundOff = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" />
    <path d="m16 9.5 5 5m0-5-5 5" />
  </svg>
);
export const IconHelp = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4M12 16.8h.01" />
  </svg>
);
export const IconReset = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" />
  </svg>
);
export const IconExit = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10" />
  </svg>
);
export const IconText = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5 6h14M5 10h14M5 14h9M5 18h11" />
  </svg>
);
export const IconPlay = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M8 5.5v13l10.5-6.5Z" />
  </svg>
);
export const IconPause = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <rect x="6.5" y="5" width="4" height="14" rx="1" />
    <rect x="13.5" y="5" width="4" height="14" rx="1" />
  </svg>
);
export const IconReplay = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" />
    <path d="M10.5 9.5v5l4-2.5Z" fill="currentColor" />
  </svg>
);
export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);
export const IconChevron = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
export const IconCamera = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 8h3l1.5-2h7L17 8h3v11H4Z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);

/* behaviour icons — fine line drawings */
export const IconFlight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <ellipse cx="12" cy="14" rx="2.2" ry="4.5" />
    <path d="M10 11.5C6 7 3 8 3.5 10.5S8 13 10 12.5M14 11.5C18 7 21 8 20.5 10.5S16 13 14 12.5" />
    <path d="M10.5 9 9 6.5M13.5 9 15 6.5" />
  </svg>
);
export const IconPollen = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="2.6" />
    <path d="M12 9.4V4M12 14.6V20M9.4 12H4M14.6 12H20M10.2 10.2 6.3 6.3M13.8 13.8l3.9 3.9M13.8 10.2l3.9-3.9M10.2 13.8l-3.9 3.9" />
    <circle cx="12" cy="4" r=".9" fill="currentColor" />
    <circle cx="20" cy="12" r=".9" fill="currentColor" />
    <circle cx="6.3" cy="17.7" r=".9" fill="currentColor" />
  </svg>
);
export const IconNectar = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 21v-7M12 14c-4 0-7-3-7-7 3 0 5 1.2 7 3.5C14 8.2 16 7 19 7c0 4-3 7-7 7Z" />
    <path d="M12 10.5V6.5" />
  </svg>
);
export const IconWater = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3.5s-5.5 6-5.5 9.8a5.5 5.5 0 0 0 11 0C17.5 9.5 12 3.5 12 3.5Z" />
    <path d="M3 20.5c2-1 4-1 6 0s4 1 6 0 4-1 6 0" />
  </svg>
);
export const IconWaggle = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 6v12" />
    <path d="M12 6c-6 0-6 12 0 12M12 6c6 0 6 12 0 12" strokeDasharray="2 2" />
    <path d="m10.5 8 3 1.5-3 1.5 3 1.5-3 1.5 3 1.5" />
  </svg>
);
export const IconComb = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m8 3 4 2.3v4.6L8 12.2 4 9.9V5.3ZM16 3l4 2.3v4.6l-4 2.3-4-2.3V5.3ZM12 10l4 2.3v4.6L12 19.2l-4-2.3v-4.6Z" />
  </svg>
);
