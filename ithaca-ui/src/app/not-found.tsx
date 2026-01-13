import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {/* Illustration */}
      <div className="relative w-64 h-48 mb-8 rounded-2xl bg-gradient-to-b from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 overflow-hidden flex items-end justify-center">
        {/* Ocean waves */}
        <div className="absolute bottom-0 w-full h-16 bg-gradient-to-t from-blue-300 to-transparent dark:from-blue-600" />
        {/* Simple ship icon */}
        <div className="relative z-10 mb-4">
          <svg
            className="w-24 h-24 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 17h18M5 17l2-7h10l2 7M9 10V5l3-2 3 2v5"
            />
          </svg>
        </div>
      </div>

      {/* Text Content */}
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-bold text-foreground mb-2">
        This page seems lost at sea.
      </h2>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        Like Odysseus on his journey, you've drifted off course. 
        The coordinates for this argument graph couldn't be found.
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/">
          <Button className="gap-2">
            <Home className="h-4 w-4" />
            Head back to Ithaca
          </Button>
        </Link>
        <Button variant="outline" className="gap-2">
          <AlertCircle className="h-4 w-4" />
          Report an issue
        </Button>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-8 text-center">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/docs" className="hover:text-foreground transition-colors">
            Docs
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/status" className="hover:text-foreground transition-colors">
            Status
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          © 2026 Ithaca Science. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
