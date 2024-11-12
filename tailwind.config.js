/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        morph: 'morph 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};