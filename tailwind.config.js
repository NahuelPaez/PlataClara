/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0fafa',
          100: '#ccf0f0',
          200: '#99e0e2',
          300: '#5fc7ca',
          400: '#2aadb1',
          500: '#0d7377',
          600: '#0a5c60',
          700: '#084549',
          800: '#063032',
          900: '#031e20',
        },
        accent:       '#f59e0b',
        'accent-dark':'#d97706',
        'accent-light':'#fbbf24',
        success:      '#10b981',
        'success-dark':'#059669',
        warm:         '#fafaf9',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
