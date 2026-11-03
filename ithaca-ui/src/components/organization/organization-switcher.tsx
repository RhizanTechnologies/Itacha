"use client";

import { useEffect, useState, useTransition } from "react";
import { Building2, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getOrganizationSummaries,
  setActiveOrganization,
  type OrganizationSummary,
} from "@/app/(app)/admin/actions";

interface OrganizationSwitcherProps {
  collapsed?: boolean;
}

export function OrganizationSwitcher({ collapsed = false }: OrganizationSwitcherProps) {
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void getOrganizationSummaries()
      .then(setOrganizations)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
        {!collapsed && <span className="text-muted-foreground text-xs">Loading workspace...</span>}
      </div>
    );
  }

  const activeOrganization =
    organizations.find((organization) => organization.isActive) ??
    organizations[0] ?? {
      id: "default",
      name: "Pilot Lab",
      role: "OWNER" as const,
      isActive: true,
    };

  const canAdminister =
    activeOrganization.role === "OWNER" || activeOrganization.role === "ADMIN";
  const orgHref = canAdminister ? "/admin" : "/dashboard";

  if (collapsed) {
    return (
      <div className="flex justify-center px-2 py-2">
        <Link href={orgHref} title={activeOrganization.name}>
          <div className="border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 flex size-8 items-center justify-center rounded-lg border text-xs font-bold transition-colors">
            {activeOrganization.name.slice(0, 2).toUpperCase()}
          </div>
        </Link>
      </div>
    );
  }

  if (organizations.length <= 1) {
    return (
      <div className="px-3 py-2">
        <Link
          href={orgHref}
          className="bg-muted/40 hover:bg-muted border-border/50 group flex items-center justify-between rounded-lg border p-2 transition-colors"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="border-primary/20 bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-transform group-hover:scale-105">
              {activeOrganization.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 text-left">
              <div className="text-foreground truncate text-xs font-semibold leading-tight">
                {activeOrganization.name}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="text-muted-foreground text-[10px] font-medium capitalize">
                  {activeOrganization.role.toLowerCase()}
                </span>
                <span className="bg-primary/10 text-primary rounded px-1 text-[10px] font-medium">
                  Lab
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <Select
        value={activeOrganization.id}
        disabled={isPending}
        onValueChange={(organizationId) =>
          startTransition(async () => {
            await setActiveOrganization(organizationId);
            window.location.reload();
          })
        }
      >
        <SelectTrigger className="bg-muted/40 border-border/50 hover:bg-muted h-11 w-full">
          <div className="flex min-w-0 items-center gap-2.5">
            {isPending ? (
              <Loader2 className="text-primary h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <div className="border-primary/20 bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded border text-[10px] font-bold">
                {activeOrganization.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 text-left">
              <div className="truncate text-xs font-semibold leading-tight">{activeOrganization.name}</div>
              <div className="text-muted-foreground text-[10px] capitalize">{activeOrganization.role.toLowerCase()}</div>
            </div>
          </div>
        </SelectTrigger>
        <SelectContent>
          {organizations.map((organization) => (
            <SelectItem key={organization.id} value={organization.id}>
              {organization.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
