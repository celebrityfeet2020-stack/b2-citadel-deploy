import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // B2 Citadel 主题色 - 深色护眼 + 全息风格
        b2: {
          bg: {
            primary: '#0a0a0f',      // 主背景 - 深邃黑
            secondary: '#12121a',    // 次级背景
            tertiary: '#1a1a24',     // 卡片背景
          },
          accent: {
            cyan: '#00d4ff',         // 主强调色 - 全息青
            purple: '#a855f7',       // 次强调色 - 紫
            pink: '#ec4899',         // 警告色 - 粉
            green: '#10b981',        // 成功色 - 绿
            amber: '#f59e0b',        // 警告色 - 琥珀
          },
          glass: {
            light: 'rgba(255, 255, 255, 0.05)',
            medium: 'rgba(255, 255, 255, 0.1)',
            strong: 'rgba(255, 255, 255, 0.15)',
          },
          text: {
            primary: '#f0f0f5',
            secondary: '#a0a0b0',
            muted: '#606070',
          },
        },
      },
      backgroundImage: {
        // 全息渐变
        'holographic': 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(236, 72, 153, 0.1) 100%)',
        'holographic-border': 'linear-gradient(135deg, #00d4ff 0%, #a855f7 50%, #ec4899 100%)',
        // 玻璃拟态渐变
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-inset': 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
        'glow-cyan': '0 0 20px rgba(0, 212, 255, 0.3)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.3)',
        'glow-pink': '0 0 20px rgba(236, 72, 153, 0.3)',
      },
      backdropBlur: {
        'glass': '16px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
