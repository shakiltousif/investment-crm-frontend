import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Completely disable image optimization - serve images directly from public folder
    // This bypasses the /_next/image endpoint entirely
    unoptimized: true,
  },
};

export default nextConfig;
