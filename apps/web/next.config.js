/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/auth"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
