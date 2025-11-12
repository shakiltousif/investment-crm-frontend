import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Completely disable image optimization - serve images directly from public folder
    // This bypasses the /_next/image endpoint entirely
    unoptimized: true,
  },
  // Ensure public folder is served correctly in production
  // Next.js automatically serves files from the public folder at the root URL
  // Make sure the public folder exists and is accessible
};

export default nextConfig;
