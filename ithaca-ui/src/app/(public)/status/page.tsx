"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "down";
  latencyMs?: number;
  description: string;
}

interface HealthData {
  status: string;
  services: ServiceStatus[];
  checkedAt: string;
}

const STATUS_CONFIG = {
  operational: {
    icon: CheckCircle2,
    label: "Operational",
    className: "text-green-600 dark:text-green-500",
  },
  degraded: {
    icon: AlertTriangle,
    label: "Degraded",
    className: "text-yellow-600 dark:text-yellow-500",
  },
  down: {
    icon: XCircle,
    label: "Down",
    className: "text-red-600 dark:text-red-500",
  },
};

export default function StatusPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error("Health check failed");
      const data = await res.json();
      setHealth(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const allOperational = health?.services.every(
    (s) => s.status === "operational",
  );

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">System Status</h1>
        {loading ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground font-medium">
            <Loader2 className="h-5 w-5 animate-spin" />
            Checking services...
          </div>
        ) : error ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-700 dark:text-red-400 font-medium">
            <XCircle className="h-5 w-5" />
            Unable to reach health endpoint
          </div>
        ) : allOperational ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 font-medium">
            <CheckCircle2 className="h-5 w-5" />
            All Systems Operational
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 font-medium">
            <AlertTriangle className="h-5 w-5" />
            Some Services Degraded
          </div>
        )}
      </div>

      {health && (
        <div className="space-y-4">
          {health.services.map((service) => {
            const config = STATUS_CONFIG[service.status];
            const Icon = config.icon;
            return (
              <div
                key={service.name}
                className="p-6 rounded-xl border border-border bg-card flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold">{service.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {service.description}
                    {service.latencyMs != null && (
                      <span className="ml-2 text-xs">
                        ({service.latencyMs}ms)
                      </span>
                    )}
                  </p>
                </div>
                <div
                  className={`flex items-center gap-2 text-sm font-medium ${config.className}`}
                >
                  <Icon className="h-4 w-4" />
                  {config.label}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={fetchHealth}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        {health?.checkedAt && (
          <span className="text-sm text-muted-foreground">
            Last checked:{" "}
            {new Date(health.checkedAt).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}
