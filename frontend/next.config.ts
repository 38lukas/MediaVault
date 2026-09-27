import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static HTML export for Render Static Site hosting (produces the `out/` folder).
  output: "export",
  images: {
    // Static export has no Image Optimization server; serve images as-is.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.igdb.com",
      },
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
    ],
  },
};

export default nextConfig;
