"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/modules/auth/schemas/auth-schemas";
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
import { useTranslation } from "@/lib/i18n/locale-provider";
import { LanguageSelector } from "@/components/shared/language-selector";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok && res.status === 429) {
        toast.error(result.error || "Too many requests. Please try again later.");
        return;
      }

      // Always show success message
      setSubmitted(true);
      toast.success("Password reset instructions sent");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Theme + language selectors */}
      <div className="absolute right-4 top-4 flex items-center gap-1">
        <LanguageSelector />
        <div className="flex items-center gap-0.5 rounded-lg border bg-card p-1">
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
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={t(`theme.${value}`)}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
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
            <h1 className="text-xl font-bold tracking-tight">{t("auth.forgotPassword.title")}</h1>
            <CardDescription>
              {submitted
                ? t("auth.forgotPassword.success")
                : t("auth.forgotPassword.description")}
            </CardDescription>
          </div>
        </CardHeader>

        {!submitted ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.forgotPassword.email")}</Label>
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
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                className="h-10 w-full bg-primary text-white hover:bg-primary/90 font-medium"
                disabled={loading}
              >
                {loading ? t("auth.forgotPassword.submitting") : t("auth.forgotPassword.submit")}
              </Button>
              <Link
                href="/auth/login"
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                {t("auth.forgotPassword.backToLogin")}
              </Link>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="space-y-4 pb-6">
            <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
              <p className="mb-2">
                {t("auth.forgotPassword.successBody")}
              </p>
              <p className="text-xs">
                {t("auth.forgotPassword.redirecting")}
              </p>
            </div>
            <Link
              href="/auth/login"
              className="block text-center text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {t("auth.forgotPassword.returnNow")}
            </Link>
          </CardContent>
        )}
      </Card>

      {/* Footer text */}
      <p className="absolute bottom-4 text-xs text-muted-foreground/50">
        Professional Drone Solutions &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
}
