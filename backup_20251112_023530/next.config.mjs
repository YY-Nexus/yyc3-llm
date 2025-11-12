/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  webpack: (config, { dev, webpack }) => {
    // 构建进度
    config.plugins.push(new webpack.ProgressPlugin())
    // 仅在生产环境调整 splitChunks
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              enforce: true,
            },
          },
        },
      }
    }
    return config
  },
  // 根据环境变量决定是否静态导出
  ...(process.env.NEXT_EXPORT === 'true' ? {
    output: 'export',
    trailingSlash: true,
  } : {}),
  // 跨域支持 (仅在非静态导出时生效)
  ...(process.env.NEXT_EXPORT !== 'true' ? {
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block',
            },
          ],
        },
      ]
    },
  } : {}),
}

export default nextConfig