import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff1f4",
          100: "#ffe4e9",
          500: "#e11d5e",
          600: "#c81452",
          700: "#a10f42",
          900: "#5c0925",
        },
      },
    },
  },
  plugins: [],
};

export default config;
