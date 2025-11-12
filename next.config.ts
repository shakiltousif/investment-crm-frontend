import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Disable image optimization if it's causing issues
    // Set to true if you want to disable optimization completely
    unoptimized: false,
    // If you need to allow external domains in the future
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'signin-fil-investments.com',
      },
    ],
  },
};

export default nextConfig;
