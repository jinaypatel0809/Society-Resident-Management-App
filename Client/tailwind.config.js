/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        admin: {
          dark:    "#0f2540",
          DEFAULT: "#1e3a5f",
          light:   "#2d5282",
          gold:    "#d4af37",
          "gold-light": "#f0d060",
        },
        resident: {
          dark:    "#073d2e",
          DEFAULT: "#0a6d56",
          light:   "#1d9e75",
          accent:  "#9fe1cb",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" },                       "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
