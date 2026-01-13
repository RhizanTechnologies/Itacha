"use client";

interface CanvasStatusIndicatorProps {
  status?: "idle" | "processing" | "live";
  message?: string;
  nodeCount?: number;
  edgeCount?: number;
}

export function CanvasStatusIndicator({ 
  status = "live", 
  message,
  nodeCount = 0,
  edgeCount = 0,
}: CanvasStatusIndicatorProps) {
  const statusConfig = {
    idle: {
      color: "bg-muted-foreground",
      pingColor: "bg-muted-foreground",
      label: "Idle",
    },
    processing: {
      color: "bg-yellow-500",
      pingColor: "bg-yellow-500",
      label: "Processing",
    },
    live: {
      color: "bg-primary",
      pingColor: "bg-primary",
      label: "Live",
    },
  };

  const config = statusConfig[status];

  return (
    <div className="absolute bottom-6 left-6 z-30 flex items-center gap-3 bg-card/80 backdrop-blur px-3 py-1.5 rounded-full border border-border shadow-lg">
      {/* Pulsing Status Dot */}
      <div className="relative flex h-2.5 w-2.5">
        <span 
          className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.pingColor} opacity-75`}
        />
        <span 
          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.color}`}
        />
      </div>

      {/* Status Text */}
      <span className="text-muted-foreground text-xs font-mono uppercase tracking-wider">
        {message || (
          <>
            {config.label} • {nodeCount} nodes • {edgeCount} edges
          </>
        )}
      </span>
    </div>
  );
}
