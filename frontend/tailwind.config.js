/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          900: '#0D1A63',
          700: '#1A2CA3',
          500: '#2845D6',
        },
        accent: {
          500: '#F68048',
          600: '#e06030',
        }
      }
    }
  },
  plugins: []
}
