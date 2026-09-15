import type { NextConfig } from "next";
import { join } from "path";

const nextConfig: NextConfig = {
  // The shell imports the fail-closed contracts from the sibling services/ai
  // package (../ai/runtime/offline-team/) — local-plane code, no network.
  //
  // Next 16 builds with Turbopack, which resolves modules only inside the
  // project root; the scaffold's own package-lock.json pins that root to
  // xiv-story-shell. `turbopack.root` widens it to services/ so the sibling
  // contracts resolve (turbopack.md: "Root directory").
  turbopack: {
    root: join(__dirname, ".."),
  },
};

export default nextConfig;