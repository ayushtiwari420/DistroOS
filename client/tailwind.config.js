/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
      },
      colors: {
        bg: '#F7F8FA',
        'bg-secondary': '#F1F5F9',
        surface: '#FFFFFF',
        'surface-secondary': '#F8FAFC',
        border: '#E5E7EB',
        'border-secondary': '#D1D5DB',
        blue: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#EFF4FF',
          muted: '#BFDBFE',
        },
        primary: {
          DEFAULT: '#111827',
          secondary: '#4B5563',
          muted: '#6B7280',
          faint: '#9CA3AF',
        },
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(0, 0, 0, 0.05)',
        medium: '0 4px 12px rgba(0, 0, 0, 0.08)',
        large: '0 10px 25px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}
