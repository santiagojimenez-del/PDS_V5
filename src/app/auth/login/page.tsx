"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { loginSchema, type LoginInput } from "@/modules/auth/schemas/auth-schemas";
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
import { TwoFactorModal } from "@/modules/auth/components/two-factor-modal";
import { useTheme } from "@/components/providers/theme-provider";
import { IconSun, IconMoon, IconDeviceDesktop } from "@tabler/icons-react";

export default function LoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Login failed");
        return;
      }

      if (result.requires2FA) {
        setVerificationToken(result.verificationToken);
        setShow2FA(true);
        toast.info("A verification code has been sent to your email");
        return;
      }

      toast.success("Login successful");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handle2FASuccess = () => {
    toast.success("Login successful");
    router.push("/");
    router.refresh();
  };

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
            <h1 className="text-xl font-bold tracking-tight">Welcome back</h1>
            <CardDescription>Sign in to your ProDrones account</CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@prodrones.com"
                {...register("email")}
                autoComplete="email"
                className="h-10"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register("password")}
                autoComplete="current-password"
                className="h-10"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              className="h-10 w-full bg-[#ff6600] text-white hover:bg-[#e55c00] font-medium"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground transition-colors hover:text-[#ff6600]"
            >
              Forgot your password?
            </Link>
          </CardFooter>
        </form>
      </Card>

      {/* Footer text */}
      <p className="absolute bottom-4 text-xs text-muted-foreground/50">
        Professional Drone Solutions &copy; {new Date().getFullYear()}
      </p>

      <TwoFactorModal
        open={show2FA}
        onClose={() => setShow2FA(false)}
        verificationToken={verificationToken}
        onSuccess={handle2FASuccess}
      />
    </div>
  );
}
