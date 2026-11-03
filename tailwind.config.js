/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          base: '#111827',
          elevated: '#0f172a',
          card: '#1e293b',
          hover: '#334155',
        },
        accent: {
          blue: '#3b82f6',
          purple: '#8b5cf6',
          pink: '#ec4899',
          amber: '#f59e0b',
          orange: '#f97316',
          teal: '#14b8a6',
          indigo: '#6366f1',
          emerald: '#10b981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
        md: '0 4px 12px rgba(0, 0, 0, 0.4)',
        lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
      },
      spacing: {
        topbar: '56px',
        sidebar: '260px',
        'sidebar-collapsed': '64px',
        properties: '300px',
      },
    },
  },
  plugins: [],
}
