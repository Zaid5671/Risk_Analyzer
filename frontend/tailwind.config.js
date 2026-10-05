/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        drishti: {
          ivory: '#fbf9f4',
          cream: '#f4efe6',
          sand: '#eae2d3',
          border: '#e6ded1',
          forest: '#0b2e27',
          'forest-deep': '#061c17',
          'forest-light': '#13443a',
          terracotta: '#c25e2e',
          'terracotta-light': '#e47743',
          saffron: '#d97706',
          sage: '#d6ded9',
          'sage-light': '#edf2ef',
          charcoal: '#1c2423',
          muted: '#5c6b68',
        },
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
    }
  },
  plugins: [],
}
