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
        // Simple Black and White Design
        background: "#ffffff", // White background
        surface: "#f8f9fa", // Light gray surface
        "surface-hover": "#e9ecef", // Lighter gray on hover
        primary: "#000000", // Black primary
        "primary-hover": "#333333", // Dark gray on hover
        "primary-light": "#666666", // Medium gray
        secondary: "#6c757d", // Gray secondary
        "secondary-hover": "#5a6268", // Darker gray
        accent: "#000000", // Black accent
        success: "#28a745", // Green for success
        warning: "#ffc107", // Yellow for warning
        error: "#dc3545", // Red for errors
        text: "#000000", // Black text
        "text-muted": "#6c757d", // Muted gray text
        "text-dim": "#adb5bd", // Dim gray text
      },
      fontFamily: {
        sans: ['TikTok Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;

