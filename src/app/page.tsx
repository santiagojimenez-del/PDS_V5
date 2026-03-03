import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ROUTES, ROLES } from "@/lib/constants";

export default async function RootPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // Redirect to the appropriate portal based on user's primary role
  if (user.roles.includes(ROLES.CLIENT)) {
    redirect(ROUTES.CLIENT_HOME);
  } else {
    // Admin, Staff, Pilot, Manager, Developer → hub
    redirect(ROUTES.HUB_HOME);
  }
}
