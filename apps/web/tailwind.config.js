/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6D28D9",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#8B5CF6",
          foreground: "#ffffff",
        },
        background: "#F5F3FF",
        foreground: "#2E1065",
        muted: "#E4E4E7",
        accent: "#F43F5E",
      },
      keyframes: {
        "slide-in": {
          "0%": { transform: "translateY(10px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },
      animation: {
        "slide-in": "slide-in 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}