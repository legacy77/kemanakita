import type { Metadata, Viewport } from "next";
import { M_PLUS_Rounded_1c, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { MobileNavShell } from "./mobile-nav";

// Display / heading — font membulat yang ramah, nuansa game RPG (design_system §2.1)
const rounded = M_PLUS_Rounded_1c({
  variable: "--font-rounded",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  display: "swap",
});

// Body / UI
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KemanaKita",
  description: "Rencana bareng, jalan bareng.",
  applicationName: "KemanaKita",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    title: "KemanaKita",
    statusBarStyle: "default",
  },
};

// PWA: lebar device (bukan viewport terkunci — tanpa maximum-scale /
// user-scalable=no, agar zoom tetap tersedia demi aksesibilitas).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFCF4" },
    { media: "(prefers-color-scheme: dark)", color: "#101A2E" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${rounded.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MobileNavShell>{children}</MobileNavShell>
      </body>
    </html>
  );
}
