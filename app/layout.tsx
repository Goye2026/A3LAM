import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "أعلام — موسوعة الشخصيات العربية",
    template: "%s | أعلام",
  },
  description:
    "أعلام منصة عربية لاكتشاف الشخصيات المؤثرة وفهم أثرها عبر ملفات منظمة ومصادر واضحة.",
  applicationName: "أعلام",
  keywords: ["أعلام", "الشخصيات العربية", "موسوعة عربية", "اليمن"],
  openGraph: {
    type: "website",
    locale: "ar_AR",
    siteName: "أعلام — موسوعة الشخصيات العربية",
    title: "أعلام — موسوعة الشخصيات العربية",
    description:
      "منصة عربية لاكتشاف الشخصيات المؤثرة وفهم أثرها عبر ملفات منظمة ومصادر واضحة.",
  },
  twitter: {
    card: "summary",
    title: "أعلام — موسوعة الشخصيات العربية",
    description:
      "منصة عربية لاكتشاف الشخصيات المؤثرة وفهم أثرها عبر ملفات منظمة ومصادر واضحة.",
  },
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
