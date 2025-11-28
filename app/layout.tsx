import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavbarNested } from "./components/NavbarNested";
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { NavbarProvider } from './contexts/NavbarContext';
import { UserProvider } from './contexts/UserContext';
import { NavbarContent } from './components/NavbarContent';


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
          <UserProvider>
            <NavbarProvider>
              <NavbarNested />
              <NavbarContent>{children}</NavbarContent>
            </NavbarProvider>
          </UserProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
