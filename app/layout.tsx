import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

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
    <html lang="en" style={{ backgroundColor: '#1a1b26' }}>
      <body className="min-h-screen pb-20 bg-background text-text antialiased selection:bg-primary selection:text-white" style={{ backgroundColor: '#1a1b26' }}>
        <main className="max-w-md mx-auto min-h-screen p-4">
          {children}
        </main>
        <Navbar />
      </body>
    </html>
  );
}

