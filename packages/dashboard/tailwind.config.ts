import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gh: {
          canvas: 'var(--color-canvas-default)',
          subtle: 'var(--color-canvas-subtle)',
          inset: 'var(--color-canvas-inset)',
          border: 'var(--color-border-default)',
          'border-muted': 'var(--color-border-muted)',
          fg: 'var(--color-fg-default)',
          'fg-muted': 'var(--color-fg-muted)',
          'fg-subtle': 'var(--color-fg-subtle)',
          accent: 'var(--color-accent-fg)',
          'accent-emphasis': 'var(--color-accent-emphasis)',
          success: 'var(--color-success-fg)',
          danger: 'var(--color-danger-fg)',
          attention: 'var(--color-attention-fg)',
          btn: 'var(--color-btn-bg)',
          'btn-hover': 'var(--color-btn-hover)',
          'btn-primary': 'var(--color-btn-primary)',
          'btn-primary-hover': 'var(--color-btn-primary-hover)',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
      },
    },
  },
  plugins: [],
};

export default config;
