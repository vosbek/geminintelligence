/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: process.env.NODE_ENV === 'production' ? '/gemini' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/gemini/' : ''
}

module.exports = nextConfig