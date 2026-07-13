import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        cinzel: ['var(--font-cinzel)', 'serif'],
        garamond: ['var(--font-garamond)', 'serif'],
      },
      colors: {
        gold: '#C9A84C',
        'gold-light': '#E8C97A',
        'gold-dim': '#7a6230',
        ink: '#021A38',
        parchment: '#F5EDD8',
      },
    },
  },
  plugins: [],
}

export default config
