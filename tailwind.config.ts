import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern sophisticated dark theme
        background: "#1a1b26", // Rich dark slate blue-gray
        surface: "#242530", // Lighter slate for cards
        "surface-hover": "#2a2b38", // Hover state
        primary: "#ff6b9d", // Vibrant coral/salmon accent
        "primary-hover": "#ff4d7a", // Deeper coral on hover
        "primary-light": "#ff8db3", // Lighter coral
        secondary: "#7c3aed", // Vibrant purple secondary
        "secondary-light": "#a78bfa", // Light purple
        text: "#ffffff",
        "text-muted": "#a1a1aa", // Muted gray
        "text-dim": "#71717a", // Dim gray
        success: "#10b981", // Emerald green
        accent: "#ff6b9d", // Matching primary
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
      },
    },
  },
  plugins: [],
};
export default config;

