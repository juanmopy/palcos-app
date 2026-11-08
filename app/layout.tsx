import type { Metadata, Viewport } from "next";
import { InstallAppPrompt } from "@/components/pwa/install-app-prompt";
import { Toaster } from "sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: "Gestión de Palcos",
  description: "Gestión de la venta de palcos del evento",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Palcos",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: "/icons/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CO" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {children}
        <InstallAppPrompt />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
