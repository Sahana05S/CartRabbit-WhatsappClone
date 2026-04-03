/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00A884',
          dark: '#008F72',
          light: '#00C298',
        },
        accent: {
          DEFAULT: '#53bdeb',
          glow: 'rgba(83, 189, 235, 0.5)',
        },
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.05)',
          heavy: 'rgba(255, 255, 255, 0.1)',
          border: 'rgba(255, 255, 255, 0.1)',
        },
        dark: {
          bg: '#0b141a',
          sidebar: '#111b21',
          chat: '#0b141a',
          bubble: {
            me: '#005c4b',
            them: '#202c33',
          },
          panel: '#222e35',
        }
      },
      backgroundImage: {
        'chat-pattern': "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
        'ambient-gradient': 'radial-gradient(circle at top right, rgba(0, 168, 132, 0.15), transparent), radial-gradient(circle at bottom left, rgba(83, 189, 235, 0.15), transparent)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        }
      }
    },
  },
  plugins: [],
}
