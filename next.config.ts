import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Disable image optimization if it's causing issues
    // Set to true if you want to disable optimization completely
    unoptimized: false,
    // Allow image optimization for local files
    // Local images in public folder should work by default
    formats: ['image/avif', 'image/webp'],
    // If you need to allow external domains in the future
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'signin-fil-investments.com',
      },
    ],
  },
  // Ensure static files are properly served
  output: 'standalone',
};

export default nextConfig;
