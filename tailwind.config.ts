import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // AiMIGHTY(QA 관제시스템)의 --navy(#002b49) / --blue(#1660a0) 톤과
        // 맞춘 브랜드 스케일. 600을 정확히 그 네이비로 고정.
        brand: {
          50: "#eaf1f6",
          100: "#cfe0ea",
          200: "#a3c3d8",
          300: "#6fa0bf",
          400: "#3d7ba3",
          500: "#1660a0",
          600: "#002b49",
          700: "#001f36",
          800: "#00182a",
          900: "#01121f"
        }
      },
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "Apple SD Gothic Neo",
          "Malgun Gothic",
          "Segoe UI",
          "sans-serif"
        ]
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
