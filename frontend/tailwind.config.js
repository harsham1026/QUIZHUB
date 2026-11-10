/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080B14",
        surface: "#0F1626",
        surfaceLight: "#162035",
        cardGlass: "rgba(15, 22, 38, 0.75)",
        neon: {
          blue: "#00D2FF",
          cyan: "#00F5D4",
          purple: "#9D4EDD",
          pink: "#FF007A",
          amber: "#FFB800",
          emerald: "#10B981",
        }
      },
      boxShadow: {
        'glow-blue': '0 0 25px -5px rgba(0, 210, 255, 0.5)',
        'glow-purple': '0 0 25px -5px rgba(157, 78, 221, 0.5)',
        'glow-pink': '0 0 25px -5px rgba(255, 0, 122, 0.5)',
        'glow-cyan': '0 0 25px -5px rgba(0, 245, 212, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'esports-gradient': 'linear-gradient(135deg, #0B0E1B 0%, #15102A 50%, #0A192F 100%)',
        'accent-gradient': 'linear-gradient(135deg, #00D2FF 0%, #9D4EDD 100%)',
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}

