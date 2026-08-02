import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native-binding packages — Turbopack can't bundle their .node files, so
  // they need to be required normally from node_modules at runtime instead.
  serverExternalPackages: ["@lancedb/lancedb", "@xenova/transformers"],
};

export default nextConfig;
