"use client";

import { useEffect, useState, useTransition } from "react";
import { Building2, Loader2 } from "lucide-react";
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

export function OrganizationSwitcher() {
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void getOrganizationSummaries()
      .then(setOrganizations)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || organizations.length <= 1) {
    return null;
  }

  const activeOrganization =
    organizations.find((organization) => organization.isActive) ??
    organizations[0];

  return (
    <div className="px-2 pb-2">
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
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
            <SelectValue placeholder="Select organization" />
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
