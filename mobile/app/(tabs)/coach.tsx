import { Text } from "react-native";
import { Screen } from "@/src/components";
import { styles } from "@/src/theme";

export default function CoachScreen() {
  return <Screen>
    <Text style={styles.eyebrow}>NOURIVA COACH</Text>
    <Text style={styles.title}>AI Coach — Coming Soon</Text>
    <Text style={styles.body}>AI-powered coaching is not available yet. Your other Nouriva features remain ready to use.</Text>
  </Screen>;
}
