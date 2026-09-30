import { comingSoonResponse } from "@/lib/coming-soon";

export const runtime = "nodejs";

export function POST() {
  return comingSoonResponse("Subscriptions");
}
