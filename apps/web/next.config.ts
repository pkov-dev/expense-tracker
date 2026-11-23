import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow opening the dev server by LAN IP (e.g. http://192.168.0.103:3000), not only via localhost.
  allowedDevOrigins: ['192.168.*.*'],
  transpilePackages: ['@expense-tracker/shared'],
};

export default nextConfig;
