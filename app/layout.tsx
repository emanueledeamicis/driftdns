import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/ui/sonner";

export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DriftDNS",
  description: "Self-hosted Dynamic DNS Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} flex h-screen overflow-hidden bg-background text-foreground`}>
        <Sidebar />
        <main className="flex-1 overflow-auto bg-muted/20">
          <div className="mx-auto max-w-6xl p-6 lg:p-8">
            {children}
          </div>
        </main>
        <Toaster />
      </body>
    </html>
  );
}
