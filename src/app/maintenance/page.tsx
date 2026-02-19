/**
 * /maintenance — Maintenance page
 *
 * Shown to all non-admin users when maintenance_mode = 1 in Configuration.
 * Accessible without authentication.
 */

import { IconTool, IconClock } from "@tabler/icons-react";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md text-center space-y-6">

        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <IconTool className="h-10 w-10 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Under Maintenance</h1>
          <p className="text-muted-foreground text-lg">
            ProDrones Hub is currently undergoing scheduled maintenance.
          </p>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground space-y-2">
          <div className="flex items-center justify-center gap-2">
            <IconClock className="h-4 w-4" />
            <span>We&apos;ll be back shortly.</span>
          </div>
          <p>Please check back in a few minutes. We apologize for the inconvenience.</p>
        </div>

        <p className="text-xs text-muted-foreground">
          If you are an administrator, you can{" "}
          <a href="/login" className="underline underline-offset-2 hover:text-foreground">
            log in
          </a>{" "}
          to bypass maintenance mode.
        </p>
      </div>
    </div>
  );
}
