/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
          {
            source: '/api/:path*', // 前端请求的路径
            destination: 'https://api.lolimi.cn/API/:path*', // 转发到的目标地址
          },
        ];
      }
};

export default nextConfig;
