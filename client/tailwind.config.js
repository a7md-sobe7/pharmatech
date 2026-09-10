/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#627D98',
          600: '#486581',
          700: '#334E68',
          800: '#102A43',
          900: '#0B2345',
          950: '#06152B',
        },
        medical: {
          50: '#E6F4FF',
          100: '#BAE0FF',
          200: '#91CAFF',
          300: '#69B1FF',
          400: '#4096FF',
          500: '#1677FF',
          600: '#0958D9',
          700: '#003EB3',
          800: '#002C8C',
          900: '#001D66',
        },
        clinical: {
          bg: '#F7F9FC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          muted: '#64748B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
