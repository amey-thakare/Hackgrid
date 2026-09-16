/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#b7c4ff",
        "neon-electric": "#0066FF",
        "neon-bright": "#0052FF",
        "ice-cyan": "#ADDFFF",
        "ice-glow": "#c4e7ff",
        "background-dark": "#06080d",
        "surface-dark": "#0b0f19",
        "surface-card": "#101626",
        "surface-card-sub": "#141c30",
        "surface-border": "rgba(173, 223, 255, 0.25)",
        "on-surface": "#e2e2ea",
        "on-surface-variant": "#94a3b8",
        "hazard-red": "#ff4d6d",
      },
      fontFamily: {
        sans: ["Geist", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        headline: ["Space Grotesk", "sans-serif"]
      }
    }
  },
  plugins: [],
}
