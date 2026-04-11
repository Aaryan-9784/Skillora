/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Brand
        brand: {
          DEFAULT: "#635BFF",
          50:  "#F0EFFF",
          100: "#E0DEFF",
          200: "#C2BCFF",
          300: "#A39AFF",
          400: "#8579FF",
          500: "#635BFF",
          600: "#4B43E0",
          700: "#362EBF",
          800: "#231C9E",
          900: "#130E7D",
        },
        navy: "#0A2540",
        cyan: "#00D4FF",
        // Surfaces
        surface: {
          DEFAULT: "#FFFFFF",
          secondary: "#F6F9FC",
          border: "#E3E8EF",
          "border-dark": "#1E2535",
        },
        // Dark mode surfaces
        dark: {
          bg:      "#0B0F19",
          surface: "#111827",
          card:    "#161D2E",
          border:  "#1E2A3B",
          muted:   "#1A2236",
        },
        // Text
        ink: {
          DEFAULT: "#1A1F36",
          secondary: "#6B7280",
          muted: "#9CA3AF",
        },
        // Semantic
        success: "#10B981",
        warning: "#F59E0B",
        error:   "#EF4444",
        info:    "#3B82F6",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        "2xs": ["11px", "16px"],
        xs:   ["12px", "18px"],
        sm:   ["14px", "20px"],
        base: ["16px", "24px"],
        lg:   ["18px", "28px"],
        xl:   ["20px", "30px"],
        "2xl":["22px", "32px"],
        "3xl":["28px", "38px"],
        "4xl":["36px", "44px"],
      },
      borderRadius: {
        sm:   "6px",
        DEFAULT: "8px",
        md:   "10px",
        lg:   "12px",
        xl:   "16px",
        "2xl":"20px",
        "3xl":"24px",
      },
      boxShadow: {
        xs:    "0 1px 2px 0 rgba(0,0,0,0.05)",
        sm:    "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)",
        md:    "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
        lg:    "0 10px 15px -3px rgba(0,0,0,0.07), 0 4px 6px -4px rgba(0,0,0,0.05)",
        xl:    "0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)",
        card:  "0 0 0 1px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)",
        glow:  "0 0 20px rgba(99,91,255,0.35)",
        "glow-cyan": "0 0 20px rgba(0,212,255,0.3)",
        "inner-sm": "inset 0 1px 2px rgba(0,0,0,0.06)",
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #635BFF 0%, #8579FF 100%)",
        "gradient-brand-dark": "linear-gradient(135deg, #4B43E0 0%, #635BFF 100%)",
        "gradient-cyan": "linear-gradient(135deg, #00D4FF 0%, #635BFF 100%)",
        "gradient-surface": "linear-gradient(180deg, #FFFFFF 0%, #F6F9FC 100%)",
        "gradient-dark": "linear-gradient(180deg, #111827 0%, #0B0F19 100%)",
        "mesh-light": "radial-gradient(at 40% 20%, hsla(240,100%,74%,0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.06) 0px, transparent 50%)",
        "mesh-dark":  "radial-gradient(at 40% 20%, hsla(240,100%,74%,0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.08) 0px, transparent 50%)",
      },
      animation: {
        "fade-in":    "fadeIn 0.2s ease-out",
        "slide-up":   "slideUp 0.3s cubic-bezier(0.16,1,0.3,1)",
        "slide-down": "slideDown 0.3s cubic-bezier(0.16,1,0.3,1)",
        "scale-in":   "scaleIn 0.2s cubic-bezier(0.16,1,0.3,1)",
        shimmer:      "shimmer 1.8s infinite linear",
        pulse:        "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: "translateY(8px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        slideDown: { from: { opacity: 0, transform: "translateY(-8px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        scaleIn:   { from: { opacity: 0, transform: "scale(0.96)" }, to: { opacity: 1, transform: "scale(1)" } },
        shimmer:   { from: { backgroundPosition: "-200% 0" }, to: { backgroundPosition: "200% 0" } },
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
