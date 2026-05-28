import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SehatMart - Toko Online Kesehatan & Kebutuhan Sehari-hari",
  description: "Toko online terpercaya untuk kebutuhan kesehatan, personal care, ibu & anak, dan kebutuhan sehari-hari. Belanja mudah, checkout via WhatsApp!",
  keywords: ["toko online", "kesehatan", "personal care", "kebutuhan harian", "belanja online", "WhatsApp order"],
  authors: [{ name: "SehatMart" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "SehatMart - Toko Online",
    description: "Belanja mudah, checkout via WhatsApp!",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SehatMart - Toko Online",
    description: "Belanja mudah, checkout via WhatsApp!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
