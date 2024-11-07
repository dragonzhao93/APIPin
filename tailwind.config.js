/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        'spin-slow': 'spin 10s linear infinite',
      },
      maxWidth: {
        '7xl': '80rem',
      },
      maxHeight: {
        '70vh': '70vh',
        '60vh': '60vh',
      }
    },
  },
  plugins: [],
};
