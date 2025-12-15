import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { UserProvider } from './contexts/UserContext';
import { ProtectedLayout } from './components/ProtectedLayout';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EK-Booking",
  description: "EK Lokaler booking system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ========================================
  // ROOT LAYOUT - Wrapper for hele applikationen
  // ========================================
  // Struktur:
  // 1. MantineProvider - Giver Mantine UI komponenter til hele appen
  // 2. UserProvider - Giver brugercontext til hele appen
  // 3. ProtectedLayout - Beskytter routes og viser navbar
  return (
    <html lang="da">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MantineProvider>
          <UserProvider>
            <ProtectedLayout>{children}</ProtectedLayout>
          </UserProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
