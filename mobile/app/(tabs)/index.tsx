import { Link } from "expo-router";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import { useEffect, useState } from "react";
import { Card, EmptyState, Screen } from "@/src/components";
import { colors, styles } from "@/src/theme";
import { useApi } from "@/src/hooks";
import type { FoodLog, Workout } from "@/src/types";

type Profile = { name?: string; goalId?: string; dietaryPreference?: string; activityLevel?: string; height?: number; weight?: number };
type WorkoutData = { workouts: Workout[] };

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

const label = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).replaceAll("_", " ");
const mealOrder = ["breakfast", "lunch", "dinner", "snack"];

export default function DashboardScreen() {
  const { user } = useUser();
  const [greetingPeriod, setGreetingPeriod] = useState<"Morning" | "Afternoon" | "Evening">("Morning");
  const logs = useApi<FoodLog[]>("/api/logs");
  const { data: profile } = useApi<Profile>("/api/profile");
  const { data: workoutData } = useApi<WorkoutData>("/api/workouts");

  useEffect(() => {
    const updateGreeting = () => setGreetingPeriod(getGreetingPeriod());
    updateGreeting();
    const intervalId = setInterval(updateGreeting, 60_000);
    return () => clearInterval(intervalId);
  }, []);

  const totals = (logs.data ?? []).reduce((sum, log) => ({
    calories: sum.calories + log.calories,
    protein: sum.protein + log.protein,
    carbohydrates: sum.carbohydrates + log.carbohydrates,
    fat: sum.fat + log.fat,
    fiber: sum.fiber + log.fiber,
  }), { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 });
  const today = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date());
  const grouped = mealOrder.map((mealType) => ({ mealType, logs: (logs.data ?? []).filter((log) => log.mealType === mealType) })).filter((group) => group.logs.length > 0);
  const goalName = profile?.goalId?.replace(/^goal_/, "") ?? "";
  const userName = user?.username?.trim() || profile?.name?.trim() || user?.firstName?.trim() || "there";

  return <Screen>
    <View style={styles.screenHeader}><View><Text style={styles.eyebrow}>{today}</Text><Text style={styles.title}>Good {greetingPeriod}, {userName}!</Text></View><Link href="/log" style={styles.headerAction}>+ Log a meal</Link></View>
    <Text style={styles.body}>A clear, kind view of your nourishment today.</Text>
    {logs.loading && <EmptyState title="Loading your day..." body="Fetching your latest nutrition activity." />}
    {!!logs.error && <View><Text style={styles.error}>{logs.error}</Text><Text onPress={logs.refresh} style={styles.link}>Try again</Text></View>}
    {!logs.loading && !logs.error && <>
      <View style={styles.metricGrid}>{[["Calories", totals.calories, "kcal"], ["Protein", totals.protein, "g"], ["Carbohydrates", totals.carbohydrates, "g"], ["Fat", totals.fat, "g"], ["Fiber", totals.fiber, "g"]].map(([metricLabel, value, unit]) => <Card key={String(metricLabel)} style={styles.metricCard}><Text style={styles.caption}>{metricLabel}</Text><Text style={styles.metric}>{Math.round(Number(value))}</Text><Text style={styles.caption}>{unit} · logged foods</Text></Card>)}</View>
      <Card><Text style={styles.sectionTitle}>Quick actions</Text><View style={styles.quickActions}><Link href="/log" style={styles.quickAction}><Text style={styles.actionText}>Log food →</Text><Text style={styles.caption}>Add something you ate</Text></Link><Link href="/(tabs)/foods" style={styles.quickAction}><Text style={styles.actionText}>Browse foods →</Text><Text style={styles.caption}>Explore the library</Text></Link><Link href="/(tabs)/planner" style={styles.quickAction}><Text style={styles.actionText}>Meal planner →</Text><Text style={styles.caption}>Plan your next meals</Text></Link><Link href="/(tabs)/coach" style={styles.quickAction}><Text style={styles.actionText}>AI coach →</Text><Text style={styles.caption}>Ask a nutrition question</Text></Link></View></Card>
      <View style={styles.dashboardTwo}><Card style={styles.dashboardHalf}><Text style={styles.sectionTitle}>Daily goal progress</Text>{goalName ? <><Text style={styles.body}>Your current focus is <Text style={styles.strong}>{label(goalName)}</Text>.</Text><View style={styles.goalUnavailable}><Text style={styles.caption}>This goal does not include a numeric calorie or protein target yet. Nouriva will show progress here when a personalized target is available.</Text></View></> : <Text style={styles.body}>Set your nutrition goal in your profile to see personalized progress.</Text>}</Card><Card style={styles.dashboardHalf}><Text style={styles.sectionTitle}>Wellness snapshot</Text><Text style={styles.snapshotLabel}>Goal<Text style={styles.snapshotValue}>{goalName ? label(goalName) : "Not set"}</Text></Text><Text style={styles.snapshotLabel}>Preference<Text style={styles.snapshotValue}>{label(profile?.dietaryPreference ?? "Not set")}</Text></Text><Text style={styles.snapshotLabel}>Activity<Text style={styles.snapshotValue}>{label(profile?.activityLevel ?? "Not set")}</Text></Text><Text style={styles.snapshotLabel}>Measurements<Text style={styles.snapshotValue}>{profile?.height ? `${profile.height} cm` : "Not set"}{profile?.weight ? ` · ${profile.weight} kg` : ""}</Text></Text></Card></View>
      <View style={styles.dashboardTwo}><Card style={styles.dashboardHalf}><Text style={styles.sectionTitle}>Today&apos;s meals</Text>{grouped.length === 0 ? <Text style={styles.body}>No meals logged yet. <Link href="/log" style={styles.link}>Log your first food →</Link></Text> : grouped.map((group) => <View key={group.mealType} style={styles.mealGroup}><Text style={styles.mealHeading}>{label(group.mealType)}</Text>{group.logs.map((log) => <View key={log.id} style={styles.mealRow}><Text style={styles.body}>{log.foodName} · {log.servings} serving</Text><Text style={styles.caption}>{Math.round(log.calories)} kcal</Text></View>)}</View>)}</Card><Card style={styles.dashboardHalf}><Text style={styles.sectionTitle}>Recent activity</Text>{logs.data?.length ? logs.data.slice(0, 5).map((log) => <View key={log.id} style={styles.mealRow}><Text style={styles.body}>{log.foodName}</Text><Text style={styles.caption}>{Math.round(log.calories)} kcal</Text></View>) : <Text style={styles.body}>Your logged foods will appear here.</Text>}</Card></View>
      {workoutData?.workouts[0] && <Card style={styles.todayWorkout}><Text style={styles.eyebrow}>TODAY&apos;S WORKOUT</Text><Text style={styles.sectionTitle}>{workoutData.workouts[0].name}</Text><Text style={styles.caption}>{workoutData.workouts[0].duration} min · {workoutData.workouts[0].difficulty} · {workoutData.workouts[0].exercises.length} exercises</Text><Link href={{ pathname: "/workout/[id]", params: { id: workoutData.workouts[0].id } }} style={styles.link}>Start workout →</Link></Card>}
    </>}
    <Text style={styles.sectionTitle}>More from Nouriva</Text><View style={styles.stack}><Link href="/grocery" style={styles.action}>Open grocery list →</Link><Link href="/reports" style={styles.action}>View nutrition report →</Link></View>
    </Screen>;
}
