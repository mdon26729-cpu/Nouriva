import { NextResponse } from "next/server";
import { requireUser, apiError } from "@/lib/server-auth";
import { seedData } from "@/seed/data";

export async function GET() {
  try {
    const { userId, db } = await requireUser();
    const snapshot = await db.collection("users").doc(userId).get();
    const profile = snapshot.exists ? snapshot.data() : { completedOnboarding: false };
    return NextResponse.json(profile);
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, db } = await requireUser();
    const existingProfile = await db.collection("users").doc(userId).get();
    const body = await request.json();
    const age = Number(body.age);
    const height = Number(body.height);
    const weight = Number(body.weight);
    const allowedGenders = ["Female", "Male", "Non-binary", "Prefer not to say"];
    const allowedActivities = ["sedentary", "light", "moderate", "high"];
    const allowedPreferences = ["none", "vegetarian", "vegan", "halal"];
    const allowedGoals = ["goal_weight_loss", "goal_weight_maintenance", "goal_weight_gain", "goal_fat_burn", "goal_muscle_gain", "goal_high_protein", "goal_high_fiber", "goal_balanced_nutrition"];
    const goalExists = allowedGoals.includes(body.goalId) && seedData.nutritionGoals.some((goal) => goal.id === body.goalId);
    if (
      typeof body.name !== "string" ||
      body.name.trim().length < 2 ||
      !Number.isInteger(age) ||
      age < 13 ||
      age > 120 ||
      !Number.isFinite(height) ||
      height < 50 ||
      height > 250 ||
      !Number.isFinite(weight) ||
      weight < 20 ||
      weight > 500 ||
      !allowedGenders.includes(body.gender) ||
      !allowedActivities.includes(body.activityLevel) ||
      !goalExists ||
      !allowedPreferences.includes(body.dietaryPreference) ||
      body.completedOnboarding !== true
    ) {
      return NextResponse.json({ message: "Please complete all required onboarding fields with valid values." }, { status: 400 });
    }
    const allergies = Array.isArray(body.allergies)
      ? body.allergies.filter((item: unknown): item is string => typeof item === "string").map((item: string) => item.trim()).filter(Boolean).slice(0, 20)
      : [];
    const profile = {
      name: body.name.trim().slice(0, 100),
      age,
      gender: body.gender,
      height,
      weight,
      goalId: typeof body.goalId === "string" ? body.goalId : "goal_balanced_nutrition",
      dietaryPreference: body.dietaryPreference,
      dietaryPreferences: [body.dietaryPreference],
      allergies,
      activityLevel: body.activityLevel,
      completedOnboarding: true,
      updatedAt: new Date().toISOString(),
    };
    await db.collection("users").doc(userId).set({ ...profile, userId, ...(existingProfile.exists ? {} : { createdAt: new Date().toISOString() }) }, { merge: true });
    return NextResponse.json(profile);
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
}
