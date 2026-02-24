"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { PilotAvailabilityManager } from "@/modules/scheduling/components/pilot-availability-manager";
import { PilotBlackoutManager } from "@/modules/scheduling/components/pilot-blackout-manager";

interface PilotUser {
  id: number;
  fullName: string;
  email: string;
  roles: number[];
}

async function fetchUser(id: string) {
  const res = await fetch(`/api/admin/users/${id}`);
  if (!res.ok) throw new Error("Failed to fetch user");
  const json = await res.json();
  return json.data as PilotUser;
}

export default function PilotSchedulingPage() {
  const params = useParams();
  const router = useRouter();
  const pilotId = params?.id as string;

  const { data: pilot, isLoading } = useQuery({
    queryKey: ["pilot", pilotId],
    queryFn: () => fetchUser(pilotId),
    enabled: !!pilotId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!pilot) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Pilot Not Found</h2>
          <p className="text-muted-foreground">The requested pilot could not be found.</p>
        </div>
        <Link href="/scheduling/pilots">
          <Button variant="outline">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Pilots
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/scheduling/pilots">
              <Button variant="ghost" size="icon">
                <IconArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold">Pilot Schedule - {pilot.fullName || pilot.email}</h2>
              <p className="text-sm text-muted-foreground">
                {pilot.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Availability Manager */}
      <PilotAvailabilityManager pilotId={pilot.id} pilotName={pilot.fullName || pilot.email} />

      {/* Blackout Manager */}
      <PilotBlackoutManager pilotId={pilot.id} pilotName={pilot.fullName || pilot.email} />
    </div>
  );
}
