import type { NextConfig } from "next";
import "./src/env";

const nextConfig: NextConfig = {
  transpilePackages: ["@second-brain/ui", "@second-brain/types"],
};

export default nextConfig;
