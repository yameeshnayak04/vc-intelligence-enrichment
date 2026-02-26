import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VC Intelligence Interface",
  description: "Discover, profile, enrich, explain, and save target companies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex h-screen bg-zinc-100 text-zinc-900">
          <div className="w-60 shrink-0 border-r border-zinc-200 bg-white">
            <Sidebar />
          </div>

          <main className="h-screen flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl p-6">
              <Topbar
                title="VC Intelligence"
                subtitle="Discover, profile, enrich, explain, and save target companies."
              />
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
