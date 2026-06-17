import type { SVGProps } from "react";

/** Lightweight inline icon set (stroke-based, currentColor). */

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const
};

type IconProps = SVGProps<SVGSVGElement>;

export const OrgIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="9" y="3" width="6" height="5" rx="1.2" />
    <rect x="3" y="15" width="6" height="5" rx="1.2" />
    <rect x="15" y="15" width="6" height="5" rx="1.2" />
    <path d="M12 8v3M6 15v-2h12v2" />
  </svg>
);

export const ScenarioIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3v4M12 17v4M5 12H3M21 12h-2" />
    <path d="M7 7l-1.5-1.5M18.5 5.5L17 7M7 17l-1.5 1.5M18.5 18.5L17 17" />
    <circle cx="12" cy="12" r="3.2" />
  </svg>
);

export const RecIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.6 10.8c.5.4.8.9.9 1.5l.1.7h5.2l.1-.7c.1-.6.4-1.1.9-1.5A6 6 0 0 0 12 3Z" />
  </svg>
);

export const MonitorIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3 13l3.5-4 3 3L15 6l3 3.5" />
    <path d="M3 20h18M3 4v16" />
  </svg>
);

export const ApiIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M8 7l-4 5 4 5M16 7l4 5-4 5M13.5 5l-3 14" />
  </svg>
);

export const ShieldIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3l7 3v5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3Z" />
    <path d="M9.2 12l2 2 3.6-4" />
  </svg>
);

export const IngestIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3v10m0 0l-3.5-3.5M12 13l3.5-3.5" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </svg>
);

export const DiffIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="6" cy="18" r="2.5" />
    <circle cx="18" cy="18" r="2.5" />
    <path d="M6 8.5v7M8.2 18H15M18 8v7.5" />
    <path d="M16 5h4m-2-2v4" />
  </svg>
);

export const Check = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);

export const Arrow = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const Bolt = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8Z" />
  </svg>
);
