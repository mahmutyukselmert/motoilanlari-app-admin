import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'export',
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
                pathname: '/**',  // Pathname'ı yıldız (*) ile belirtmek tüm alt yolları kapsar
            },
        ],
    },
};

export default nextConfig;
