/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ubytes: {
          maroon: {
            950: '#3c070c',
            900: '#550a12',
            800: '#75121e',
            700: '#941c2b',
            50: '#fdf2f3',
          },
          amber: {
            600: '#d97706',
            500: '#f59e0b',
            400: '#fbbf24',
            300: '#fcd34d',
            100: '#fef3c7',
            50: '#fffbeb',
          },
          gold: '#e89528',
          dark: '#1e293b'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Bebas Neue"', 'sans-serif'],
        condensed: ['"Oswald"', 'sans-serif'],
        banner: ['"Bebas Neue"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
