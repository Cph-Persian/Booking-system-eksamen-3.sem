import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavbarNested } from "./components/NavbarNested";
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';


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
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MantineProvider>
          <NavbarNested />
          <div style={{ marginLeft: '300px' }}>
            {children}
          </div>
        </MantineProvider>
      </body>
    </html>
  );
}
