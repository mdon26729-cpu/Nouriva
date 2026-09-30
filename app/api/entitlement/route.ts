import { comingSoonResponse } from "@/lib/coming-soon";

export function GET() {
  return comingSoonResponse("Subscriptions");
}
