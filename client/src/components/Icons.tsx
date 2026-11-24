import type { ReactNode } from 'react';

const P: Record<string, ReactNode> = {
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />,
  pin: <><path d="M12 22s7-6.3 7-12a7 7 0 0 0-14 0c0 5.7 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  car: <><rect x="3" y="11" width="18" height="7" rx="2" /><path d="M5 11l2-5h10l2 5M7 18v2M17 18v2" /></>,
  bus: <><rect x="4" y="3" width="16" height="15" rx="2" /><path d="M4 11h16M8 18v3M16 18v3" /></>,
  check: <path d="M5 12l5 5L20 7" />,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>,
  fb: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  cal: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a7 7 0 0 1 14 0v1" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  up: <path d="M12 19V5M5 12l7-7 7 7" />,
  poraz: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>,
  vissza: <><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></>,
  ugras: <><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></>,
  figyelem: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
  sziv: <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />,
  villam: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  csillag: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
};

export function Icon({ name, size = 20, stroke = 'currentColor', width = 2 }: { name: string; size?: number; stroke?: string; width?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name] || P.csillag}
    </svg>
  );
}

export function Paw({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <ellipse cx="5.2" cy="10" rx="2.1" ry="2.6" /><ellipse cx="9.4" cy="5.6" rx="2.2" ry="2.8" /><ellipse cx="14.6" cy="5.6" rx="2.2" ry="2.8" /><ellipse cx="18.8" cy="10" rx="2.1" ry="2.6" />
      <path d="M12 11.2c-3.3 0-6.6 4.6-6.6 7.3 0 2 1.6 2.8 3.2 2.8 1.4 0 2.3-.8 3.4-.8s2 .8 3.4.8c1.6 0 3.2-.8 3.2-2.8 0-2.7-3.3-7.3-6.6-7.3z" />
    </svg>
  );
}

const WAVE = 'M0 50 C 200 90 380 10 600 35 C 820 60 980 95 1200 55 C 1320 35 1400 40 1500 45 L1500 90 L0 90 Z';
const WAVE2 = 'M0 60 C 240 20 420 80 660 55 C 900 30 1080 20 1300 60 C 1400 75 1450 70 1500 65 L1500 90 L0 90 Z';
export function Wave({ pos, fill, double }: { pos: 'top' | 'bottom'; fill: string; double?: boolean }) {
  return (
    <svg className={`wave ${pos}`} viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
      <path fill={fill} d={WAVE} />
      {double && <path fill={fill} d={WAVE2} />}
    </svg>
  );
}
