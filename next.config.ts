import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return "";
  }
})();

const nextConfig: NextConfig = {
  images: {
    // Las imágenes de producto se cargan por URL desde el admin (Google,
    // Unsplash, CDNs, etc.), así que permitimos cualquier host HTTPS.
    // El host de Supabase se deja explícito por claridad.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost }]
        : []),
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
