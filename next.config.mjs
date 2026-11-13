/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allows the explorer to be served under a sub-path of BeeRadar.co.uk if needed,
  // e.g. NEXT_PUBLIC_BASE_PATH=/explore
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  transpilePackages: ['three'],
  async headers() {
    return [
      {
        source: '/models/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};
export default nextConfig;
