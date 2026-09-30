import { NextResponse } from "next/server";
import { requireUser, apiError } from "@/lib/server-auth";
import { nutritionTotals } from "@/lib/nutrition";
import type { FoodLog, WeightLog } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { userId, db } = await requireUser();
    const raw = new URL(request.url).searchParams.get("days");
    const days = raw === "30" ? 30 : raw === "1" ? 1 : 7;
    const since = new Date(); since.setUTCHours(0, 0, 0, 0); since.setUTCDate(since.getUTCDate() - (days - 1));
    const ref = db.collection("users").doc(userId);
    const [logsSnapshot, weightsSnapshot] = await Promise.all([
      ref.collection("foodLogs").where("loggedAt", ">=", since.toISOString()).orderBy("loggedAt", "asc").get(),
      ref.collection("weightLogs").orderBy("loggedAt", "asc").get(),
    ]);
    const logs = logsSnapshot.docs.map((doc) => doc.data() as FoodLog);
    const totals = nutritionTotals(logs);
    const daily = Array.from({ length: days }, (_, index) => {
      const date = new Date(since); date.setUTCDate(since.getUTCDate() + index);
      const dateKey = date.toISOString().slice(0, 10);
      const dayLogs = logs.filter((log) => log.loggedAt.slice(0, 10) === dateKey);
      return { date: dateKey, ...nutritionTotals(dayLogs), meals: dayLogs.length };
    });
    const weights = weightsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as WeightLog);
    return NextResponse.json({ range: days, days: daily, totals, meals: logs.length, weights });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
}
