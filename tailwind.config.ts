import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand: Gold primary · light-beige canvas · warm-charcoal text
        pearl: {
          DEFAULT: "#f7f1e5",
          deep: "#efe6d2",
        },
        peach: "#efdcab", // champagne light
        rose: "#d9bd72", // mid gold
        amber: "#e7c970", // gold
        lilac: "#e8ddc4", // soft taupe-cream
        plum: {
          DEFAULT: "#211d16", // warm charcoal (primary text)
          soft: "#5f5746",
          mute: "#9a8f78",
        },
        serum: "#c9a227", // GOLD accent
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        couture: "0.3em",
      },
      boxShadow: {
        dew: "0 30px 70px -30px rgba(201,162,39,0.35), 0 10px 30px -15px rgba(231,201,112,0.4)",
        glass:
          "inset 0 1px 0 0 rgba(255,255,255,0.85), 0 24px 60px -28px rgba(90,75,40,0.32)",
      },
      keyframes: {
        "fade-scale": {
          "0%": { opacity: "0", transform: "translateY(16px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "reveal-blur": {
          "0%": { opacity: "0", filter: "blur(16px)", transform: "scale(1.05)" },
          "100%": { opacity: "1", filter: "blur(0)", transform: "scale(1)" },
        },
        "soft-focus-reveal": {
          "0%": {
            opacity: "0",
            filter: "blur(18px) saturate(0.9)",
            transform: "scale(1.04)",
          },
          "100%": {
            opacity: "1",
            filter: "blur(0) saturate(1.04)",
            transform: "scale(1)",
          },
        },
        "face-scan": {
          "0%": { opacity: "0", transform: "translateY(-100%)" },
          "12%": { opacity: "1" },
          "88%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translateY(200%)" },
        },
        "map-pulse": {
          "0%": { opacity: "0.72", transform: "scale(1)" },
          "70%": { opacity: "0", transform: "scale(3.1)" },
          "100%": { opacity: "0", transform: "scale(3.1)" },
        },
        "trace-draw": {
          "0%": { opacity: "0", strokeDashoffset: "1" },
          "18%": { opacity: "1" },
          "72%": { opacity: "1", strokeDashoffset: "0" },
          "100%": { opacity: "0.55", strokeDashoffset: "0" },
        },
        "mesh-shift": {
          "0%": { transform: "translate3d(0,0,0) rotate(0deg)" },
          "33%": { transform: "translate3d(3%,-4%,0) rotate(4deg)" },
          "66%": { transform: "translate3d(-3%,3%,0) rotate(-3deg)" },
          "100%": { transform: "translate3d(0,0,0) rotate(0deg)" },
        },
        "blob-morph": {
          "0%, 100%": { borderRadius: "62% 38% 54% 46% / 54% 48% 52% 46%" },
          "50%": { borderRadius: "42% 58% 40% 60% / 46% 56% 44% 54%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-22px)" },
        },
        ripple: {
          "0%": { transform: "scale(0.6)", opacity: "0.7" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        sheen: {
          "0%": { transform: "translateX(-130%) skewX(-12deg)" },
          "100%": { transform: "translateX(230%) skewX(-12deg)" },
        },
        "liquid-wipe": {
          "0%": { clipPath: "inset(0 100% 0 0)" },
          "100%": { clipPath: "inset(0 0 0 0)" },
        },
      },
      animation: {
        "fade-scale": "fade-scale 0.8s cubic-bezier(0.16,1,0.3,1) both",
        "reveal-blur": "reveal-blur 1.1s cubic-bezier(0.16,1,0.3,1) both",
        "soft-focus-reveal":
          "soft-focus-reveal 1.2s cubic-bezier(0.16,1,0.3,1) both",
        "face-scan": "face-scan 3.4s cubic-bezier(0.65,0,0.35,1) infinite",
        "map-pulse": "map-pulse 2.4s ease-out infinite",
        "trace-draw": "trace-draw 3.8s cubic-bezier(0.16,1,0.3,1) infinite",
        "mesh-shift": "mesh-shift 24s ease-in-out infinite",
        "mesh-shift-slow": "mesh-shift 34s ease-in-out infinite",
        "blob-morph": "blob-morph 14s ease-in-out infinite",
        float: "float 9s ease-in-out infinite",
        "float-slow": "float 13s ease-in-out infinite",
        ripple: "ripple 2.4s ease-out infinite",
        sheen: "sheen 2.6s ease-in-out infinite",
        "liquid-wipe": "liquid-wipe 1.2s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
