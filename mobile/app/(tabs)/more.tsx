import { Link } from "expo-router";
import { Text, View } from "react-native";
import { Screen } from "@/src/components";
import { styles } from "@/src/theme";

const links = [
  ["Overview", "/(tabs)"],
  ["Workout", "/(tabs)/workout"],
  ["Food library", "/(tabs)/foods"],
  ["Log a meal", "/log"],
  ["Meal planner", "/(tabs)/planner"],
  ["Progress", "/progress"],
  ["Grocery list", "/grocery"],
  ["Reports", "/reports"],
  ["AI coach", "/(tabs)/coach"],
  ["Subscriptions — Coming Soon", "/pricing"],
  ["Preferences", "/onboarding"],
  ["Your account", "/settings"],
] as const;
export default function MoreScreen() {
  return <Screen><Text style={styles.eyebrow}>YOUR NOURIVA SPACE</Text><Text style={styles.title}>Nouriva menu.</Text><View style={styles.stack}>{links.map(([label, href]) => <Link key={href} href={href} style={styles.action}>{label} →</Link>)}</View></Screen>;
}
