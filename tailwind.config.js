/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        hadi: {
          bg: '#0b1220',
          card: '#111827',
          border: '#1e293b',
          accent: '#7c3aed',
          run: '#059669',
        },
      },
    },
  },
  plugins: [],
}
