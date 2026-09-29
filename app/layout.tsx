import type { Metadata } from "next";
import { Noto_Sans_JP, Shippori_Mincho } from "next/font/google";
import "./globals.css";
import Providers from "./Providers.tsx";
import Header from "./components/Header.tsx";
import Link from "next/link";

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

// 見出し用の明朝体
const shipporiMincho = Shippori_Mincho({
  variable: "--font-shippori-mincho",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "飲食店予約",
  description: "お店の空き状況を見て、その場で予約できる飲食店予約システムのデモです",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${notoSansJp.variable} ${shipporiMincho.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          <Header />
          <div className="flex-1">{children}</div>
          <footer className="space-y-2 border-t border-line bg-surface px-4 py-6 text-center text-xs text-muted">
            <nav aria-label="サイトについて" className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
              <Link href="/terms" className="hover:text-ink hover:underline">利用規約</Link>
              <Link href="/privacy" className="hover:text-ink hover:underline">プライバシーポリシー</Link>
              <Link href="/about" className="hover:text-ink hover:underline">運営者情報</Link>
            </nav>
            <p>このサイトは制作サンプルです。掲載している店舗・予約・口コミはすべて架空です。</p>
            <p>
              位置情報:©{" "}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">
                OpenStreetMap contributors
              </a>
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
