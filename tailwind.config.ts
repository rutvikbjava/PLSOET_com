import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Official Education Color Palette
        primary: {
          50: '#e8eaf1',
          100: '#c5cade',
          200: '#9ea7c8',
          300: '#7784b2',
          400: '#5a69a2',
          500: '#3d4f92',
          600: '#37488a',
          700: '#2f3f7f',
          800: '#273675',
          900: '#0d173b', // Main Navy Blue
        },
        secondary: {
          50: '#eef0f4',
          100: '#d4dae4',
          200: '#b8c2d2',
          300: '#9ba9c0',
          400: '#8596b3',
          500: '#7084a5',
          600: '#687c9d',
          700: '#5d7193',
          800: '#53678a',
          900: '#4a5b7d', // Slate Blue
        },
        accent: {
          50: '#fdf8e8',
          100: '#faedc5',
          200: '#f7e29f',
          300: '#f4d679',
          400: '#f1cd5c',
          500: '#efc43f',
          600: '#edbe39',
          700: '#eab631',
          800: '#e8af29',
          900: '#d4af37', // Warm Gold
        },
        neutral: {
          50: '#f8f9fb',
          100: '#f1f3f6',
          200: '#e5e8ed',
          300: '#d1d6df',
          400: '#b0b7c5',
          500: '#8f98ab',
          600: '#6e7a91',
          700: '#555e73',
          800: '#3d4455',
          900: '#1f2937',
        },
        background: '#f8f9fb',
        foreground: '#1f2937',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'edu': '0 2px 8px rgba(13, 23, 59, 0.08)',
        'edu-lg': '0 4px 16px rgba(13, 23, 59, 0.12)',
        'edu-xl': '0 8px 24px rgba(13, 23, 59, 0.16)',
      },
      borderRadius: {
        'edu': '0.5rem',
      },
    },
  },
  plugins: [],
}
export default config
