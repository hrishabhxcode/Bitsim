/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.25rem",
        lg: "2rem",
        xl: "2rem",
        "2xl": "2.5rem",
      },
    },
    extend: {
      colors: {
        primary: {
          50: "#e6f6ff",
          100: "#cceeff",
          200: "#99ddff",
          300: "#66ccff",
          400: "#33bbff",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.2), 0 4px 10px rgba(0,0,0,0.15)",
      },
    },
  },
  plugins: [],
};
