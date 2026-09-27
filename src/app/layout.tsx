import type { Metadata } from "next";
import { M_PLUS_Rounded_1c, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
