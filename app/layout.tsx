import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ClientSyncProvider from "./ClientSyncProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AFRICAN CUISINE",
  description: "Digital menu and ordering system for AFRICAN CUISINE",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#050505",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3305351377558338"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
        
        {/* Executes background synchronization engine on the client side */}
        <ClientSyncProvider />

        {children}

        {/* FORCE SERVICE WORKER REGISTRATION */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('PWA: ServiceWorker active', reg.scope);
                  }).catch(function(err) {
                    console.log('PWA: ServiceWorker failed', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}