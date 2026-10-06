import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The E2E run points this at its own directory so a cold build cannot collide
  // with a dev server that is holding .next open.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
