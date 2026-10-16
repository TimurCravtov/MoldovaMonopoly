/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        moldova: {
          blue: '#0046AE',
          yellow: '#FFD200',
          red: '#CC092F',
          wine: '#58111A',
          cream: '#F7F3E8',
          board: '#DCE8D6'
        }
      }
    },
  },
  plugins: [],
}
