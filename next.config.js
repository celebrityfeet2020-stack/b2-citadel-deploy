/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/b2/:path*',
        destination: (process.env.B2_API_URL || 'http://b2-core:22888') + '/api/b2/:path*',
      },
    ];
  },
};
module.exports = nextConfig;
