import * as React from "react";

import { cn } from "@/lib/utils";

type GraphConstellationProps = {
  className?: string;
};

export function GraphConstellation({ className }: GraphConstellationProps) {
  return (
    <svg
      aria-hidden
      className={cn("constellation", className)}
      viewBox="0 0 1200 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
    >
      <defs>
        <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id="node" cx="50%" cy="50%" r="60%">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.0" />
        </radialGradient>
        <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.55 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Edges */}
      <g className="constellation-edges" stroke="url(#edge)" strokeWidth="2" strokeLinecap="round">
        <path className="constellation-edge" d="M220 250 L420 150" />
        <path className="constellation-edge" d="M420 150 L620 210" />
        <path className="constellation-edge" d="M620 210 L820 130" />
        <path className="constellation-edge" d="M620 210 L940 240" />
        <path className="constellation-edge" d="M420 150 L560 320" />
        <path className="constellation-edge" d="M560 320 L940 240" />
      </g>

      {/* Nodes */}
      <g className="constellation-nodes" filter="url(#softGlow)">
        {[
          { x: 220, y: 250, r: 10 },
          { x: 420, y: 150, r: 12 },
          { x: 560, y: 320, r: 9 },
          { x: 620, y: 210, r: 14 },
          { x: 820, y: 130, r: 11 },
          { x: 940, y: 240, r: 12 },
        ].map((n, i) => (
          <g key={i} className="constellation-node" style={{ transformOrigin: `${n.x}px ${n.y}px` }}>
            <circle cx={n.x} cy={n.y} r={n.r} fill="currentColor" fillOpacity="0.25" />
            <circle cx={n.x} cy={n.y} r={n.r * 3.2} fill="url(#node)" />
          </g>
        ))}
      </g>
    </svg>
  );
}
