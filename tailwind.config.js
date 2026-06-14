export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'void-bg': '#080808',
        'void-grid': '#161616',
        'void-surface': '#111111',
        'void-border': '#222222',
        'void-primary': '#F5F5F5',
        'void-secondary': '#6B7280',
        'void-confirmed': '#00FFB2',
        'void-overdue': '#FF4D4D',
        'void-warning': '#FBBF24',
        // Keep legacy surface/brand/success/warning/danger tokens so existing pages don't break
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        brand: {
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
        },
        success: { 400: '#00FFB2', 500: '#00FFB2', 600: '#00cc8e' },
        warning: { 400: '#FBBF24', 500: '#FBBF24' },
        danger: { 400: '#FF4D4D', 500: '#FF4D4D', 600: '#cc3d3d' },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'void-grid': `
          linear-gradient(#161616 1px, transparent 1px),
          linear-gradient(90deg, #161616 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'void-grid': '24px 24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
