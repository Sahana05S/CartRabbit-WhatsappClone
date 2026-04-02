/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          panel:     'var(--bg-panel)',
          hover:     'var(--bg-hover)',
          active:    'var(--bg-active)',
        },
        accent: {
          DEFAULT: 'var(--accent-default)',
          light:   'var(--accent-light)',
          dark:    'var(--accent-dark)',
        },
        surface: {
          DEFAULT: 'var(--surface-default)',
          light:   'var(--surface-light)',
        },
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
        },
        bubble: {
          in: 'var(--bubble-in)',
          out: 'var(--bubble-out)',
        },
        border: {
          DEFAULT: 'var(--border-color)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'slide-up':         'slideUp 0.2s ease-out',
        'slide-up-right':   'slideUpRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up-left':    'slideUpLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in':          'fadeIn 0.25s ease-out',
        'scale-in':         'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'spin-slow':        'spin 1.5s linear infinite',
        'highlight-flash':  'highlightFlash 1.4s ease-out forwards',
        'slide-in-right':   'slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        slideUp: {
          '0%':   { transform: 'translateY(6px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',   opacity: '1' },
        },
        slideUpRight: {
          '0%':   { transform: 'translateY(10px) translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0) translateX(0)',   opacity: '1' },
        },
        slideUpLeft: {
          '0%':   { transform: 'translateY(10px) translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0) translateX(0)',   opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%':   { transform: 'scale(0.8) translateY(2px)', opacity: '0' },
          '100%': { transform: 'scale(1) translateY(0)',    opacity: '1' },
        },
        highlightFlash: {
          '0%':   { backgroundColor: 'var(--highlight)' },
          '60%':  { backgroundColor: 'var(--highlight)' },
          '100%': { backgroundColor: 'transparent' },
        },
        slideInRight: {
          '0%':   { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',     opacity: '1' },
        },
      },
      boxShadow: {
        accent: '0 4px 24px rgba(124, 58, 237, 0.25)',
        panel:  '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}
