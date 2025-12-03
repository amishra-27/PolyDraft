import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { DevSettingsProvider } from "@/lib/contexts/DevSettingsContext";
import { DevSidebar } from "@/components/DevSidebar";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "PolyDraft",
  description: "Fantasy Polymarket Mini App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen pb-20 bg-background text-text antialiased selection:bg-accent selection:text-white font-sans">
        <Providers>
          <DevSettingsProvider>
            <main className="max-w-md mx-auto min-h-screen p-4 relative z-10">
              {children}
            </main>
            <Navbar />
            <DevSidebar />
          </DevSettingsProvider>
        </Providers>
      </body>
    </html>
  );
}

