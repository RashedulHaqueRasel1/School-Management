import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Home → dashboard. Later, proxy.ts will send unauthenticated users to /login.
  async redirects() {
    return [{ source: "/", destination: "/dashboard", permanent: false }];
  },
  cacheComponents: true,
  partialPrefetching: true,
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
