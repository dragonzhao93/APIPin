import localFont from "next/font/local";
import { ConfigProvider, theme } from 'antd';
import "./globals.css";
import 'antd/dist/reset.css';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "APIPin | 现在音乐",
  description: "一个简单的API学习站",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased pb-14`}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#1677ff',
              colorBgContainer: '#fafafa',
              colorBgElevated: '#ffffff',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            },
          }}
        >
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
