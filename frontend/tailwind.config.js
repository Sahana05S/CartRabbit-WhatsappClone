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
        'slide-up':  'slideUp 0.2s ease-out',
        'fade-in':   'fadeIn 0.25s ease-out',
        'scale-in':  'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 1.5s linear infinite',
      },
      keyframes: {
        slideUp: {
          '0%':   { transform: 'translateY(6px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',   opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%':   { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
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
