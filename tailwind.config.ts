import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F766E',
          dark: '#0A5C56',
          light: '#5EEAD4',
        },
        secondary: {
          DEFAULT: '#1A3A4A',
          light: '#2B5566',
        },
        accent: {
          DEFAULT: '#C67A3C',
          dark: '#A86230',
          light: '#E8A66A',
        },
        warm: {
          DEFAULT: '#D4956B',
          light: '#F5E6D8',
        },
      },
    },
  },
  plugins: [],
}
export default config
