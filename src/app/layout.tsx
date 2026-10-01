import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ServiceSwap — Trade services with other small businesses",
  description:
    "A marketplace where small businesses swap equivalent-value services instead of paying cash.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
