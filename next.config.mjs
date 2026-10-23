/** @type {import('next').NextConfig} */
const nextConfig = {
  // ---------------------------------------------------------------
  // Basics
  // ---------------------------------------------------------------
  reactStrictMode: true,
  output: "standalone",
  poweredByHeader: false,
  compress: true,

  // ---------------------------------------------------------------
  // Experiments
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
  serverExternalPackages: ["@react-pdf/renderer", "bcryptjs"],

  // ---------------------------------------------------------------
  // Images — nothing uses next/image, so keep sharp out of the build
  // ---------------------------------------------------------------
  images: { unoptimized: true },

  // ---------------------------------------------------------------
  // Dev-only: allow LAN machines to load /_next/* assets.
  // Ignored in production builds.
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
      // Security headers for every route
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

      // Never cache API responses — auth, health, search, PDF, etc.
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },

      // Immutable assets — content-hashed, safe to cache forever
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },

      // Next.js runtime files (chunks, manifests) — ALWAYS revalidate.
      // This is what fixes the "Failed to find Server Action" error:
      // after a rebuild, action IDs change, and browsers holding the
      // old chunk will 404 forever if they cache it. no-cache forces
      // revalidation on every request while still allowing a cached
      // 304 response if the file is unchanged.
      {
        source: "/_next/:path*",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
    ];
  },
};

export default nextConfig;