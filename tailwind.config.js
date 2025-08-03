/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'cowboy': ['"Cowboy Western"', 'serif'],
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'shake': 'shake 0.5s ease-in-out',
        'screen-shake': 'screen-shake 0.15s ease-in-out',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'shake': {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
        'screen-shake': {
            '10%, 90%': { transform: 'translate3d(-2px, 2px, 0)' },
            '20%, 80%': { transform: 'translate3d(3px, -2px, 0)' },
            '30%, 50%, 70%': { transform: 'translate3d(-3px, 3px, 0)' },
            '40%, 60%': { transform: 'translate3d(3px, -3px, 0)' },
        }
      }
    },
  },
  plugins: [],
}