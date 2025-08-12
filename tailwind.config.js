/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        dseg: ['"DSEG7 Classic"', "monospace"],
        sans: ['Ubuntu', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
