import { NextResponse } from "next/server";

export function comingSoonResponse(feature: "AI Coach" | "Subscriptions") {
  const message = feature === "AI Coach" ? "AI Coach is coming soon." : "Subscriptions are coming soon.";
  return NextResponse.json({ message }, { status: 503 });
}
