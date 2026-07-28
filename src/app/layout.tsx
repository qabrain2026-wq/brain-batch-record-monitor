import type { Metadata } from "next";
import Nav from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "BRAiN | 제조기록서 반납 모니터링",
  description: "제조기록서 발행/배포/반납 현황 모니터링 대시보드"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen font-sans antialiased">
        <Nav />
        <main className="w-full px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
