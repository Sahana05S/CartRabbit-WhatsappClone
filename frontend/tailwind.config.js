/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   '#0b0f19',
          secondary: '#111827',
          panel:     '#161d2e',
          hover:     '#1c2538',
          active:    '#1e2d45',
        },
        accent: {
          DEFAULT: '#7c3aed',
          light:   '#a78bfa',
          dark:    '#5b21b6',
        },
        surface: {
          DEFAULT: '#1e293b',
          light:   '#334155',
        },
        text: {
          primary:   '#f1f5f9',
          secondary: '#94a3b8',
          muted:     '#64748b',
        },
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
          '0%':   { backgroundColor: 'rgba(124, 58, 237, 0.25)' },
          '60%':  { backgroundColor: 'rgba(124, 58, 237, 0.15)' },
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
