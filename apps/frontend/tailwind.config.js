/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // DreamGirl Brand Palette
        primary: {
          DEFAULT: '#C2185B',
          50:  '#fce4ec',
          100: '#f8bbd0',
          200: '#f48fb1',
          300: '#f06292',
          400: '#ec407a',
          500: '#e91e63',
          600: '#d81b60',
          700: '#c2185b',
          800: '#ad1457',
          900: '#880e4f',
        },
        accent: {
          DEFAULT: '#F48FB1',
          light: '#fce4ec',
        },
        rose: {
          gold: '#C2185B',
          light: '#FFFAFA',
          panel: '#FCE4EC',
        },
        success: '#2E7D32',
        warning: '#F9A825',
        error: '#C62828',
        surface: {
          DEFAULT: '#FFFFFF',
          elevated: '#FFF8F9',
        },
        text: {
          primary: '#1A1A2E',
          secondary: '#6D6D6D',
        },
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '8px',
        button: '24px',
        input: '4px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(194,24,91,0.12)',
        'card-hover': '0 4px 16px rgba(194,24,91,0.2)',
        nav: '0 1px 4px rgba(0,0,0,0.08)',
      },
      backgroundImage: {
        'rose-gradient': 'linear-gradient(135deg, #C2185B 0%, #880E4F 100%)',
        'rose-soft': 'linear-gradient(135deg, #FCE4EC 0%, #FFFAFA 100%)',
        'gold-gradient': 'linear-gradient(135deg, #C2185B 0%, #F48FB1 100%)',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-up': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-rose': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(194,24,91,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(194,24,91,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-up': 'fade-up 0.4s ease-out',
        'pulse-rose': 'pulse-rose 2s infinite',
        shimmer: 'shimmer 1.5s infinite linear',
      },
      maxWidth: {
        content: '1440px',
      },
    },
  },
  plugins: [],
};
