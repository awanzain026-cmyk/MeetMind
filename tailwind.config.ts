import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#08090f",
        surface: "#0f1117",
        surface2: "#161822",
        border: "rgba(255,255,255,0.08)",
        primary: "#6366f1",
        "primary-dark": "#4f46e5",
        secondary: "#8b5cf6",
        accent: "#06b6d4",
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        "text-primary": "#f1f5f9",
        "text-muted": "#64748b",
        "text-dim": "#334155",
      },
    },
  },
  plugins: [typography],
};

export default config;
