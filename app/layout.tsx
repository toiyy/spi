import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPI熟語暗記",
  description: "SPIの語句の意味を暗記するための個人用アプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
