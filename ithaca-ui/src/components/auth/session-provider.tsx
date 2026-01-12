"use client";

import { authClient } from "@/lib/auth-client";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Export hooks for convenience
export { useSession } from "@/lib/auth-client";
