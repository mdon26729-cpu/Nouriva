/* eslint-disable react/no-unescaped-entities */
"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { formatNumber, nutritionTotals } from "@/lib/nutrition";
import type { FoodLog } from "@/types";

type Profile = {
  name?: string;
  goalId?: string;
  dietaryPreference?: string;
  activityLevel?: string;
  height?: number;
  weight?: number;
};

const mealOrder = ["breakfast", "lunch", "dinner", "snack"];
const label = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function getGreetingPeriod(): "Morning" | "Afternoon" | "Evening" {
  const hourPart = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Karachi",
  }).formatToParts(new Date()).find((part) => part.type === "hour");
  if (!hourPart) throw new Error("Unable to determine the current hour in Asia/Karachi.");

  const hour = Number(hourPart.value);
  if (hour >= 17) return "Evening";
  if (hour < 12) return "Morning";
  return "Afternoon";
}

export default function DashboardPage() {
  const { user } = useUser();
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [greetingPeriod, setGreetingPeriod] = useState<"Morning" | "Afternoon" | "Evening">("Morning");
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const updateGreeting = () => setGreetingPeriod(getGreetingPeriod());
    updateGreeting();
    const intervalId = window.setInterval(updateGreeting, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const waterKey = `nouriva-water-${new Date().toISOString().slice(0, 10)}`;
    setWaterGlasses(Number(window.localStorage.getItem(waterKey) ?? 0));
    Promise.all([fetch("/api/logs"), fetch("/api/profile")])
      .then(async ([logsResponse, profileResponse]) => {
        if (!logsResponse.ok) throw new Error((await logsResponse.json()).message ?? "Unable to load today's logs.");
        if (!profileResponse.ok) throw new Error((await profileResponse.json()).message ?? "Unable to load your profile.");
        return [await logsResponse.json(), await profileResponse.json()] as [FoodLog[], Profile];
      })
      .then(([foodLogs, userProfile]) => { setLogs(foodLogs); setProfile(userProfile); })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load your dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const totals = nutritionTotals(logs);
  const grouped = useMemo(() => mealOrder.map((mealType) => ({ mealType, logs: logs.filter((log) => log.mealType === mealType) })), [logs]);
  const today = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date());
  const goalName = profile?.goalId?.replace(/^goal_/, "").replaceAll("_", " ") ?? "";
  const userName = user?.username?.trim() || profile?.name?.trim() || user?.firstName?.trim() || "there";
  function updateWater(value: number) {
    const next = Math.max(0, Math.min(8, value));
    setWaterGlasses(next);
    window.localStorage.setItem(`nouriva-water-${new Date().toISOString().slice(0, 10)}`, String(next));
  }

  return <div className="page-wrap">
    <div className="page-heading"><div><div className="eyebrow">{today}</div><h1>Good {greetingPeriod}, {userName}!</h1><p>A clear, kind view of your nourishment today.</p></div><Link href="/log" className="button button-primary">+ Log a meal</Link></div>
    {error && <div className="error-box" role="alert">{error}</div>}
    {loading ? <div className="app-card loading-state">Loading your dashboard…</div> : <>
      <div className="stats-grid">
        {([["Calories", `${totals.calories} kcal`], ["Protein", `${formatNumber(totals.protein)}g`], ["Carbohydrates", `${formatNumber(totals.carbohydrates)}g`], ["Fat", `${formatNumber(totals.fat)}g`], ["Fiber", `${formatNumber(totals.fiber)}g`]] as const).map(([name, value]) => <div className="app-card stat-card" key={name}><small>{name}</small><strong>{value}</strong><span>From today's logged foods</span></div>)}
      </div>
      <div className="app-card" style={{ marginTop: 20 }}><h2 className="section-title">Quick actions</h2><div className="quick-actions">{[["/log", "Log food", "Add something you ate"], ["/foods", "Browse foods", "Explore the library"], ["/planner", "Meal planner", "Plan your next meals"], ["/coach", "AI coach", "Ask a nutrition question"]].map(([href, title, description]) => <Link href={href} key={href}><b>{title} →</b><small>{description}</small></Link>)}</div></div>
      <div className="dashboard-two"><section className="app-card"><h2 className="section-title">Daily goal progress</h2>{profile?.goalId ? <><p className="page-copy">Your current focus is <strong>{label(goalName)}</strong>.</p><div className="goal-unavailable">This goal does not include a numeric calorie or protein target yet. Nouriva will show progress here when a personalized target is available.</div></> : <div className="goal-unavailable">Set your nutrition goal in your profile to see personalized progress.</div>}</section><section className="app-card"><h2 className="section-title">Wellness snapshot</h2>{profile ? <div className="dashboard-profile"><div><span>Goal</span><b>{label(goalName) || "Not set"}</b></div><div><span>Preference</span><b>{label(profile.dietaryPreference ?? "Not set")}</b></div><div><span>Activity</span><b>{label(profile.activityLevel ?? "Not set")}</b></div><div><span>Measurements</span><b>{profile.height ? `${profile.height} cm` : "Not set"}{profile.weight ? ` · ${profile.weight} kg` : ""}</b></div></div> : <div className="empty-state compact"><strong>Profile unavailable</strong><span>Complete your onboarding to personalize Nouriva.</span></div>}</section></div>
      <div className="dashboard-two"><section className="app-card"><h2 className="section-title">Today's meals</h2>{logs.length === 0 ? <div className="empty-state compact"><strong>No meals logged yet.</strong><span><Link href="/log" className="text-link">Log your first food →</Link></span></div> : <div className="dashboard-meal-groups">{grouped.filter((group) => group.logs.length).map((group) => <div className="dashboard-meal-group" key={group.mealType}><h3>{label(group.mealType)}</h3>{group.logs.map((log) => <div className="dashboard-meal-row" key={log.id}><span>{log.foodName} · {log.servings} serving</span><b>{log.calories} kcal</b></div>)}</div>)}</div>}</section><section className="app-card"><h2 className="section-title">Water today</h2><div className="water-tracker"><div className="water-tracker-heading"><span>Hydration goal</span><b>{waterGlasses}/8 glasses</b></div><div className="water-progress"><i style={{ width: `${waterGlasses / 8 * 100}%` }} /></div><div className="water-glasses">{Array.from({ length: 8 }, (_, index) => <button type="button" className={index < waterGlasses ? "filled" : ""} aria-label={`${index + 1} glass${index ? "es" : ""}`} aria-pressed={index < waterGlasses} key={index} onClick={() => updateWater(index < waterGlasses ? index : index + 1)}>🥛</button>)}</div><button type="button" className="text-link water-reset" onClick={() => updateWater(0)}>Reset today</button></div></section></div>
    </>}
  </div>;
}
