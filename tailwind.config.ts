import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        discord: {
          sidebar: "#1e1f22",
          channelNav: "#2b2d31",
          main: "#313338",
          dark: "#111214",
          card: "#232428",
          hover: "#35373c",
          active: "#3a3c42",
          blurple: "#5865f2",
          "blurple-hover": "#4752c4",
          green: "#23a55a",
          yellow: "#f0b232",
          red: "#f23f43",
          text: "#dbdee1",
          textLight: "#f2f3f5",
          muted: "#949ba4",
          divider: "#3f4147",
        },
      },
    },
  },
  plugins: [],
};
export default config;
