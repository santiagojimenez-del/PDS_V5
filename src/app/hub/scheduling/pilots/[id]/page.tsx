"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { PilotAvailabilityManager } from "@/modules/scheduling/components/pilot-availability-manager";
import { PilotBlackoutManager } from "@/modules/scheduling/components/pilot-blackout-manager";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

async function fetchUser(id: string) {
  const res = await fetch(`/api/admin/users`);
  if (!res.ok) throw new Error("Failed to fetch users");
  const json = await res.json();
  const users = json.data.users as User[];
  return users.find((u) => u.id === parseInt(id, 10));
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
              <h2 className="text-2xl font-bold">Pilot Schedule - {pilot.name}</h2>
              <p className="text-sm text-muted-foreground">
                {pilot.email} • {pilot.role}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Availability Manager */}
      <PilotAvailabilityManager pilotId={pilot.id} pilotName={pilot.name} />

      {/* Blackout Manager */}
      <PilotBlackoutManager pilotId={pilot.id} pilotName={pilot.name} />
    </div>
  );
}
