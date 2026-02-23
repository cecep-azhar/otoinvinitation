import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        cinzel: ["Cinzel", "serif"],
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        gold: {
          light: "#FCF6BA",
          DEFAULT: "#B38728",
          dark: "#BF953F",
          accent: "#AA771C",
        },
      },
      animation: {
        shimmer: "shimmer 2.5s ease-in-out infinite",
        "scan-line": "scanLine 1.8s ease-in-out infinite",
        "scan-pulse": "scanPulse 1.5s ease-in-out infinite",
        "fade-in": "fadeIn 0.6s ease both",
      },
      keyframes: {
        shimmer: {
          "0%, 100%": { boxShadow: "0 0 15px rgba(191,149,63,0.2)" },
          "50%": { boxShadow: "0 0 35px rgba(191,149,63,0.5)" },
        },
        scanLine: {
          "0%": { top: "20%" },
          "50%": { top: "75%" },
          "100%": { top: "20%" },
        },
        scanPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
