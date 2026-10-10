import type { MetadataRoute } from "next";

// Installable web app ("Ana ekrana ekle"). No service worker yet: the games
// need the network for the song (YouTube) anyway; offline caching would be
// a separate step.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Avare",
    short_name: "Avare",
    description: "Arkada şarkı çalarken şehirde ağ at, drift yap, F-16 ile gökdelenlerin arasından geç. Görev yok, acele yok.",
    lang: "tr",
    dir: "ltr",
    // signed-in players land on the game list; others are sent on to sign in
    start_url: "/games",
    scope: "/",
    // games want the whole screen (Android hides the status bar); browsers
    // without fullscreen support fall back to standalone
    display: "fullscreen",
    display_override: ["fullscreen", "standalone"],
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    categories: ["games", "music", "entertainment"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
