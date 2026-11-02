/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        datapage: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36a8f6',
          500: '#0c8be7',
          600: '#016fc4',
          700: '#02589f',
          800: '#064b82',
          900: '#0a3f6c',
          950: '#072847',
        },
        navy: {
          800: '#0f172a',
          900: '#0a0f1d',
          950: '#060a14',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
