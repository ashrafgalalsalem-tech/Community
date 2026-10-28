/**
 * Executive Design Tokens for Healthcare Leadership Community
 * Powered by Saudi German Hospital Egypt
 * 
 * Visual Identity Reference: Saudi German Hospital Egypt (https://sgheg.com/sgh/#/sgh/en)
 * Primary Colors:
 *   - SGH Heritage Medical Emerald: #008765 (Dark: #006B52, Light Tint: #E6F4F1)
 *   - SGH Horizon Sky Blue: #0094D9 (Cobalt Interactive: #0284C7, Light Tint: #E0F2FE)
 * Typography:
 *   - Headings & Display: 'Outfit', 'Cairo', sans-serif
 *   - Body & Longform: 'Plus Jakarta Sans', 'Cairo', sans-serif
 *   - Data & Counters: font-mono tabular-nums
 */

export const BRAND = {
  name: 'Healthcare Leaders Community',
  powerBy: '',
  fullName: 'Healthcare Leaders Community',
  hospitalName: 'Healthcare Leaders Community',
  hospitalNameArabic: 'مجتمع القادة الصحيين',
  tagline: 'Advancing Executive Healthcare Leadership & Excellence',
  taglineArabic: 'تعزيز التميز والريادة التنفيذية في الرعاية الصحية',
  accreditation: 'Executive Healthcare Leaders Network',
  topEmployer: 'Executive Leadership Excellence',
  address: 'Executive Healthcare Center, Cairo, Egypt',
  inauguralDate: '27 October 2026',
  adminBootstrapEmail: 'Ashrafgalalsalem@gmail.com',
  adminUsername: 'admin',

  // Official Verified Assets in Repository (Dual Academy Logos)
  logos: {
    full: '/assets/aistudio/Academy-logos-01_08a20a13.png',
    emblem: '/assets/aistudio/Academy-logos-03_a9a4c809.png',
  }
};

export const COLORS = {
  background: {
    pure: '#FFFFFF',
    subtle: '#F8FAFC',
    card: '#FFFFFF',
    elevated: '#F1F5F9',
    blueTint: '#F0F9FF',
    greenTint: '#F0FDF4',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
  },
  text: {
    heading: '#0F172A',
    body: '#334155',
    muted: '#64748B',
    subtle: '#94A3B8',
  },
  // Official Saudi German Hospital Medical Emerald & Sky Blue from Logo
  emerald: {
    primary: '#008765',
    dark: '#006B52',
    light: '#E6F4F1',
    border: '#A7F3D0',
    text: '#065F46',
  },
  blue: {
    primary: '#0094D9', // Official sky blue from logo ribbon heart
    dark: '#0284C7',
    light: '#E0F2FE',
    border: '#BAE6FD',
  },
  slate: {
    900: '#0F172A',
    800: '#1E293B',
    700: '#334155',
    600: '#475569',
    500: '#64748B',
    400: '#94A3B8',
    300: '#CBD5E1',
    200: '#E2E8F0',
    100: '#F1F5F9',
    50: '#F8FAFC',
  },
  status: {
    pending: '#D97706',
    approved: '#008765',
    rejected: '#DC2626',
  }
};

/**
 * Reusable Design System Tokens
 */
export const DESIGN_TOKENS = {
  colors: {
    primary: '#008765',
    primaryHover: '#006B52',
    primarySurface: '#E6F4F1',
    primaryBorder: '#A7F3D0',
    secondary: '#0094D9',
    secondaryInteractive: '#0284C7',
    secondarySurface: '#E0F2FE',
    secondaryBorder: '#BAE6FD',
    canvas: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    borderMuted: '#F1F5F9',
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
  },
  radii: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px - standard buttons and inputs
    lg: '0.75rem',   // 12px - cards and dropdowns
    xl: '1rem',      // 16px - featured containers
    full: '9999px',
  },
  typography: {
    fontDisplay: "'Outfit', 'Cairo', system-ui, sans-serif",
    fontBody: "'Plus Jakarta Sans', 'Cairo', system-ui, sans-serif",
    fontArabic: "'Cairo', system-ui, sans-serif",
  },
  shadows: {
    card: '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)',
    hover: '0 8px 24px -4px rgba(0, 135, 101, 0.08), 0 4px 6px -2px rgba(0, 135, 101, 0.04)',
    elevated: '0 12px 32px -4px rgba(15, 23, 42, 0.12)',
  }
};

export const TOPIC_CATEGORIES = [
  'Human Capital Management',
  'Healthcare Workforce Development',
  'Talent Management & Retention',
  'Leadership Development',
  'Learning & Development',
  'Organizational Effectiveness',
  'Employee Experience',
  'Healthcare Education & Collaboration',
] as const;

export type TopicCategory = typeof TOPIC_CATEGORIES[number];

export const LEADERSHIP_DOMAINS = [
  'Human Capital Management',
  'Workforce Strategy & Retention',
  'Executive Leadership & Governance',
  'Learning, Training & Academies',
  'Organizational Effectiveness & Culture',
  'Employee Experience & Wellbeing',
  'Institutional Accreditation & Quality',
] as const;
