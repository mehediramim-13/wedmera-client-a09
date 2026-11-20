import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  env: isProd
    ? {
        NEXT_PUBLIC_APP_URL: "https://wedmera-client-a09.vercel.app",
        NEXT_PUBLIC_API_URL: "https://wedmera-server-a09.vercel.app",
      }
    : {},
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;