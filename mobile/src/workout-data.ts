import type { Exercise, Workout, WorkoutProfile } from "@/src/types";

export type WeeklyPlan = { day: string; label: string; workoutId?: string; duration?: number };
export type Data = { exercises: Exercise[]; workouts: Workout[]; weeklyPlan: WeeklyPlan[]; completedDates: string[]; profile?: WorkoutProfile };