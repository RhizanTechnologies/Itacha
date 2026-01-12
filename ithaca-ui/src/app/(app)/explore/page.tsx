"use client";

import dynamic from "next/dynamic";

// Dynamically import the canvas component with SSR disabled
// This is required because Sigma.js uses WebGL which doesn't exist on the server
const ExploreCanvas = dynamic(
  () => import("@/components/canvas/explore-canvas").then((mod) => mod.ExploreCanvas),
  { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center">Loading canvas...</div> }
);

export default function ExplorePage() {
  return <ExploreCanvas />;
}
