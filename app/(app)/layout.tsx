import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/server-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  let userId: string;
  let db: Awaited<ReturnType<typeof requireUser>>["db"];
  try {
    ({ userId, db } = await requireUser());
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Missing Firebase Admin")) {
      return <main className="auth-page"><section className="onboarding-card"><div className="eyebrow">Server setup needed</div><h1>Connect Nouriva&apos;s data store.</h1><p className="page-copy">The app is authenticated, but Firebase Admin credentials are missing from the server environment. Add the three FIREBASE_ADMIN_* values to <code>.env.local</code>, then restart the development server.</p><div className="error-box" role="alert">Required: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY.</div></section></main>;
    }
    throw error;
  }
  const profile = await db.collection("users").doc(userId).get();

  if (!profile.exists || profile.data()?.completedOnboarding !== true) {
    redirect("/onboarding");
  }

  return <AppShell>{children}</AppShell>;
}
