import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'export',
  transpilePackages: ['@open-chess/chess-core'],
  images: { unoptimized: true },
};
export default config;
