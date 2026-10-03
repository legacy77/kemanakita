import type { MetadataRoute } from "next";

// Manifest PWA (spec §4.x): installable standalone, ikon SVG + maskable.
// Next menyajikan ini di /manifest.webmanifest (dirujuk dari layout metadata).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KemanaKita",
    short_name: "KemanaKita",
    description: "Rencana bareng, jalan bareng.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFCF4",
    theme_color: "#101A2E",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icons/maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
