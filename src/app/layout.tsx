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

import { getConfig } from "@/lib/config";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfig();
  const favicon = config.favicon || "/favicon.ico";
  
  // 简单的文件扩展名检查
  const isPng = favicon.toLowerCase().endsWith('.png');
  const isSvg = favicon.toLowerCase().endsWith('.svg');
  
  return {
    title: config.title || "企业导航",
    description: config.description || "企业与个人导航",
    icons: {
      icon: [
        {
          url: favicon,
          type: isPng ? "image/png" : isSvg ? "image/svg+xml" : "image/x-icon"
        }
      ],
    },
  };
}

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
