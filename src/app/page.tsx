import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Redirect to the appropriate app based on user's primary role
  if (user.roles.includes(1)) {
    // Client role → client portal
    redirect("/sites");
  } else if (user.roles.includes(0)) {
    // Admin → hub home (admins can access everything)
    redirect("/workflow/jobs");
  } else {
    // Staff, Pilot, Manager → hub home
    redirect("/workflow/jobs");
  }
}
