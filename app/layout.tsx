// -------------------------------------------------------
// 目的: アプリ全体のレイアウトとOGP/Frameメタデータを定義するファイルです
// 作成日: 2025/12/19
//
// 更新履歴:
// 2025/12/19 17:25 本番URL解決でlocalhost混入を防止しOGP/Frameの参照先を安定化
// 理由: SNSカード生成は外部クローラが参照するため、localhostは無効になるため
// 2025/12/19 17:40 envがlocalhostでも本番URLへフォールバック
// 理由: NEXT_PUBLIC_BASE_URLの誤設定でlocalhostが混入するケースを防ぐため
// -------------------------------------------------------

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const resolvePublicBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (envUrl) {
    const trimmed = envUrl.replace(/\/+$/, '')
    try {
      const hostname = new URL(trimmed).hostname
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') return trimmed
    } catch {
      if (!trimmed.includes('localhost') && !trimmed.includes('127.0.0.1')) return trimmed
    }
  }

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'https://traebaseecta.vercel.app'
}

const publicBaseUrl = resolvePublicBaseUrl()

export const metadata: Metadata = {
  title: "Base Occupy",
  description: "A strategic territory occupation game on Base. Occupy the throne and earn rewards!",
  metadataBase: new URL(publicBaseUrl),
  openGraph: {
    title: "Base Occupy",
    description: "A strategic territory occupation game on Base. Occupy the throne and earn rewards!",
    images: ["/api/og"],
  },
  other: {
    "base:app_id": "6943f63cd19763ca26ddc403",
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: `${publicBaseUrl}/api/og`,
      button: {
        title: "Play Base Occupy",
        action: {
          type: "launch_frame",
          name: "Base Occupy",
          url: publicBaseUrl,
          splashImageUrl: `${publicBaseUrl}/splash.png`,
          splashBackgroundColor: "#0f172a"
        }
      }
    })
  }
};

import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
