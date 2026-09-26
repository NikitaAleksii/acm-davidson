import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow admins to paste image URLs from any https host (e.g. Instagram CDN, Google Drive).
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
  },
  // Uploaded files live in public/uploads; Prisma needs to stay external on the server.
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  poweredByHeader: false,
};

export default nextConfig;
