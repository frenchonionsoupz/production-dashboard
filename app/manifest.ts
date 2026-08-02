import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Production Dashboard",
    short_name: "Production",
    description: "Writing production dashboard and log archive",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#171717",
    icons: [
      {
        src: "/pwa-icons/192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa-icons/512",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
