import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compresión gzip/brotli de respuestas
  compress: true,

  // Headers de caché para assets estáticos
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      {
        // Assets estáticos: cache inmutable por 1 año
        source: "/(.*)\\.(js|css|woff2|woff|ttf|ico|svg|png|jpg|webp)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Optimización de tree-shaking para librerías pesadas
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
    // Las server actions envían el cuerpo dentro del payload RSC y por
    // defecto se limitan a 1 MB. La imagen de cierre (base64) puede pesar
    // varios MB, así que ampliamos el límite para que no se rechace la
    // petición antes de llegar al handler.
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
