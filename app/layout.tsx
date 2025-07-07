"use client";

import '@/styles/globals.css';
import Navbar from "@/components/navbar/Navbar";
import WhatsappIcon from "@/components/buttons/WhatsappIcon";
import Footer from "@/components/ui/Footer";
import { AuthProvider } from '@/lib/auth/AuthContext';
import AutoLogoutManager from '@/lib/auth/AutoLogoutManager';

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {

  return (
    <html lang="es">
      <body className="flex flex-col min-h-screen">
        <AuthProvider>
          <AutoLogoutManager timeoutMinutes={15} />
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <WhatsappIcon />
        </AuthProvider>
      </body>
    </html>
  );
}