import { Redirect, router } from "expo-router";
import { useAuth } from "@clerk/expo";
import Svg, { Circle } from "react-native-svg";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { apiRequest } from "@/src/services/api";
import { Button, Screen } from "@/src/components";
import { colors, styles } from "@/src/theme";

export default function Index() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [destination, setDestination] = useState<"/onboarding" | "/(tabs)" | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const profileRequestStarted = useRef(false);
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { profileRequestStarted.current = false; setDestination(null); setProfileLoading(false); return; }
    if (profileRequestStarted.current) return;
    profileRequestStarted.current = true;
    let cancelled = false;
    async function loadProfile() {
      setProfileLoading(true);
      try {
        const token = await getTokenRef.current();
        const profile = await apiRequest<{ completedOnboarding?: boolean }>("/api/profile", { token });
        if (!cancelled) setDestination(profile.completedOnboarding ? "/(tabs)" : "/onboarding");
      } catch (error) {
        if (!cancelled) {
          console.warn("Profile bootstrap failed:", error);
          setDestination("/onboarding");
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }
    void loadProfile();
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn]);
  if (!isLoaded) return <View style={styles.loadingScreen}><ActivityIndicator size="large" color={colors.green} /><Text style={styles.loadingText}>Connecting to Clerk...</Text></View>;
  if (isSignedIn && (profileLoading || !destination)) return <View style={styles.loadingScreen}><ActivityIndicator size="large" color={colors.green} /><Text style={styles.loadingText}>Loading your profile...</Text></View>;
  if (!isSignedIn) return <Screen contentStyle={{ paddingTop: 22, paddingBottom: 48 }}>
    <View style={styles.authHeader}>
      <View style={styles.authBrand}><View style={styles.authMark}><Text style={styles.authMarkText}>N</Text></View><Text style={styles.authBrandText}>nouriva</Text></View>
      <Text style={styles.authNav}>Nutrition that fits your life</Text>
    </View>
    <View style={styles.authHero}>
      <View style={styles.authOrb} />
      <Text style={styles.eyebrow}>✦ NUTRITION THAT FITS YOUR LIFE</Text>
      <Text style={styles.heroTitle}>Feel good in your <Text style={{ color: colors.coral, fontStyle: "italic" }}>everyday.</Text></Text>
      <Text style={styles.body}>Small, sustainable choices for meals, movement, and a nourishing rhythm—without the noise.</Text>
      <View style={styles.authPreview}>
        <Text style={styles.authPreviewHeader}>Tuesday · On track</Text>
        <Text style={styles.authPreviewTitle}>Your nourishment today</Text>
        <View style={styles.authRing}><Svg width="110" height="110" viewBox="0 0 110 110" style={styles.authRingSvg}><Circle cx="55" cy="55" r="43" fill="none" stroke={colors.line} strokeWidth="12" /><Circle cx="55" cy="55" r="43" fill="none" stroke={colors.green} strokeWidth="12" strokeLinecap="round" strokeDasharray="270.18" strokeDashoffset="75.65" transform="rotate(-90 55 55)" /></Svg><Text style={styles.authRingNumber}>72</Text><Text style={styles.authRingLabel}>% balanced</Text></View>
        <Text style={styles.caption}>Protein 86g / 110g   ·   Fiber 19g / 28g   ·   Water 5 / 8 cups</Text>
      </View>
    </View>
    <View style={{ marginTop: 4 }}>
      <Button label="Sign In" onPress={() => router.push("/auth")} />
      <Button label="Get started" variant="secondary" onPress={() => router.push("/auth")} />
    </View>
    <Text style={[styles.caption, { textAlign: "center", marginTop: 4 }]}>Gentle guidance for everyday wellbeing.</Text>
  </Screen>;
  return <Redirect href={destination ?? "/onboarding"} />;
}
