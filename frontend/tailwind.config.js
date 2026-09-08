/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Direct named palette colors from the palette specification
        white: "#FFFFFF",
        lavender: "#C8B6E2",
        "deep-purple": "#5851A4",
        periwinkle: "#4B63D2",
        navy: "#1E2746",
        "navy-dark": "#141A32",
        "navy-light": "#2C3866",
        "pastel-lavender": "#B9B1D9",
        "bright-yellow": "#FFD21A",

        // Palette object alias
        palette: {
          white: "#FFFFFF",
          lavender: "#C8B6E2",
          deepPurple: "#5851A4",
          periwinkle: "#4B63D2",
          navy: "#1E2746",
          navyDark: "#141A32",
          navyLight: "#2C3866",
          pastelLavender: "#B9B1D9",
          yellow: "#FFD21A",
        },

        // Refined human-friendly light-and-white theme scale
        slate: {
          50: "#F8F6FD",   // Soft light canvas background
          100: "#1E2746",  // Primary dark Navy text
          200: "#1E2746",  // Heading Navy text
          300: "#362F62",  // High-contrast text
          400: "#5851A4",  // Deep Purple / muted text
          500: "#6D659E",  // Secondary labels & descriptions
          600: "#9188BE",  // Placeholders & subtle text
          700: "#D5CBEE",  // Border & dividers
          800: "#EAE4F7",  // Card borders & inner panel lines
          900: "#FFFFFF",  // Clean White card & container surfaces
          950: "#FFFFFF",  // Clean White card backgrounds
        },

        // Indigo brand scale mapped to Periwinkle Blue & Deep Purple
        indigo: {
          50: "#F4F6FD",
          100: "#E6EAFB",
          200: "#C8D3F7",
          300: "#B9B1D9", // Pastel Lavender
          400: "#C8B6E2", // Lavender
          500: "#5D75E8",
          600: "#4B63D2", // Periwinkle Blue primary CTA
          700: "#3E53BE",
          800: "#5851A4", // Deep Purple
          900: "#36306D",
          950: "#1E2746", // Navy Blue
        },

        // Purple scale mapped to Deep Purple & Lavender
        purple: {
          50: "#FAF8FC",
          100: "#F2EEFA",
          200: "#E1D7F4",
          300: "#C8B6E2", // Lavender
          400: "#B9B1D9", // Pastel Lavender
          500: "#7068C6",
          600: "#5851A4", // Deep Purple
          700: "#463F8B",
          800: "#36306D",
          900: "#262152",
          950: "#171436",
        },

        // Blue scale mapped to Periwinkle & Navy
        blue: {
          50: "#F4F6FD",
          100: "#E6EAFB",
          200: "#C8D3F7",
          300: "#8EA3F3",
          400: "#6981EB",
          500: "#4B63D2", // Periwinkle Blue
          600: "#3C51BE",
          700: "#3041A1",
          800: "#253382",
          900: "#1E2746", // Navy Blue
          950: "#FFFFFF",
        },

        // Yellow and Amber mapped to Bright Yellow
        yellow: {
          50: "#FFFEE8",
          100: "#FFFCC4",
          200: "#FFF88A",
          300: "#FFEE4A",
          400: "#FFD21A", // Bright Yellow
          500: "#FFD21A", // Bright Yellow
          600: "#E5BC0F",
          700: "#B89407",
          800: "#8E7103",
          900: "#634E00",
        },
        amber: {
          50: "#FFFEE8",
          100: "#FFFCC4",
          200: "#FFF88A",
          300: "#FFEE4A",
          400: "#FFD21A", // Bright Yellow
          500: "#FFD21A", // Bright Yellow
          600: "#E5BC0F",
          700: "#B89407",
          800: "#8E7103",
          900: "#634E00",
        },

        // Functional tokens
        border: "#EAE4F7",
        input: "#FFFFFF",
        ring: "#4B63D2",
        background: "#F8F6FD",
        foreground: "#1E2746",
        primary: {
          DEFAULT: "#4B63D2",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#5851A4",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F0EDF9",
          foreground: "#5851A4",
        },
        accent: {
          DEFAULT: "#FFD21A",
          foreground: "#1E2746",
        },
      },
    },
  },
  plugins: [],
}
