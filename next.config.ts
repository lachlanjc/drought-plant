import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
