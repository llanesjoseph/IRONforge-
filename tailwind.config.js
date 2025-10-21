/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        field: {
          dark: '#0a4d2e',
          light: '#0f6d3e',
          bright: '#14a054',
        },
        iron: {
          50: '#f5f7fa',
          100: '#eaeef4',
          200: '#d0dae6',
          300: '#a7bbce',
          400: '#7896b1',
          500: '#567997',
          600: '#43607d',
          700: '#374e66',
          800: '#304356',
          900: '#2c3a49',
          950: '#1d2630',
        },
        stadium: {
          red: '#dc2626',
          blue: '#2563eb',
          gold: '#f59e0b',
          orange: '#ea580c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Rajdhani', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
        'field': '0 10px 40px rgba(0, 0, 0, 0.3)',
        'token': '0 4px 12px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}