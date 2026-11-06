/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bharat: {
          saffron: "#FF9933",
          white: "#FFFFFF",
          green: "#138808",
          blue: "#000080"
        }
      }
    },
  },
  plugins: [],
};
