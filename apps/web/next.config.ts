import type { NextConfig } from "next";

/**
 * The one address Razorpay has verified for payments. Payments started from any other
 * address (such as the old vercel.app one) are blocked as "website mismatch".
 */
const CANONICAL_HOST = "modulrvesit.in";
const OLD_HOSTS = ["modulr-opal.vercel.app", `www.${CANONICAL_HOST}`];

const nextConfig: NextConfig = {
  // The shared package ships TypeScript source.
  transpilePackages: ["@modulr/shared"],
  async redirects() {
    return OLD_HOSTS.map((host) => ({
      // Everything except webhooks: Razorpay and Bunny post there and don't follow redirects.
      source: "/:path((?!api/webhooks/).*)",
      has: [{ type: "host" as const, value: host }],
      destination: `https://${CANONICAL_HOST}/:path`,
      permanent: true,
    }));
  },
};

export default nextConfig;
