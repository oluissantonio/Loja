/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 950: '#050D1F', 900: '#0A1A3A', 800: '#10264F', 700: '#183466' },
        brand: { 50: '#EEF4FF', 100: '#DCE8FF', 200: '#B9D0FF', 400: '#5B8CFF', 500: '#2F6BFF', 600: '#1F55E0', 700: '#1A45B5' },
        ink: { DEFAULT: '#0A1A3A', muted: '#5A6785', faint: '#8B96AD' },
        line: '#E3E8F2',
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(10,26,58,.04), 0 8px 24px -12px rgba(10,26,58,.12)',
        lift: '0 2px 4px rgba(10,26,58,.06), 0 18px 40px -16px rgba(10,26,58,.25)',
      },
      keyframes: {
        'fade-up': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
        'slide-in': { from: { transform: 'translateX(100%)' }, to: { transform: 'none' } },
        'sheet-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'none' } },
      },
      animation: {
        'fade-up': 'fade-up .3s ease-out both',
        'slide-in': 'slide-in .28s cubic-bezier(.2,.8,.2,1) both',
        'sheet-up': 'sheet-up .28s cubic-bezier(.2,.8,.2,1) both',
      },
    },
  },
  plugins: [],
}
