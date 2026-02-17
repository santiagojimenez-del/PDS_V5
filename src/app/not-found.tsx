import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconHome, IconArrowLeft, IconMapPin } from "@tabler/icons-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            {/* 404 Icon */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <IconMapPin className="h-24 w-24 text-primary opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl font-bold text-primary">404</span>
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="mb-2 text-2xl font-bold text-foreground">Page Not Found</h1>

            {/* Description */}
            <p className="mb-6 text-muted-foreground">
              Sorry, we couldn't find the page you're looking for. The page may have been moved,
              deleted, or never existed.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/">
                <Button className="w-full sm:w-auto">
                  <IconHome className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </Link>
              <Button variant="outline" onClick={() => window.history.back()} className="w-full sm:w-auto">
                <IconArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>

            {/* Help Text */}
            <div className="mt-6 rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                If you believe this is an error, please contact support at{" "}
                <a href="mailto:support@prodrones.com" className="text-primary hover:underline">
                  support@prodrones.com
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
