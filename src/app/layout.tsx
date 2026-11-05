import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LeadsProvider } from "@/components/providers/LeadsProvider";
import { BrandingProvider } from "@/components/providers/BrandingProvider";
import { UsageProvider } from "@/components/providers/UsageProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jacsper",
  description: "The AI-First Agency Operating System",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full">
        <ThemeProvider>
          <BrandingProvider>
            <LeadsProvider>
              <UsageProvider>{children}</UsageProvider>
            </LeadsProvider>
          </BrandingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
