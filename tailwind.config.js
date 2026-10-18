// TailwindCSS config (ESM)
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#E53935",
          accent: "#FF3B30",
        },
        accent: "#FF3B30",
        offwhite: {
          DEFAULT: "#F9FAFB",
          light: "#FFF9F4",
          2: "#F3F4F6",
        },
        grey: {
          DEFAULT: "#6B7280",
          light: "#F3F4F6",
          medium: "#6B7280",
          dark: "#374151",
        },
        black: "#111827",
      },
      boxShadow: {
        soft: "0 8px 24px rgba(17, 24, 39, 0.08)",
        card: "0 8px 24px rgba(17, 24, 39, 0.08)",
      },
    },
  },
  plugins: [],
};