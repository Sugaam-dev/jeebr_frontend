/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Tailwind v4: theme customization lives in index.css @theme block.
  // This file only handles content paths and plugins.
  theme: {
    extend: {},
  },
  plugins: [],
}
