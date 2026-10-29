import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Home → dashboard. Later, proxy.ts will send unauthenticated users to /login.
  async redirects() {
    return [
      { source: "/", destination: "/dashboard", permanent: false },
      // The school-wide student register was removed — registers are taken per section.
      { source: "/attendance/students", destination: "/attendance", permanent: false },
    ];
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
