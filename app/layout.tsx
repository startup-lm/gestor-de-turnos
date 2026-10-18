"use client";

import '@/styles/globals.css';
import Navbar from "@/components/navbar/Navbar";
import WhatsappIcon from "@/components/buttons/WhatsappIcon";
import Footer from "@/components/ui/Footer";
import { AuthProvider } from '@/lib/auth/AuthContext';
import AutoLogoutManager from '@/lib/auth/AutoLogoutManager';
import { BusinessProvider } from '@/lib/context/BusinessContext';

import ToastContainer from "@/components/ui/ToastContainer";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {

  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className="flex flex-col min-h-screen">
        <AuthProvider>
          <AutoLogoutManager timeoutMinutes={60} />
          <BusinessProvider>
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
            <WhatsappIcon />
            <ToastContainer />
          </BusinessProvider>
        </AuthProvider>
      </body>
    </html>
  );
}