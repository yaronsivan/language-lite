/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        poppy: '#df2935',
        'orange-web': '#ffb238',
        'anti-flash': '#e8e9eb',
        tropical: '#8377d1',
      }
    }
  },
  plugins: [],
}