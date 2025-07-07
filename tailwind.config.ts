import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        platense: {
          DEFAULT: "#5A3E1B",
          dark: "#3E2B17",
          light: "#D2B48C",
        },
      },
    },
  },
};

export default config;