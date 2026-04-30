import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
                pathname: '/**',  // Pathname'ı yıldız (*) ile belirtmek tüm alt yolları kapsar
            },
        ],
        minimumCacheTTL: 86400,
    },
};

export default nextConfig;
