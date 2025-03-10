import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["https://ctia-storage.s3.eu-west-1.amazonaws.com"],
  },
};

export default nextConfig;
