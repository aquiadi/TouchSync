/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F0F13',
        surface: '#1C1C21',
        primary: '#FF3B30',
        'primary-glow': 'rgba(255, 59, 48, 0.15)',
        'glass-stroke': 'rgba(255, 255, 255, 0.08)',
        'text-primary': '#FFFFFF',
        'text-secondary': '#8E8E93',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'heartbeat': 'heartbeat 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.8' },
        }
      }
    },
  },
  plugins: [],
}
