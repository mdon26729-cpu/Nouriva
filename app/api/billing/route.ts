import { comingSoonResponse } from "@/lib/coming-soon";

export const dynamic = "force-dynamic";

export function GET() {
  return comingSoonResponse("Subscriptions");
}

export function POST() {
  return comingSoonResponse("Subscriptions");
}
