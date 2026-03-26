/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
        inter:   ['Inter', 'sans-serif'],
      },
      colors: {
        bg:      '#F5F6FA',
        surface: '#FFFFFF',
        blue:    '#2563EB',
        'blue-light': '#EFF4FF',
      },
    },
  },
  plugins: [],
}
