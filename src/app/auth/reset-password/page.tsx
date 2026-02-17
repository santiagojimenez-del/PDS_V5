"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { resetPasswordSchema, type ResetPasswordInput } from "@/modules/auth/schemas/auth-schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useTheme } from "@/components/providers/theme-provider";
import { IconSun, IconMoon, IconDeviceDesktop } from "@tabler/icons-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      toast.error("Invalid reset link");
      router.push("/auth/forgot-password");
    } else {
      setToken(tokenParam);
    }
  }, [searchParams, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: token || "",
    },
  });

  const password = watch("password");

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      toast.error("Invalid reset token");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          token,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        if (result.error?.includes("expired") || result.error?.includes("Invalid")) {
          toast.error("This reset link has expired or is invalid");
          setTimeout(() => {
            router.push("/auth/forgot-password");
          }, 2000);
        } else {
          toast.error(result.error || "Password reset failed");
        }
        return;
      }

      toast.success("Password reset successful! Redirecting...");
      setTimeout(() => {
        router.push("/auth/login");
        router.refresh();
      }, 1000);
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null; // Will redirect
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Theme selector */}
      <div className="absolute right-4 top-4 flex items-center gap-0.5 rounded-lg border bg-card p-1">
        {([
          { value: "light", icon: IconSun },
          { value: "dark", icon: IconMoon },
          { value: "system", icon: IconDeviceDesktop },
        ] as const).map(({ value, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`rounded-md p-1.5 transition-colors ${
              theme === value
                ? "bg-[#ff6600] text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title={value.charAt(0).toUpperCase() + value.slice(1)}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      <Card className="w-full max-w-md border shadow-sm">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="mx-auto flex items-center justify-center">
            <Image
              src="/img/PDSLogo1-xsm.png.png"
              alt="Professional Drone Solutions"
              width={200}
              height={60}
              className="h-14 w-auto dark:hidden"
              priority
            />
            <Image
              src="/img/PDSLogo2.png"
              alt="Professional Drone Solutions"
              width={200}
              height={60}
              className="hidden h-14 w-auto dark:block"
              priority
            />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Reset password</h1>
            <CardDescription>Enter your new password below</CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                {...register("password")}
                autoComplete="new-password"
                className="h-10"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                {...register("confirmPassword")}
                autoComplete="new-password"
                className="h-10"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              className="h-10 w-full bg-[#ff6600] text-white hover:bg-[#e55c00] font-medium"
              disabled={loading}
            >
              {loading ? "Resetting password..." : "Reset password"}
            </Button>
            <Link
              href="/auth/forgot-password"
              className="text-sm text-muted-foreground transition-colors hover:text-[#ff6600]"
            >
              Request a new reset link
            </Link>
          </CardFooter>
        </form>
      </Card>

      {/* Footer text */}
      <p className="absolute bottom-4 text-xs text-muted-foreground/50">
        Professional Drone Solutions &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
