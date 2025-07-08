import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 生产环境优化
  compress: true,
  output: 'standalone', // 用于Docker部署
  
  // 实验性功能
  experimental: {
    // 暂时禁用优化CSS以解决构建问题
    // optimizeCss: true,
  },
  
  // 图片优化
  images: {
    unoptimized: true // 简化部署，避免外部依赖
  },
  
  // 环境变量
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  }
};

export default nextConfig;
