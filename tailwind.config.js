import colors from 'tailwindcss/colors'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: colors.slate[800],
          ...colors.slate
        },
        text: {
          DEFAULT: colors.slate[100],
          ...colors.slate
        },
        primary: {
          DEFAULT: colors.sky[300],
          // DEFAULT: "#8ED1FC"
          ...colors.sky
        },
        secondary: {
          DEFAULT: colors.rose[300],
          // DEFAULT: "#F78DA7"
          ...colors.rose
        }
      }
    },
  },
  plugins: [],
}

