/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/auth", "@repo/forms-engine", "@repo/forms-library"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
