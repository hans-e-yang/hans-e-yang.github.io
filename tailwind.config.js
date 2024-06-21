/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#8ED1FC"
        },
        secondary: {
          DEFAULT: "#F78DA7"
        }
      }
    },
  },
  plugins: [],
}

