import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import AuthProvider from "@/components/providers/session-provider";
import AuthNotifications from "@/components/auth/auth-notifications";
import { PermissionGuardProvider } from "@/components/auth/permission-guard-provider";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PRETENSA - Presupuestación",
  description: "Sistema de presupuestación PRETENSA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <PermissionGuardProvider>
              <Suspense fallback={null}>
                <AuthNotifications />
              </Suspense>
              {children}
              <Toaster richColors position="top-right" />
            </PermissionGuardProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
