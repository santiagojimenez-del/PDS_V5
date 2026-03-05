"use server";

import { cookies } from "next/headers";
import type { Locale } from "@/lib/i18n";

export async function setLocaleAction(locale: Locale) {
  (await cookies()).set("pds-locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
