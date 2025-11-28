import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { StealthInitializer } from "@/components/stealth-initializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ENDCODE Vault - Secure File Encoder/Decoder",
  description: "Professional penetration testing tool for secure file encoding/decoding with base64 format. Matrix-themed interface for ethical hacking operations.",
  keywords: ["encoder", "decoder", "base64", "file", "security", "penetration testing", "ENDCODE"],
  authors: [{ name: "ENDCODE Vault Team" }],
  creator: "ENDCODE Security Tools",
  publisher: "ENDCODE Vault",
  robots: "index, follow",

  openGraph: {
    type: "website",
    title: "ENDCODE Vault - Secure File Encoder/Decoder",
    description: "Professional penetration testing tool for secure file operations",
    siteName: "ENDCODE Vault",
  },
  twitter: {
    card: "summary_large_image",
    title: "ENDCODE Vault",
    description: "Secure file encoding/decoding for penetration testing",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#00ff00",
  colorScheme: "dark" as const,
};

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
        <StealthInitializer />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
