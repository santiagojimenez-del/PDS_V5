import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ProDrones Hub",
    short_name: "ProDrones",
    description:
      "Internal operations platform for Professional Drone Solutions",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: "/img/PDSLogo1-xsm.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
