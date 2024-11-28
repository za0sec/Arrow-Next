module.exports = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'https://api.arrowservicios.ar/:path*', // Proxy a tu backend
            },
        ];
    },
};
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['arrowconnect.arrowservicios.ar'], // Agrega tu dominio aquí
        unoptimized: true,
    },
    output: 'export',
};

module.exports = nextConfig;