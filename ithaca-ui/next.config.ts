import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    // @ts-expect-error: turbopackRoot is not yet in the type definition
    turbopackRoot: process.cwd(),
    optimizePackageImports: [
      "lucide-react",
      "@react-sigma/core",
      "graphology",
      "sigma",
    ],
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
};

export default nextConfig;
