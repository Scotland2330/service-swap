import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7f4", 100: "#d6ebe4", 200: "#aed7ca", 300: "#7dbdaa",
          400: "#4e9d87", 500: "#33806c", 600: "#276757", 700: "#215347",
          800: "#1d443b", 900: "#193a32",
        },
      },
    },
  },
  plugins: [],
};
export default config;
