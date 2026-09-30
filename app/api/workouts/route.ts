import { NextResponse } from "next/server";
import { requireUser, apiError } from "@/lib/server-auth";
import { seedData } from "@/seed/data";
import type { Exercise, Workout } from "@/types";
import { workoutCategories } from "@/seed/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { userId, db } = await requireUser();
    const params = new URL(request.url).searchParams;
    const type = params.get("type");
    const exercises = (seedData.exercises as Exercise[]).filter((item) => !type || item.category.toLowerCase() === type.toLowerCase() || item.goals.some((goal) => goal.toLowerCase() === type.toLowerCase()));
    const profile = (await db.collection("users").doc(userId).get()).data() ?? {};
    const goalId = typeof profile.goalId === "string" ? profile.goalId : "goal_balanced_nutrition";
    const beginnerProfile = profile.fitnessLevel === "beginner" || profile.activityLevel === "sedentary" || profile.activityLevel === "light";
    const homeProfile = profile.workoutPreference === "home" || profile.equipmentPreference === "home";
    const matching = (seedData.workouts as Workout[]).filter((item) => item.goalIds.includes(goalId));
    const workouts = (matching.length ? matching : seedData.workouts as Workout[])
      .filter((item) => !type || item.category.toLowerCase() === type.toLowerCase())
      .sort((a, b) => Number(beginnerProfile && b.difficulty === "beginner") - Number(beginnerProfile && a.difficulty === "beginner"));
    const weeklyPlan = [
      { day: "Monday", label: "Full Body", workoutId: workouts.find((item) => item.category === "Full Body")?.id ?? workouts[0]?.id },
      { day: "Tuesday", label: "Mobility / Recovery", workoutId: workouts.find((item) => item.category === "Mobility")?.id },
      { day: "Wednesday", label: "Lower Body", workoutId: workouts.find((item) => item.category === "Lower Body")?.id ?? workouts[0]?.id },
      { day: "Thursday", label: "Rest" },
      { day: "Friday", label: "Upper Body", workoutId: workouts.find((item) => item.category === "Upper Body")?.id ?? workouts[0]?.id },
      { day: "Saturday", label: "Cardio / Core", workoutId: workouts.find((item) => item.category === "Cardio")?.id ?? workouts[0]?.id },
      { day: "Sunday", label: "Recovery" },
    ];
    const recent = await db.collection("users").doc(userId).collection("workoutCompletions").limit(100).get();
    const completedDates = recent.docs
      .map((doc) => String(doc.data().completedAt ?? "").slice(0, 10))
      .filter(Boolean);
    const prioritizedExercises = [...exercises].sort((a, b) => {
      const beginnerOrder = Number(beginnerProfile && b.difficulty === "beginner") - Number(beginnerProfile && a.difficulty === "beginner");
      return beginnerOrder || (homeProfile ? Number(a.equipment.length > 0) - Number(b.equipment.length > 0) : 0);
    });
    return NextResponse.json({ exercises: prioritizedExercises, workouts, weeklyPlan, completedDates, workoutCategories, filterOptions: { difficulties: ["beginner", "intermediate", "advanced"], muscleGroups: Array.from(new Set(prioritizedExercises.flatMap((item) => item.muscleGroup.split(", ")))), equipment: Array.from(new Set(prioritizedExercises.flatMap((item) => item.equipment))) }, profile: { activityLevel: profile.activityLevel, fitnessLevel: profile.fitnessLevel, workoutPreference: profile.workoutPreference, equipmentPreference: profile.equipmentPreference } });
  } catch (error) { const result = apiError(error); return NextResponse.json({ message: result.message }, { status: result.status }); }
}
