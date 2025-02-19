/** @type {import('next').NextConfig} */
const nextConfig = {
<<<<<<< HEAD
  basePath: '',
=======
  basePath: '/investimentos',
>>>>>>> cd641fce244713ce16bc88451822e61bf2232d25
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