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
        teal: {
          50: "#f0f9fb",
          100: "#d9f0f5",
          500: "#0E8FA3",
          600: "#0B7285",
          700: "#085D6E",
          800: "#064d5c",
        },
        gold: {
          400: "#D4B96A",
          500: "#C9A84C",
          600: "#A8892E",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
