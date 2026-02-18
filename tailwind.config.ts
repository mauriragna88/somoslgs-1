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
          dark: '#0D5E58',
          light: '#99F6E4',
        },
        secondary: {
          DEFAULT: '#1E293B',
        },
        accent: {
          DEFAULT: '#F59E0B',
          dark: '#D97706',
        },
      },
    },
  },
  plugins: [],
}
export default config
