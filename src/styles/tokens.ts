/**
 * GapGPT Node Canvas — Design Tokens (TypeScript)
 * Phase 11 — usable in components & Tailwind extend
 */

export const colors = {
  bg: {
    base: '#111827',
    elevated: '#0f172a',
    card: '#1e293b',
    hover: '#334155',
  },
  border: {
    DEFAULT: '#334155',
    subtle: '#1e293b',
  },
  text: {
    primary: '#ffffff',
    muted: '#94a3b8',
    disabled: '#64748b',
  },
  accent: {
    blue: '#3b82f6',      // text node
    purple: '#8b5cf6',    // image
    pink: '#ec4899',      // video
    amber: '#f59e0b',     // merge
    orange: '#f97316',    // conditional
    teal: '#14b8a6',      // loop
    indigo: '#6366f1',    // memory
    emerald: '#10b981',   // file
  },
  status: {
    success: '#22c55e',
    error: '#ef4444',
    running: '#3b82f6',
    warning: '#f59e0b',
  },
} as const

export const typography = {
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  size: {
    display: '28px',
    title: '22px',
    heading: '16px',
    body: '14px',
    caption: '12px',
    micro: '10px',
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
} as const

export const radius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 12px rgba(0, 0, 0, 0.4)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
} as const

export const layout = {
  topbarHeight: '56px',
  sidebarWidth: '260px',
  sidebarCollapsed: '64px',
  propertiesWidth: '300px',
} as const

export const nodeTypeColor: Record<string, string> = {
  text: colors.accent.blue,
  image: colors.accent.purple,
  video: colors.accent.pink,
  merge: colors.accent.amber,
  conditional: colors.accent.orange,
  loop: colors.accent.teal,
  memory: colors.accent.indigo,
  file: colors.accent.emerald,
}

export const tokens = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  layout,
  nodeTypeColor,
} as const

export default tokens
