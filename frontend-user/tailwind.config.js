/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",       
    "./pages/**/*.{js,ts,jsx,tsx}",     
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
        lora: ['Lora', 'serif'],              
        roboto: ['"Roboto Serif"', 'serif'],  
      },
    },
  },
  plugins: [],
};
