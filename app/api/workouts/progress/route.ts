import { NextResponse } from "next/server";
import { requireUser, apiError } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId, db } = await requireUser();
    const snapshot = await db.collection("users").doc(userId).collection("workoutCompletions").limit(100).get();
    const workouts = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as { id: string; completedAt?: string; durationMinutes?: number; exercisesCompleted?: number; workoutName?: string })
      .sort((a, b) => String(b.completedAt ?? "").localeCompare(String(a.completedAt ?? ""))) as Array<{ id: string; completedAt?: string; durationMinutes?: number; exercisesCompleted?: number; workoutName?: string }>;
    const today = Date.now();
    const day = 86400000;
    const dates = new Set(workouts.map((item) => String(item.completedAt).slice(0, 10)));
    let streak = 0;
    for (let offset = 0; dates.has(new Date(today - offset * day).toISOString().slice(0, 10)); offset++) streak++;
    return NextResponse.json({ workouts, streak, totalMinutes: workouts.reduce((sum, item) => sum + Number(item.durationMinutes ?? 0), 0) });
  } catch (error) { const result = apiError(error); return NextResponse.json({ message: result.message }, { status: result.status }); }
}

export async function POST(request: Request) {
  try {
    const { userId, db } = await requireUser();
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.workoutId !== "string" || typeof body.workoutName !== "string") return NextResponse.json({ message: "A workout is required." }, { status: 400 });
    const completedAt = new Date().toISOString();
    const ref = db.collection("users").doc(userId).collection("workoutCompletions").doc();
    const record = { id: ref.id, workoutId: body.workoutId, workoutName: body.workoutName.slice(0, 120), durationMinutes: Math.max(0, Math.min(240, Number(body.durationMinutes) || 0)), exercisesCompleted: Math.max(0, Math.min(100, Number(body.exercisesCompleted) || 0)), completedAt };
    await ref.set(record);
    const recent = await db.collection("users").doc(userId).collection("workoutCompletions").limit(100).get();
    const dates = new Set(recent.docs.map((doc) => String(doc.data().completedAt).slice(0, 10)));
    let streak = 0;
    for (let offset = 0; dates.has(new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10)); offset++) streak += 1;
    return NextResponse.json({ ...record, workoutsCompleted: recent.size, streak, totalMinutes: recent.docs.reduce((sum, doc) => sum + Number(doc.data().durationMinutes ?? 0), 0) }, { status: 201 });
  } catch (error) { const result = apiError(error); return NextResponse.json({ message: result.message }, { status: result.status }); }
}
