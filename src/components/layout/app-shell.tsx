import { getCurrentUser } from "@/lib/auth/session";
import { getNavigation } from "@/modules/permissions/services/permissions-service";
import { getConfigValue } from "@/modules/config/services/config-loader";
import { redirect } from "next/navigation";
import { AppShellClient } from "./app-shell-client";

interface AppShellProps {
  app: string;
  children: React.ReactNode;
}

export async function AppShell({ app, children }: AppShellProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [navigation, siteTitle, siteLogo] = await Promise.all([
    getNavigation(user, app),
    getConfigValue<string>(app, "site_title"),
    getConfigValue<string>(app, "site_logo"),
  ]);

  return (
    <AppShellClient
      navigation={navigation}
      siteTitle={siteTitle || "ProDrones"}
      siteLogo={siteLogo || ""}
      app={app}
      user={user}
    >
      {children}
    </AppShellClient>
  );
}
