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
        // Red-themed Dark Design
        background: "#0f0a0a", // Deep dark red-black
        surface: "#1a0f0f", // Dark red surface
        "surface-hover": "#2a1515", // Lighter red surface on hover
        primary: "#ef4444", // Vibrant red (primary CTA)
        "primary-hover": "#dc2626", // Deeper red on hover
        "primary-light": "#f87171", // Lighter red for accents
        secondary: "#ff6b6b", // Coral red (secondary actions)
        "secondary-hover": "#ff5252", // Deeper coral
        accent: "#ff4444", // Bright red accent
        success: "#10b981", // Keep green for success
        warning: "#f59e0b", // Keep amber for warning
        error: "#b91c1c", // Deep red for errors
        text: "#ffffff", // Pure white text
        "text-muted": "#d1a3a3", // Muted red-tinted gray
        "text-dim": "#9a7a7a", // Dimmer red-tinted gray
      },
      fontFamily: {
        sans: ['TikTok Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;

