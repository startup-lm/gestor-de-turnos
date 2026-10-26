"use client";

import React from "react";
import { AuthProvider } from "@/lib/auth/AuthContext";
import AutoLogoutManager from "@/lib/auth/AutoLogoutManager";
import { BusinessProvider } from "@/lib/context/BusinessContext";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/ui/Footer";
import WhatsappIcon from "@/components/buttons/WhatsappIcon";
import ToastContainer from "@/components/ui/ToastContainer";

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: Readonly<ClientProvidersProps>) {
  return (
    <AuthProvider>
      <AutoLogoutManager timeoutMinutes={60} />
      <BusinessProvider>
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
        <WhatsappIcon />
        <ToastContainer />
      </BusinessProvider>
    </AuthProvider>
  );
}
