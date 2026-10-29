/** @type {import('tailwindcss').Config} */

// ── Утверждённая палитра (единственное место, где заданы фирменные цвета) ──────────────────
// index.css читает эти значения через theme('colors.pal.*') и строит из них семантические --vol-*.
const pal = {
  brand:   '#2563EB', // кнопки, ссылки, активные элементы
  bg:      '#F1F6FD', // фон страниц и крупных светлых секций
  sky:     '#BCD5FB', // декор: формы, контуры, иллюстрации
  sky2:    '#8DB1F5', // вторичный декор; на тёмных поверхностях — акцент (контраст с #0B2038 7.6:1)
  white:   '#FFFFFF', // карточки, формы, поверхности
  ink:     '#0B2038', // заголовки и тёмные секции
  emerald: '#16343D', // отдельный тематический контейнер (сообщество), не фон всего сайта
  green:   '#00801C', // природа, рост (акцент, не основной цвет)
  red:     '#F34045', // сердце, срочность (не для мелкого белого текста)
  gold:    '#F7D47A', // тепло, достижения (декор или с тёмным текстом)
};

// ── Единая шкала (типографика, отступы, радиусы, тени) ─────────────────────────────────────
// Публичные страницы: text-h1 … text-meta (те же размеры, что у .vol-h1 … .vol-meta в index.css — классы
// собраны из этих токенов через @apply). Кабинеты (админка, организатор): text-ws-*.
// Значения сняты с реального использования: 13 / 13.5 px → meta, 14 / 14.5 px → ctrl, 15 px → body-sm.
const fontSize = {
  h1:          ['clamp(1.85rem, 1.2rem + 2.6vw, 3rem)',          { lineHeight: '1.1',  letterSpacing: '-.02em',  fontWeight: '800' }],
  'h1-detail': ['clamp(1.6rem, 1.25rem + 1.5vw, 2.375rem)',      { lineHeight: '1.15', letterSpacing: '-.018em', fontWeight: '800' }],
  h2:          ['clamp(1.6rem, 1rem + 2.2vw, 2.5rem)',           { lineHeight: '1.08', letterSpacing: '-.022em', fontWeight: '800' }],
  compact:     ['clamp(1.375rem, 1.15rem + .9vw, 1.75rem)',      { lineHeight: '1.2',  letterSpacing: '-.012em', fontWeight: '700' }],
  h3:          ['clamp(1.0625rem, 1rem + .3vw, 1.25rem)',        { lineHeight: '1.3',  letterSpacing: '-.005em', fontWeight: '700' }],
  lead:        ['clamp(1.0625rem, .95rem + .5vw, 1.25rem)',      { lineHeight: '1.6' }],
  body:        ['1rem',      { lineHeight: '1.65' }],
  'body-sm':   ['.9375rem',  { lineHeight: '1.6' }],
  ctrl:        ['.875rem',   { lineHeight: '1.25rem' }],
  meta:        ['.8125rem',  { lineHeight: '1.45' }],
  label:       ['.6875rem',  { lineHeight: '1rem', letterSpacing: '.08em', fontWeight: '600' }],
  // кабинеты: заголовок страницы · секции · основной · вторичный
  'ws-title':   ['clamp(1.35rem, 1.15rem + .8vw, 1.7rem)', { lineHeight: '1.2', letterSpacing: '-.015em', fontWeight: '700' }],
  'ws-section': ['1rem',     { lineHeight: '1.4', letterSpacing: '-.005em', fontWeight: '700' }],
  'ws-body':    ['.8125rem', { lineHeight: '1.25rem' }],
  'ws-meta':    ['.75rem',   { lineHeight: '1rem' }],
};

// Отступы ритма страницы: заголовок → описание, шапка секции → контент, вертикаль секции (вместо py-12/16/20).
const spacing = {
  head: '.75rem',
  block: 'clamp(1.75rem, 1.25rem + 1.5vw, 2.5rem)',
  section: 'clamp(3.5rem, 2.5rem + 2.5vw, 5rem)',
};

export default {
  // .container is defined in src/index.css (rem-based, scales with the root size on large monitors)
  corePlugins: { container: false },
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pal,

        // ── public site ──
        primary: pal.brand,
        'primary-dark': '#1D4ED8', // hover основной синей кнопки (оттенок фирменного)
        secondary: '#1e40af',
        accent: '#f59e0b',

        // Нейтрали страниц на Tailwind-классах (gray-*): сдвинуты в холодный оттенок палитры, чтобы страницы
        // без токенов vol-* выглядели так же, как страницы с ними. Для текста: 500 = 5.0:1 на #F1F6FD, 600 = 6.6:1.
        gray: {
          50: '#F1F6FD', 100: '#E8EEF8', 200: '#E2E8F2', 300: '#CBD5E4', 400: '#76839A',
          500: '#5E6A82', 600: '#4A5873', 700: '#2F3C57', 800: '#1B2A44', 900: '#0B2038',
        },

        // ── Admin design tokens (dark workspace). Names are semantic, values are dark-theme:
        //    ink-900 = primary text, ink-500 = secondary, ink-400 = muted, ink-300 = disabled.
        //    surface = cards, surface-2 = raised panels, surface-3 = hover/selected.
        //    <tone>-50 = tinted background, -200 = tinted border, -700 = text on tint, -600 = solid.
        //    ctrl = граница полей и кнопок (≥3:1 к поверхностям, WCAG 1.4.11).
        //    brand-600 (#494CD1) — только заливка кнопок с белым текстом; как цвет мелкого текста на тёмном он
        //    не проходит контраст (2.9:1), для текста и акцентов используйте brand-500/700 (#65ADE8 и светлее).
        brand: {
          50: '#0B1230', 100: '#121A44', 200: '#2A2F7A', 300: '#4A62C4', 400: '#5A9AD8', 500: '#65ADE8',
          600: '#494CD1', 700: '#8CC3EE', 800: '#2D3290', 900: '#0A0E26', 950: '#020611',
        },
        // Events page (afisha) palette. CSS variables are defined in index.css (:root, --vol-*).
        vol: {
          bg: 'var(--vol-bg)', surface: 'var(--vol-surface)', fg: 'var(--vol-fg)', muted: 'var(--vol-muted)', faint: 'var(--vol-faint)',
          line: 'var(--vol-line)', rule: 'var(--vol-rule)', ctrl: 'var(--vol-ctrl)', accent: 'var(--vol-accent)', 'accent-fg': 'var(--vol-accent-fg)',
          'accent-soft': 'var(--vol-accent-soft)', green: 'var(--vol-green)', sky: 'var(--vol-sky)', warn: 'var(--vol-warn)',
          head: 'var(--vol-head)', 'green-soft': 'var(--vol-green-soft)', emerald: 'var(--vol-emerald)', decor: 'var(--vol-decor)',
        },
        canvas: '#020611',
        surface: { DEFAULT: '#0A1020', 2: '#101828', 3: '#172033' },
        line: { DEFAULT: '#1E2740', strong: '#2C3756' },
        ctrl: '#667391',
        ink: { 900: '#F4FEFF', 700: '#CBD5E6', 500: '#A3AFC6', 400: '#8C98B0', 300: '#66728C' },
        success: { 50: '#10241a', 100: '#143323', 200: '#1f5a3a', 600: '#00801C', 700: '#6fd09a', 800: '#006B17' },
        warning: { 50: '#2a2110', 100: '#3a2d12', 200: '#6b501a', 600: '#d9962a', 700: '#f0bf68' },
        danger:  { 50: '#2a1416', 100: '#3a1b1e', 200: '#6b2b30', 500: '#C53A3A', 600: '#d94b4b', 700: '#f08585', 800: '#A82F2F' },
        // «информация» и «завершено» — голубой акцент админки (бирюзовые оттенки в системе не используются)
        info:    { 50: '#0A1A2C', 100: '#0E2540', 200: '#1F4A73', 600: '#65ADE8', 700: '#9CCBF2' },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      fontSize,
      spacing,
      // control — кнопки и поля везде; card — карточки кабинетов; panel — карточки публичных страниц;
      // sheet — модальные окна, формы входа, крупные CTA-блоки. Плашки и чипы — rounded-full.
      borderRadius: { control: '8px', card: '12px', panel: '16px', sheet: '24px' },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,.03) inset, 0 1px 2px rgba(0,0,0,.4)',
        pop: '0 24px 64px rgba(0,0,0,.55)',
        // публичные поверхности (тень цвета ink): покой · наведение · всплывающее (формы, модалки)
        soft: '0 1px 2px rgba(11,32,56,.06)',
        raise: '0 12px 32px rgba(11,32,56,.12)',
        float: '0 20px 44px rgba(11,32,56,.18)',
      },
    },
  },
  plugins: [],
};
