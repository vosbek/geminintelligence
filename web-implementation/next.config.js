/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 14+
  experimental: {
    // Enable if needed
  },
  webpack: (config) => {
    return config;
  },
}

module.exports = nextConfig