const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  darkMode: "media",
  theme: {
    extend: {
      display: {
        inherit: "inherit",
      },
      animation: {
        "background-shine": "background-shine 2s linear infinite",
        strobe: "strobe 2s ease-in-out infinite",
      },
      keyframes: {
        "background-shine": {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        strobe: {
          "0%, 100%": { opacity: 0 },
          "50%": { opacity: 1 },
        },
      },
      colors: {
        primary: {
          50: "#ebf8fa",
          100: "#d7f1f4",
          200: "#afe2e9",
          300: "#87d4de",
          400: "#5fc6d3",
          500: "#37b7c8",
          600: "#2c93a0",
          700: "#216e78",
          800: "#164950",
          900: "#0b2528",
          950: "#051214",
        },
        secondary: {
          50: "#ebf7f9",
          100: "#d7f0f4",
          200: "#afe1e9",
          300: "#88d2dd",
          400: "#60c3d2",
          500: "#38b4c7",
          600: "#2d909f",
          700: "#226c77",
          800: "#164850",
          900: "#0b2428",
          950: "#061214",
        },
        accent: {
          50: "#ebf8fa",
          100: "#d7f1f4",
          200: "#afe2e9",
          300: "#87d4de",
          400: "#5fc6d3",
          500: "#37b7c8",
          600: "#2c93a0",
          700: "#216e78",
          800: "#164950",
          900: "#0b2528",
          950: "#051214",
        },
        backgroud: {
          light: colors.white,
          dark: colors.zinc[800],
        },
        border: {
          light: colors.zinc[300],
          dark: colors.zinc[700],
        },
        text: {
          light: colors.black,
          dark: colors.white,
        },
        shadow: {
          light: "#0000000e",
          dark: "#00000031",
        },
      },
    },
  },
  plugins: [],
};
