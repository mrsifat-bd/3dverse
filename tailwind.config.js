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
        // CSS-variable palette so light/dark mode flips automatically.
        cream: 'rgb(var(--cream) / <alpha-value>)',
        paper: 'rgb(var(--paper) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        clay: {
          DEFAULT: 'rgb(var(--clay) / <alpha-value>)',
          dark: 'rgb(var(--clay-dark) / <alpha-value>)',
        },
        stone: 'rgb(var(--stone) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        // shadcn/ui semantic aliases
        border: 'rgb(var(--line) / <alpha-value>)',
        input: 'rgb(var(--line) / <alpha-value>)',
        ring: 'rgb(var(--clay) / <alpha-value>)',
        background: 'rgb(var(--cream) / <alpha-value>)',
        foreground: 'rgb(var(--ink) / <alpha-value>)',
        primary: { DEFAULT: 'rgb(var(--clay) / <alpha-value>)', foreground: 'rgb(var(--paper) / <alpha-value>)' },
        secondary: { DEFAULT: 'rgb(var(--cream) / <alpha-value>)', foreground: 'rgb(var(--ink) / <alpha-value>)' },
        muted: { DEFAULT: 'rgb(var(--cream) / <alpha-value>)', foreground: 'rgb(var(--stone) / <alpha-value>)' },
        accent: { DEFAULT: 'rgb(var(--cream) / <alpha-value>)', foreground: 'rgb(var(--ink) / <alpha-value>)' },
        destructive: { DEFAULT: 'rgb(var(--destructive) / <alpha-value>)', foreground: 'rgb(var(--paper) / <alpha-value>)' },
        card: { DEFAULT: 'rgb(var(--paper) / <alpha-value>)', foreground: 'rgb(var(--ink) / <alpha-value>)' },
        popover: { DEFAULT: 'rgb(var(--paper) / <alpha-value>)', foreground: 'rgb(var(--ink) / <alpha-value>)' },
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      fontFamily: {
        sans: ['Inter', 'Hind Siliguri', 'system-ui', 'sans-serif'],
        display: ['Comfortaa', 'Inter', 'system-ui', 'sans-serif'],
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
