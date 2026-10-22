import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      keyframes: {
        "gk-fade-in": { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "none" } },
        "gk-highlight": { "0%": { backgroundColor: "rgb(254 243 199)" }, "100%": { backgroundColor: "transparent" } },
      },
      animation: {
        "gk-fade-in": "gk-fade-in 200ms ease-out both",
        "gk-highlight": "gk-highlight 2.5s ease-out both",
      },
    },
  },
  plugins: [],
} satisfies Config;
