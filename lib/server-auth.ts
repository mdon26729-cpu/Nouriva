import { auth } from "@clerk/nextjs/server";
import { getAdminFirestore } from "@/lib/firebase-admin-core";

export async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHORIZED");
  const db = getAdminFirestore();
  return { userId, db };
}

export function apiError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return { status: 401, message: "Sign in to continue." };
  }
  if (error instanceof Error && error.message.startsWith("Missing Firebase Admin")) {
    return { status: 503, message: "Firebase Admin is not configured. Add server credentials to use this feature." };
  }
  return { status: 500, message: "Something went wrong. Please try again." };
}
