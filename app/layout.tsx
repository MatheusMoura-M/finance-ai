import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Mulish } from "next/font/google";
import { ThemeProvider } from "./_components/theme-provider";
import { Toaster } from "./_components/ui/sonner";
import "./globals.css";

const mulish = Mulish({
  subsets: ["latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: "Home",
    template: "%s | Finance AI",
  },
  icons: [{ url: "/logo-icon.svg" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: o next-themes coloca a classe do tema no <html>
    // antes do React carregar (para não "piscar" o tema errado).
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${mulish.className} antialiased`}>
        <ThemeProvider>
          <ClerkProvider>
            <div className="flex h-full flex-col overflow-hidden">
              {children}
            </div>
          </ClerkProvider>

          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
