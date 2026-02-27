"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import {
  CanvasProvider,
  useCanvasActions,
} from "@/contexts/canvas-context";
import { AppErrorBoundary } from "@/components/error-boundary";

// Dynamically import the canvas component with SSR disabled
// This is required because Sigma.js uses WebGL which doesn't exist on the server
const ExploreCanvas = dynamic(
  () =>
    import("@/components/canvas/explore-canvas").then(
      (mod) => mod.ExploreCanvas,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center">
        Loading canvas...
      </div>
    ),
  },
);

/**
 * Hydrate graph from share-link URL params.
 * Reads `?q=<searchTarget>` and dispatches it into canvas state,
 * which triggers GraphLoader to fetch the graph automatically.
 */
function ShareLinkHydrator() {
  const searchParams = useSearchParams();
  const actions = useCanvasActions();

  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      actions.setSearchTarget(query);
      actions.setLoading(true);
    }
  }, [searchParams, actions]);

  return null;
}

export default function ExplorePage() {
  return (
    <AppErrorBoundary
      fallbackTitle="Graph Explorer Error"
      fallbackMessage="The graph renderer encountered an error. This can happen with very large graphs or WebGL issues. Try refreshing."
    >
      <CanvasProvider>
        <Suspense>
          <ShareLinkHydrator />
        </Suspense>
        <div className="h-full w-full relative">
          <ExploreCanvas />
        </div>
      </CanvasProvider>
    </AppErrorBoundary>
  );
}
