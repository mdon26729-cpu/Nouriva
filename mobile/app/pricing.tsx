import { Text } from "react-native";
import { BackButton, Screen } from "@/src/components";
import { styles } from "@/src/theme";

export default function PricingScreen() {
  return <Screen contentStyle={styles.pricingContent}>
    <BackButton />
    <Text style={styles.eyebrow}>NOURIVA PLANS</Text>
    <Text style={styles.title}>Subscriptions — Coming Soon</Text>
    <Text style={styles.body}>All current Nouriva features are available to you. Subscription plans are coming soon.</Text>
  </Screen>;
}
