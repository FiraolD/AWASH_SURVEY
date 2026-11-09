/** @type {import('next').NextConfig} */
const nextConfig = {
  // ---------------------------------------------------------------
  // Basics
  // ---------------------------------------------------------------
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // ---------------------------------------------------------------
  // Experiments (Windows Stability)
  // ---------------------------------------------------------------
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },

    // Windows: the worker pool used for compilation is unreliable.
    // Compile in the main process instead. Slower, but stable.
    workerThreads: false,
    cpus: 1,
  },

  // ---------------------------------------------------------------
  // Packages that must not be bundled by webpack
  // ---------------------------------------------------------------
  // Keeps pdfkit and @react-pdf/renderer external so Next.js doesn't 
  // break their internal file paths (fixes the Helvetica font crash).
  serverExternalPackages: ["@react-pdf/renderer", "pdfkit", "bcryptjs"],

  // ---------------------------------------------------------------
  // Images
  // ---------------------------------------------------------------
  images: { unoptimized: true },

  // ---------------------------------------------------------------
  // Dev-only: allow LAN machines to load /_next/* assets.
  // ---------------------------------------------------------------
  allowedDevOrigins: ["10.1.12.21", "localhost", "127.0.0.1"],

  // ---------------------------------------------------------------
  // Build must fail loudly on real problems
  // ---------------------------------------------------------------
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  // ---------------------------------------------------------------
  // HTTP headers
  // ---------------------------------------------------------------
  async headers() {
    const isProd = process.env.NODE_ENV === "production";

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          ...(isProd
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
        ],
      },

      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },

      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },

  
      {
        source: "/_next/:path*",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
    ];
  },
};

export default nextConfig;