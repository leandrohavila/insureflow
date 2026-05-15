/**
 * Programmatic mirror of CSS custom properties in `styles/insureflow.css`.
 * Use for charts, PDFs, React Native, or any non-Tailwind surface.
 */

export const ifSpace = {
  0: "var(--if-space-0)",
  px: "var(--if-space-px)",
  0.5: "var(--if-space-0-5)",
  1: "var(--if-space-1)",
  1.5: "var(--if-space-1-5)",
  2: "var(--if-space-2)",
  2.5: "var(--if-space-2-5)",
  3: "var(--if-space-3)",
  3.5: "var(--if-space-3-5)",
  4: "var(--if-space-4)",
  5: "var(--if-space-5)",
  6: "var(--if-space-6)",
  7: "var(--if-space-7)",
  8: "var(--if-space-8)",
  9: "var(--if-space-9)",
  10: "var(--if-space-10)",
  11: "var(--if-space-11)",
  12: "var(--if-space-12)",
  14: "var(--if-space-14)",
  16: "var(--if-space-16)",
  20: "var(--if-space-20)",
  24: "var(--if-space-24)",
  28: "var(--if-space-28)",
  32: "var(--if-space-32)",
} as const;

export const ifRadius = {
  xs: "var(--if-radius-xs)",
  sm: "var(--if-radius-sm)",
  md: "var(--if-radius-md)",
  lg: "var(--if-radius-lg)",
  xl: "var(--if-radius-xl)",
  "2xl": "var(--if-radius-2xl)",
  "3xl": "var(--if-radius-3xl)",
  "4xl": "var(--if-radius-4xl)",
  full: "var(--if-radius-full)",
  /** shadcn-scale token bound to `var(--radius)` */
  shell: "var(--radius)",
} as const;

export const ifShadow = {
  xs: "var(--shadow-if-xs)",
  sm: "var(--shadow-if-sm)",
  md: "var(--shadow-if-md)",
  lg: "var(--shadow-if-lg)",
  xl: "var(--shadow-if-xl)",
  focus: "var(--shadow-if-focus)",
} as const;

export const ifTypography = {
  fontSize: {
    "2xs": "var(--if-text-2xs)",
    xs: "var(--if-text-xs)",
    sm: "var(--if-text-sm)",
    base: "var(--if-text-base)",
    md: "var(--if-text-md)",
    lg: "var(--if-text-lg)",
    xl: "var(--if-text-xl)",
    "2xl": "var(--if-text-2xl)",
    "3xl": "var(--if-text-3xl)",
    "4xl": "var(--if-text-4xl)",
    display: "var(--if-text-display)",
  },
  lineHeight: {
    "2xs": "var(--if-text-2xs--line-height)",
    xs: "var(--if-text-xs--line-height)",
    sm: "var(--if-text-sm--line-height)",
    base: "var(--if-text-base--line-height)",
    md: "var(--if-text-md--line-height)",
    lg: "var(--if-text-lg--line-height)",
    xl: "var(--if-text-xl--line-height)",
    "2xl": "var(--if-text-2xl--line-height)",
    "3xl": "var(--if-text-3xl--line-height)",
    "4xl": "var(--if-text-4xl--line-height)",
    display: "var(--if-text-display--line-height)",
  },
  letterSpacing: {
    tight: "var(--if-letter-tight)",
    snug: "var(--if-letter-snug)",
    body: "var(--if-letter-body)",
  },
  fontWeight: {
    regular: "var(--if-font-weight-regular)",
    medium: "var(--if-font-weight-medium)",
    semibold: "var(--if-font-weight-semibold)",
    bold: "var(--if-font-weight-bold)",
  },
} as const;

export const ifMotion = {
  ease: {
    outExpo: "var(--if-ease-out-expo)",
    standard: "var(--if-ease-standard)",
  },
  duration: {
    fast: "var(--if-duration-fast)",
    base: "var(--if-duration-base)",
    slow: "var(--if-duration-slow)",
  },
} as const;

/** Semantic colors — always reference CSS vars so light/dark stay in sync. */
export const ifSemantic = {
  background: "var(--background)",
  foreground: "var(--foreground)",
  card: "var(--card)",
  cardForeground: "var(--card-foreground)",
  popover: "var(--popover)",
  popoverForeground: "var(--popover-foreground)",
  primary: "var(--primary)",
  primaryForeground: "var(--primary-foreground)",
  secondary: "var(--secondary)",
  secondaryForeground: "var(--secondary-foreground)",
  muted: "var(--muted)",
  mutedForeground: "var(--muted-foreground)",
  accent: "var(--accent)",
  accentForeground: "var(--accent-foreground)",
  destructive: "var(--destructive)",
  destructiveForeground: "var(--destructive-foreground)",
  success: "var(--success)",
  successForeground: "var(--success-foreground)",
  warning: "var(--warning)",
  warningForeground: "var(--warning-foreground)",
  info: "var(--info)",
  infoForeground: "var(--info-foreground)",
  border: "var(--border)",
  input: "var(--input)",
  ring: "var(--ring)",
  chart: {
    1: "var(--chart-1)",
    2: "var(--chart-2)",
    3: "var(--chart-3)",
    4: "var(--chart-4)",
    5: "var(--chart-5)",
  },
  sidebar: {
    DEFAULT: "var(--sidebar)",
    foreground: "var(--sidebar-foreground)",
    primary: "var(--sidebar-primary)",
    primaryForeground: "var(--sidebar-primary-foreground)",
    accent: "var(--sidebar-accent)",
    accentForeground: "var(--sidebar-accent-foreground)",
    border: "var(--sidebar-border)",
    ring: "var(--sidebar-ring)",
  },
  insureGlow: "var(--insure-glow)",
} as const;
