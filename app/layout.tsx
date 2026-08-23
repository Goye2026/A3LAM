import type { Metadata } from "next";
import "./globals.css";
import { siteUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "أعلام — موسوعة الشخصيات العربية",
    template: "%s | أعلام",
  },
  description:
    "أعلام منصة عربية لاكتشاف الشخصيات المؤثرة وفهم أثرها عبر ملفات منظمة ومصادر واضحة.",
  applicationName: "أعلام",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
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
