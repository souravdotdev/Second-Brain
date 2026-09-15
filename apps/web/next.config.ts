import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@second-brain/ui", "@second-brain/types"],
};

export default nextConfig;
