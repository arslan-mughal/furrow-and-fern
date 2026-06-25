import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette — see README for the rationale behind each tone.
        canopy: "#1F3A2E", // deep forest green — primary surface / text
        loam: "#3B2A1F", // rich soil brown — body text on light surfaces
        parchment: "#F2EDE1", // paper neutral — light surfaces
        marigold: "#E0A030", // warm gold — primary CTA accent
        clay: "#B5573A", // muted rust — secondary accent / sale tags
        sage: "#D8E2D3", // soft green — card surfaces, dividers
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "ui-sans-serif", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "0.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
