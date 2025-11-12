import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  redirects: async () => {
    return [
      {
        source: "/",
        destination: "/nyc",
        permanent: false
      },
    ];
  },
};

export default nextConfig;
