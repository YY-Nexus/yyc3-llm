import path from 'path';
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    optimizeCss: false,
    scrollRestoration: false,
  },
  // 根据环境变量决定是否静态导出
  ...(process.env.EXPORT_STATIC === 'true' ? {
    output: 'export',
    trailingSlash: true,
  } : {
    output: 'standalone'
  }),
  // 跨域支持
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ]
  },
  webpack: (config, { isServer, dev }) => {
      // Remove console.log in production
    if (!dev && !isServer) {
      config.optimization.minimizer.forEach((minimizer) => {
        if (minimizer.constructor.name === 'TerserPlugin') {
          minimizer.options.terserOptions.compress.drop_console = true;
        }
      });
    }
    
    // ProgressPlugin 已移除，避免 ES 模块中使用 require 导致的错误
    
    // Split chunks for production
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 10,
        minSize: 20000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              // get the name. E.g. node_modules/packageName/not/this/part.js
              // or node_modules/packageName
              const match = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
              const packageName = match ? match[1] : 'unknown-package';
              
              // npm package names are URL-safe, but some servers don't like @ symbols
              return `npm.${packageName.replace('@', '')}`;
            },
          },
        },
      };
    }
    
    // Add webpack aliases and module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      // Ignore react-native modules
      'react-native': false,
      'react-native-web': false,
      // Add @ alias using path.resolve() instead of __dirname
      '@': path.resolve(),
    };
    
    // Add redirects
    config.resolve.fallback = {
      ...config.resolve.fallback,
      // Redirect @vite/client requests
      '@vite/client': '/',
    };
    
    return config;
  },
}

export default nextConfig