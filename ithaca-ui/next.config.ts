import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    // @ts-expect-error: turbopackRoot is not yet in the type definition
    turbopackRoot: process.cwd(),
  },
};

export default nextConfig;
