import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Luminous Glass - Light Mode Only
        luminous: {
          bg: '#F8FAFC',
          text: {
            primary: '#232323',
            secondary: '#6B7280',
            tertiary: '#9CA3AF',
          },
          glass: {
            white: 'rgba(255, 255, 255, 0.65)',
            border: 'rgba(255, 255, 255, 0.8)',
            hover: 'rgba(255, 255, 255, 0.9)',
          },
          accent: {
            cyan: '#56E3FF',
            purple: '#C658FF',
            coral: '#FF5A5F',
            yellow: '#FFC107',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'luminous': '32px',
      },
      boxShadow: {
        'luminous': '0 20px 40px -12px rgba(198, 88, 255, 0.1)',
        'luminous-hover': '0 24px 48px -12px rgba(198, 88, 255, 0.15)',
        'luminous-glow': 'inset 0 0 20px rgba(255, 255, 255, 0.9)',
        'super-glass': '0 30px 60px -15px rgba(198, 88, 255, 0.2)',
      },
      backdropBlur: {
        'luminous': '32px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.3s ease-out forwards',
        'mesh-gradient': 'meshGradient 20s ease infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        meshGradient: {
          '0%, 100%': {
            backgroundPosition: '0% 50%',
            backgroundSize: '200% 200%',
          },
          '50%': {
            backgroundPosition: '100% 50%',
            backgroundSize: '200% 200%',
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
