"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface JobOption {
  jobProductId: string;
  label: string;
}

interface JobSelectorProps {
  currentJobProductId: string;
  viewerType: string;
  jobs: JobOption[];
}

export function JobSelector({ currentJobProductId, viewerType, jobs }: JobSelectorProps) {
  const router = useRouter();

  if (jobs.length <= 1) return null;

  return (
    <div className="absolute top-14 left-4 z-[1000]">
      <Select
        value={currentJobProductId}
        onValueChange={(value) => {
          router.push(`/viewer/${viewerType}/${value}`);
        }}
      >
        <SelectTrigger className="w-48 h-8 text-xs bg-background/90 backdrop-blur-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {jobs.map((job) => (
            <SelectItem key={job.jobProductId} value={job.jobProductId}>
              {job.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
