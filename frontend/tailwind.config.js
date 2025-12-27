/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Bahamian color palette
        turquoise: {
          50: '#e0f7f7',
          100: '#b3ebeb',
          200: '#80dede',
          300: '#4dd1d1',
          400: '#26c7c7',
          500: '#00bdbd', // Primary turquoise
          600: '#00a8a8',
          700: '#009393',
          800: '#007e7e',
          900: '#005c5c',
        },
        bahamian: {
          turquoise: '#00bdbd',
          black: '#000000',
          yellow: '#ffd700',
          white: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-satoshi)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Oversized typography for outdoor readability
        'display-2xl': ['72px', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-xl': ['60px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['48px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'display-md': ['36px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '700' }],
        'display-sm': ['32px', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '700' }], // Minimum headline size on mobile
        'headline-lg': ['28px', { lineHeight: '1.4', fontWeight: '600' }],
        'headline-md': ['24px', { lineHeight: '1.5', fontWeight: '600' }],
        'headline-sm': ['20px', { lineHeight: '1.5', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '1.4', fontWeight: '500' }],
      },
      spacing: {
        // Custom spacing scale for bold layouts
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
      },
      borderRadius: {
        // Sign-like buttons, not pills
        'sign': '8px',
        'card': '12px',
      },
      boxShadow: {
        'bold': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'bold-lg': '0 8px 24px rgba(0, 0, 0, 0.2)',
      },
      aspectRatio: {
        'pin': '1 / 1', // Fixed aspect ratio for pins
      },
    },
  },
  plugins: [],
}

