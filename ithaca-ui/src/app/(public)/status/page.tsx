import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export default function StatusPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">System Status</h1>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 font-medium">
          <CheckCircle2 className="h-5 w-5" />
          All Systems Operational
        </div>
      </div>

      <div className="space-y-4">
        {/* Core Services */}
        <div className="p-6 rounded-xl border border-border bg-card flex items-center justify-between">
          <div>
            <h3 className="font-semibold">API Gateway</h3>
            <p className="text-sm text-muted-foreground">Core graph data API</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500 font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Operational
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Web Interface</h3>
            <p className="text-sm text-muted-foreground">ithaca.app dashboard</p>
          </div>
           <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500 font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Operational
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Search Engine</h3>
            <p className="text-sm text-muted-foreground">Elasticsearch cluster</p>
          </div>
           <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500 font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Operational
          </div>
        </div>

         <div className="p-6 rounded-xl border border-border bg-card flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Database (Postgres)</h3>
            <p className="text-sm text-muted-foreground">Primary data store</p>
          </div>
           <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500 font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Operational
          </div>
        </div>
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>No incidents reported in the last 90 days.</p>
      </div>
    </div>
  );
}
