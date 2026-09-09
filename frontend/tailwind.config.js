/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#0b192c',
          deep: '#0c1b2e',
          slate: '#0f172a',
          blue: '#1e3a8a',
          interactive: '#1d4ed8',
          surface: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
          subtle: '#f1f5f9',
        },
        saffron: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        }
      }
    },
  },
  plugins: [],
}
