/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#161A2E',
          light: '#232849',
          lighter: '#323A5C',
        },
        canvas: '#F4F5F7',
        accent: {
          DEFAULT: '#2A6F97',
          dark: '#1F5875',
          light: '#E8F1F6',
        },
        success: { DEFAULT: '#3A7D5C', light: '#E7F3ED' },
        warning: { DEFAULT: '#B8791A', light: '#FBF0DF' },
        danger:  { DEFAULT: '#B3363B', light: '#FAE9EA' },
        violet:  { DEFAULT: '#6E4FA8', light: '#EFE9F8' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
