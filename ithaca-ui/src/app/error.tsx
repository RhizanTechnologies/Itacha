"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, RefreshCw } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {/* Red glow illustration */}
      <div className="relative w-48 h-48 mb-8">
        <div className="absolute inset-0 bg-gradient-radial from-red-500/30 via-red-500/10 to-transparent rounded-full blur-2xl" />
        <div className="absolute inset-8 bg-gradient-radial from-red-400/40 via-red-400/20 to-transparent rounded-full blur-xl" />
      </div>

      {/* Text Content */}
      <h1 className="text-3xl font-bold text-foreground mb-2 text-center">
        Our servers are drifting — we're on it.
      </h1>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        An unexpected storm has thrown our argument graph off course. 
        We're working to regain scientific stability.
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={() => reset()} className="gap-2 bg-red-600 hover:bg-red-700">
          <RefreshCw className="h-4 w-4" />
          Reload
        </Button>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        </Link>
      </div>

      {/* Error ID */}
      {error.digest && (
        <p className="text-xs text-muted-foreground mt-8 font-mono">
          REPORT ID: {error.digest}
        </p>
      )}

      {/* Footer */}
      <footer className="absolute bottom-8 text-center">
        <p className="text-xs text-muted-foreground">
          © Ithaca Scientific Graphing
        </p>
      </footer>
    </div>
  );
}
