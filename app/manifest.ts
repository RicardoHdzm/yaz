import type { MetadataRoute } from "next";
import { NOMBRES } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${NOMBRES.a} & ${NOMBRES.b}`,
    short_name: `${NOMBRES.a} & ${NOMBRES.b}`,
    description: "Nuestro espacio a distancia",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f4f2",
    theme_color: "#18181b",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
