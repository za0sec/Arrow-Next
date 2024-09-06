module.exports = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:3001/api/:path*', // Proxy a tu backend
            },
        ];
    },
};
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['arrowconnect.arrowservicios.ar'], // Agrega tu dominio aquí
    },
};

module.exports = nextConfig;