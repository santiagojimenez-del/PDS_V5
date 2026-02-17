"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { KeyboardShortcuts } from "@/components/shared/keyboard-shortcuts";
import type { NavGroup } from "@/modules/permissions/types";
import type { AuthUser } from "@/modules/auth/types";

interface AppShellClientProps {
  navigation: NavGroup[];
  siteTitle: string;
  siteLogo: string;
  app: string;
  user: AuthUser;
  children: React.ReactNode;
}

export function AppShellClient({
  navigation,
  siteTitle,
  siteLogo,
  app,
  user,
  children,
}: AppShellClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar
          navigation={navigation}
          siteTitle={siteTitle}
          siteLogo={siteLogo}
          app={app}
          user={user}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Navbar
            user={user}
            siteTitle={siteTitle}
            onMobileMenuToggle={() => setMobileOpen(!mobileOpen)}
          />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        </div>
      </div>

      {/* Global keyboard shortcuts */}
      <KeyboardShortcuts />
    </>
  );
}
