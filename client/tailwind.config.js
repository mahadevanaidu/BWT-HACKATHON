/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Verity design system
        bg: {
          DEFAULT: '#080A09',
          surface: '#111512',
          elevated: '#161C18',
        },
        emerald: {
          DEFAULT: '#35D07F',
          dim: '#1A6B40',
          glow: '#35D07F33',
          subtle: '#35D07F14',
        },
        warm: {
          white: '#F5F4EE',
          muted: '#929A94',
          faint: '#4A5248',
        },
        border: {
          DEFAULT: '#272E29',
          subtle: '#1C2320',
          highlight: '#3A4A3D',
        },
        status: {
          valid: '#35D07F',
          revoked: '#E85D5D',
          expired: '#D4A435',
          suspended: '#7B8FE8',
          invalid: '#666F69',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        display: ['"Cal Sans"', '"Inter"', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'emerald-sm': '0 0 8px rgba(53, 208, 127, 0.15)',
        'emerald-md': '0 0 20px rgba(53, 208, 127, 0.2)',
        'emerald-lg': '0 0 40px rgba(53, 208, 127, 0.25)',
        'inner-dark': 'inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      animation: {
        'pulse-emerald': 'pulseEmerald 2s ease-in-out infinite',
        'scan-line': 'scanLine 2s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        pulseEmerald: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(200%)', opacity: '0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
