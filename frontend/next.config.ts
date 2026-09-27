import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import path from "path";

// Load the single repo-root `.env` (Next only auto-loads `frontend/.env` by default).
loadEnvConfig(path.join(__dirname, ".."));

const nextConfig: NextConfig = {
  // Static HTML export for Render Static Site hosting (produces the `out/` folder).
  output: "export",
  // Keeps MUI's Next.js Emotion cache consistent under Turbopack.
  transpilePackages: ["@mui/material-nextjs"],
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
