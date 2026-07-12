/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1200px' },
    },
    extend: {
      colors: {
        cream: '#F4F1EA',
        paper: '#FBFAF7',
        ink: '#2C2A26',
        clay: { DEFAULT: '#C0603A', dark: '#A44E2D' },
        stone: '#8A8577',
        line: '#E7E2D6',
        // shadcn/ui semantic aliases mapped to the Studio Minimal palette
        border: '#E7E2D6',
        input: '#E7E2D6',
        ring: '#C0603A',
        background: '#F4F1EA',
        foreground: '#2C2A26',
        primary: { DEFAULT: '#C0603A', foreground: '#FBFAF7' },
        secondary: { DEFAULT: '#F4F1EA', foreground: '#2C2A26' },
        muted: { DEFAULT: '#F4F1EA', foreground: '#8A8577' },
        accent: { DEFAULT: '#F4F1EA', foreground: '#2C2A26' },
        destructive: { DEFAULT: '#B4361F', foreground: '#FBFAF7' },
        card: { DEFAULT: '#FBFAF7', foreground: '#2C2A26' },
        popover: { DEFAULT: '#FBFAF7', foreground: '#2C2A26' },
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      fontFamily: {
        sans: ['Inter', 'Hind Siliguri', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        bangla: ['"Hind Siliguri"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
