/** @type {import('tailwindcss').Config} */
export default {
  // .container is defined in src/index.css (rem-based, scales with the root size on large monitors)
  corePlugins: { container: false },
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── public site (unchanged) ──
        primary: '#2563EB',
        'primary-dark': '#095488',
        secondary: '#1e40af',
        accent: '#f59e0b',

        // ── Admin design tokens (dark workspace). Names are semantic, values are dark-theme:
        //    ink-900 = primary text, ink-500 = secondary, ink-400 = muted, ink-300 = disabled.
        //    surface = cards, surface-2 = raised panels, surface-3 = hover/selected.
        //    <tone>-50 = tinted background, -200 = tinted border, -700 = text on tint, -600 = solid.
        brand: {
          50: '#12203a', 100: '#192c4f', 200: '#24407a', 300: '#3b62ad', 400: '#5a8cf0',
          500: '#6b9bff', 600: '#2f6bdb', 700: '#8db4ff', 800: '#0f4a7a', 900: '#0e1c33', 950: '#05080c',
        },
        // Events page (afisha) palette. CSS variables are defined in index.css (:root, --vol-*).
        vol: {
          bg: 'var(--vol-bg)', surface: 'var(--vol-surface)', fg: 'var(--vol-fg)', muted: 'var(--vol-muted)', faint: 'var(--vol-faint)',
          line: 'var(--vol-line)', rule: 'var(--vol-rule)', accent: 'var(--vol-accent)', 'accent-fg': 'var(--vol-accent-fg)',
          'accent-soft': 'var(--vol-accent-soft)', green: 'var(--vol-green)', mint: 'var(--vol-mint)', warn: 'var(--vol-warn)',
          head: 'var(--vol-head)', quiet: 'var(--vol-quiet)', 'green-soft': 'var(--vol-green-soft)',
        },
        canvas: '#0b0f14',
        surface: { DEFAULT: '#111820', 2: '#151d27', 3: '#1b2531' },
        line: { DEFAULT: '#1f2935', strong: '#2c3846' },
        ink: { 900: '#e6ebf2', 700: '#c3ccd8', 500: '#9aa7b8', 400: '#7a8799', 300: '#4c586a' },
        success: { 50: '#10241a', 100: '#143323', 200: '#1f5a3a', 600: '#1f9d55', 700: '#6fd09a' },
        warning: { 50: '#2a2110', 100: '#3a2d12', 200: '#6b501a', 600: '#d9962a', 700: '#f0bf68' },
        danger:  { 50: '#2a1416', 100: '#3a1b1e', 200: '#6b2b30', 600: '#d94b4b', 700: '#f08585' },
        info:    { 50: '#0f2427', 100: '#133238', 200: '#1e5a63', 600: '#1496a8', 700: '#6bd0de' },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '12px', control: '8px' },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,.03) inset, 0 1px 2px rgba(0,0,0,.4)',
        pop: '0 24px 64px rgba(0,0,0,.55)',
      },
    },
  },
  plugins: [],
};
