import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "A3LAM Foundation",
  description: "Foundation and design system workspace for A3LAM.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
