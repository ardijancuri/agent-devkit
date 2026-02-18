import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@agent-devkit/runtime', '@agent-devkit/sdk'],
};

export default nextConfig;
