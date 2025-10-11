import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  skipTrailingSlashRedirect: true,
  // Skip prerendering for dynamic pages
  output: 'standalone',
};

export default nextConfig;
