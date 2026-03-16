import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Tourism dynamic gradients (lib/tourism.ts)
    'from-orange-500', 'to-red-500',
    'from-pink-500', 'to-purple-500',
    'from-amber-500', 'to-yellow-500',
    'from-cyan-500', 'to-blue-500',
    'from-emerald-500', 'to-teal-500',
    'from-violet-500', 'to-fuchsia-500',
    'from-teal-600', 'to-emerald-700',
    'from-slate-700', 'to-slate-900',
    'from-blue-600', 'to-indigo-700',
    'from-rose-600', 'to-pink-700',
    'from-purple-600', 'to-violet-700',
    'from-amber-600', 'to-orange-700',
    'from-green-600', 'to-emerald-700',
    'from-yellow-700', 'to-amber-800',
    'from-teal-500', 'to-green-600',
    'from-indigo-600', 'to-blue-700',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D9488',
          dark: '#0F766E',
          light: '#5EEAD4',
        },
        secondary: {
          DEFAULT: '#0F172A',
          light: '#1E293B',
        },
        accent: {
          DEFAULT: '#F59E0B',
          dark: '#D97706',
          light: '#FCD34D',
        },
        warm: {
          DEFAULT: '#C67A3C',
          dark: '#A86230',
          light: '#F5E6D8',
        },
        surface: {
          DEFAULT: '#F8FAFC',
          dark: '#F1F5F9',
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out both',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config
