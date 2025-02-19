/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '',
  output: 'standalone',
  assetPrefix: '/investimentos',
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET' },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 