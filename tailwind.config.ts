import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        honey: { 50: '#fff8e6', 100: '#fdebb8', 200: '#f9d77a', 300: '#f2bd45', 400: '#e5a12a', 500: '#c9821a', 600: '#a26312', 700: '#7a480f' },
        ink: { 950: '#07070a', 900: '#0d0d11', 850: '#121217', 800: '#18181f', 700: '#24242d', 600: '#34343f' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      boxShadow: { glass: '0 10px 40px -10px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.06)' },
    },
  },
  plugins: [],
} satisfies Config;
