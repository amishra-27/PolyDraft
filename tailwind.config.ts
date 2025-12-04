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
        // Light theme design
        background: "#ffffff", // White background
        surface: "#f8f9fa", // Light gray surface
        "surface-hover": "#e9ecef", // Lighter gray on hover
        primary: "#0066cc", // Blue primary
        "primary-hover": "#0052a3", // Darker blue on hover
        "primary-light": "#4d94ff", // Lighter blue
        secondary: "#6c757d", // Gray secondary
        "secondary-hover": "#5a6268", // Darker gray
        accent: "#0066cc", // Blue accent
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

