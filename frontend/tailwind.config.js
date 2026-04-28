/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Orbitron', 'monospace'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        damage: {
          low: '#22c55e',
          medium: '#f97316',
          high: '#ef4444',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(6,182,212,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6,182,212,0.05) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
}
