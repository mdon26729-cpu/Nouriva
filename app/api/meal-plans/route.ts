import { NextResponse } from "next/server";
import { requireUser, apiError } from "@/lib/server-auth";
import type { Food, MealPlan, MealType, PlannedMeal, PlannedMealItemType, Recipe } from "@/types";
import { seedData } from "@/seed/data";

export const dynamic = "force-dynamic";

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const itemTypes: PlannedMealItemType[] = ["food", "recipe"];
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !datePattern.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime());
}

function validWeek(value: unknown): value is string {
  return validDate(value) && new Date(`${value}T00:00:00.000Z`).getUTCDay() === 1;
}

function weekDates(weekStart: string) {
  const start = new Date(`${weekStart}T00:00:00.000Z`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

function nutrition(item: Food | Recipe, servings: number) {
  return {
    calories: Math.round(item.calories * servings),
    protein: Math.round(item.protein * servings * 10) / 10,
    carbohydrates: Math.round(item.carbohydrates * servings * 10) / 10,
    fat: Math.round(item.fat * servings * 10) / 10,
    fiber: Math.round(item.fiber * servings * 10) / 10,
  };
}

export async function GET(request: Request) {
  try {
    const { userId, db } = await requireUser();
    const weekStart = new URL(request.url).searchParams.get("weekStart");
    if (!validWeek(weekStart)) return NextResponse.json({ message: "Use a Monday date in YYYY-MM-DD format." }, { status: 400 });
    const snapshot = await db.collection("users").doc(userId).collection("mealPlans").doc(weekStart).get();
    if (!snapshot.exists) return NextResponse.json({ id: weekStart, weekStart, meals: [] });
    return NextResponse.json({ id: snapshot.id, ...snapshot.data() });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId, db } = await requireUser();
    const body = await request.json() as { weekStart?: unknown; meals?: unknown };
    if (!validWeek(body.weekStart) || !Array.isArray(body.meals) || body.meals.length > 28) {
      return NextResponse.json({ message: "A Monday week start and valid meal list are required." }, { status: 400 });
    }
    const dates = new Set(weekDates(body.weekStart));
    const [foodSnapshot, recipeSnapshot] = await Promise.all([
      db.collection("foods").get(),
      db.collection("recipes").get(),
    ]);
    const foods = new Map((foodSnapshot.empty ? seedData.foods : foodSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Food)).map((food) => [food.id, food]));
    const recipes = new Map((recipeSnapshot.empty ? seedData.recipes : recipeSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Recipe)).map((recipe) => [recipe.id, recipe]));
    const meals: PlannedMeal[] = [];
    const slots = new Set<string>();
    for (const raw of body.meals) {
      if (!raw || typeof raw !== "object") return NextResponse.json({ message: "Meal entries are invalid." }, { status: 400 });
      const entry = raw as Record<string, unknown>;
      const date = entry.date;
      const mealType = entry.mealType;
      const itemType = entry.itemType;
      const itemId = entry.itemId;
      const servings = typeof entry.servings === "number" ? entry.servings : Number(entry.servings);
      if (!validDate(date) || !dates.has(date) || typeof mealType !== "string" || !mealTypes.includes(mealType as MealType)
        || typeof itemType !== "string" || !itemTypes.includes(itemType as PlannedMealItemType) || typeof itemId !== "string"
        || !Number.isFinite(servings) || servings < 0.25 || servings > 20) {
        return NextResponse.json({ message: "Meal entries are invalid." }, { status: 400 });
      }
      const slot = `${date}:${mealType}`;
      if (slots.has(slot)) return NextResponse.json({ message: "Only one meal can be planned per slot." }, { status: 400 });
      slots.add(slot);
      const item = itemType === "food" ? foods.get(itemId) : recipes.get(itemId);
      if (!item) return NextResponse.json({ message: "A selected food or recipe was not found." }, { status: 400 });
      meals.push({
        id: slot,
        date,
        mealType: mealType as MealType,
        itemType: itemType as PlannedMealItemType,
        itemId,
        itemName: item.name,
        servings,
        ...nutrition(item, servings),
      });
    }
    const now = new Date().toISOString();
    const ref = db.collection("users").doc(userId).collection("mealPlans").doc(body.weekStart);
    const existing = await ref.get();
    const plan: MealPlan = { id: body.weekStart, weekStart: body.weekStart, meals, createdAt: existing.data()?.createdAt ?? now, updatedAt: now };
    await ref.set(plan);
    return NextResponse.json(plan);
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId, db } = await requireUser();
    const params = new URL(request.url).searchParams;
    const weekStart = params.get("weekStart");
    const mealId = params.get("mealId");
    if (!validWeek(weekStart) || !mealId || !/^\d{4}-\d{2}-\d{2}:(breakfast|lunch|dinner|snack)$/.test(mealId)) {
      return NextResponse.json({ message: "A valid week and meal are required." }, { status: 400 });
    }
    const ref = db.collection("users").doc(userId).collection("mealPlans").doc(weekStart);
    const snapshot = await ref.get();
    if (!snapshot.exists) return NextResponse.json({ message: "Meal plan not found." }, { status: 404 });
    const data = snapshot.data() as MealPlan;
    const meals = data.meals.filter((meal) => meal.id !== mealId);
    await ref.set({ ...data, meals, updatedAt: new Date().toISOString() });
    return NextResponse.json({ ...data, meals });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
}
