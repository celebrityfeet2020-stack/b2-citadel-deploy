import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'B2 Citadel - AI Development Platform',
  description: 'B2战术开发平台 - 让AI在规则的盔甲内工作',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="bg-b2-bg-primary text-b2-text-primary min-h-screen">
        {/* 背景装饰 */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {/* 全息光晕效果 */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-b2-accent-cyan/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-b2-accent-purple/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-b2-accent-pink/5 rounded-full blur-3xl" />
          
          {/* 网格背景 */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
        </div>
        
        {/* 主内容 */}
        <div className="relative z-10">
          {children}
        </div>
        
        {/* Toast通知 */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a24',
              color: '#f0f0f5',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#1a1a24',
              },
            },
            error: {
              iconTheme: {
                primary: '#ec4899',
                secondary: '#1a1a24',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
