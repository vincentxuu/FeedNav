import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ClientWrapper } from "./client-wrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "餵你導航 - 台北美食指南",
  description: "發現台北最好的餐廳，探索美食，建立你的個人美食地圖",
  keywords: "台北美食,餐廳推薦,美食導航,餐廳搜尋",
  openGraph: {
    title: "餵你導航 - 台北美食指南",
    description: "發現台北最好的餐廳，探索美食，建立你的個人美食地圖",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientWrapper>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              {children}
            </TooltipProvider>
          </ThemeProvider>
        </ClientWrapper>
      </body>
    </html>
  );
}