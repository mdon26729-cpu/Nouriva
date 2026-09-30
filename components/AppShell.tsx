"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import * as React from "react";
import { seedData } from "@/seed/data";

type ProfileForm = {
  name: string; age: string; gender: string; height: string; weight: string;
  activityLevel: string; goalId: string; dietaryPreference: string; allergies: string;
};

const navigation = [
  ["dashboard", "Overview", "⌂"],
  ["workouts", "Workout", "↗"],
  ["foods", "Food Library", "◌"],
  ["log", "Log a meal", "+"],
  ["planner", "Meal planner", "▦"],
  ["progress", "Progress", "↗"],
  ["grocery", "Grocery list", "□"],
  ["reports", "Reports", "◒"],
  ["coach", "AI Coach", "✦"],
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCoachPage = pathname === "/coach" || pathname.startsWith("/coach/");
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [profileLoading, setProfileLoading] = React.useState(false);
  const [profileSaving, setProfileSaving] = React.useState(false);
  const [profileError, setProfileError] = React.useState("");
  const [profileSuccess, setProfileSuccess] = React.useState("");
  const [profile, setProfile] = React.useState<ProfileForm>({ name: "", age: "", gender: "", height: "", weight: "", activityLevel: "moderate", goalId: "goal_balanced_nutrition", dietaryPreference: "none", allergies: "" });

  async function openProfile() {
    setProfileOpen(true); setProfileLoading(true); setProfileError(""); setProfileSuccess("");
    try {
      const response = await fetch("/api/profile");
      if (!response.ok) throw new Error((await response.json()).message ?? "Unable to load your profile.");
      const data = await response.json();
      setProfile({ name: data.name ?? "", age: data.age?.toString() ?? "", gender: data.gender ?? "", height: data.height?.toString() ?? "", weight: data.weight?.toString() ?? "", activityLevel: data.activityLevel ?? "moderate", goalId: data.goalId ?? "goal_balanced_nutrition", dietaryPreference: data.dietaryPreference ?? "none", allergies: Array.isArray(data.allergies) ? data.allergies.join(", ") : "" });
    } catch (error) { setProfileError(error instanceof Error ? error.message : "Unable to load your profile."); }
    finally { setProfileLoading(false); }
  }

  async function saveProfile() {
    const age = Number(profile.age); const height = Number(profile.height); const weight = Number(profile.weight);
    if (profile.name.trim().length < 2 || !Number.isInteger(age) || age < 13 || age > 120 || !Number.isFinite(height) || height < 50 || height > 250 || !Number.isFinite(weight) || weight < 20 || weight > 500 || !profile.gender || !profile.activityLevel || !profile.goalId) {
      setProfileError("Please complete your name, age, gender, height, weight, activity level, and nutrition goal."); return;
    }
    setProfileSaving(true); setProfileError("");
    try {
      const response = await fetch("/api/profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...profile, age, height, weight, allergies: profile.allergies.split(",").map((item) => item.trim()).filter(Boolean), completedOnboarding: true }) });
      if (!response.ok) throw new Error((await response.json()).message ?? "Unable to save your profile.");
      setProfileSuccess("Profile updated. Your coach will use these details going forward.");
    } catch (error) { setProfileError(error instanceof Error ? error.message : "Unable to save your profile."); }
    finally { setProfileSaving(false); }
  }

  function updateProfile(field: keyof ProfileForm, value: string) {
    setProfile((current) => ({ ...current, [field]: value })); setProfileError(""); setProfileSuccess("");
  }

  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!mobileNavOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileNavOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileNavOpen]);

  return <div className="app-layout">
    <aside id="mobile-navigation" className={`sidebar ${mobileNavOpen ? "mobile-open" : ""}`}>
      <Link href="/dashboard" className="brand"><span className="brand-mark">N</span> nouriva</Link>
      <p className="side-label">Your space</p>
      <nav>{navigation.map(([path, label, icon]) => <Link key={path} href={`/${path}`} className={pathname.startsWith(`/${path}`) ? "active" : ""} onClick={() => setMobileNavOpen(false)}><span>{icon}</span>{label}</Link>)}</nav>
      <div className="sidebar-bottom"><Link href="/pricing" className="upgrade-card" onClick={() => setMobileNavOpen(false)}><span>✦</span><b>Subscriptions</b><small>Coming Soon</small></Link><button type="button" className="profile-link" onClick={() => { setMobileNavOpen(false); void openProfile(); }}>⚙ <span>Edit Profile</span></button><div className="user-row"><UserButton afterSignOutUrl="/" /><span>Your account</span></div></div>
    </aside>
    {mobileNavOpen && <button type="button" className="mobile-nav-backdrop" aria-label="Close navigation menu" onClick={() => setMobileNavOpen(false)} />}
    <main className="app-main"><div className={`mobile-top${isCoachPage ? " coach-mobile-top" : ""}`}><button type="button" className="mobile-menu-button" aria-label="Open navigation menu" aria-expanded={mobileNavOpen} aria-controls="mobile-navigation" onClick={() => setMobileNavOpen(true)}><span /><span /><span /></button><Link href="/dashboard" className="brand"><span className="brand-mark">N</span> nouriva</Link>{!isCoachPage && <UserButton />}</div>{children}</main>
    {profileOpen && <div className="profile-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setProfileOpen(false); }}><section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title"><div className="profile-modal-header"><div><div className="eyebrow">Your preferences</div><h2 id="profile-title">Edit profile</h2></div><button type="button" className="modal-close" onClick={() => setProfileOpen(false)} aria-label="Close profile editor">×</button></div>{profileLoading ? <div className="loading-state">Loading your profile…</div> : <><p className="page-copy">Update your details and Nouriva will use them to personalize future coaching.</p>{profileError && <div className="error-box" role="alert">{profileError}</div>}{profileSuccess && <div className="toast" role="status">{profileSuccess}</div>}<div className="profile-form-grid">{(["name", "age", "height", "weight"] as const).map((field) => <div className="form-field" key={field}><label htmlFor={`profile-${field}`}>{field === "name" ? "Name" : field[0].toUpperCase() + field.slice(1) + (field === "height" ? " (cm)" : field === "weight" ? " (kg)" : "")}</label><input id={`profile-${field}`} className="input" type={field === "name" ? "text" : "number"} value={profile[field]} onChange={(event) => updateProfile(field, event.target.value)} /></div>)}<div className="form-field"><label htmlFor="profile-gender">Gender</label><select id="profile-gender" className="select" value={profile.gender} onChange={(event) => updateProfile("gender", event.target.value)}><option value="">Select</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option></select></div><div className="form-field"><label htmlFor="profile-activity">Activity level</label><select id="profile-activity" className="select" value={profile.activityLevel} onChange={(event) => updateProfile("activityLevel", event.target.value)}><option value="sedentary">Sedentary</option><option value="light">Light</option><option value="moderate">Moderate</option><option value="high">High</option></select></div><div className="form-field full"><label htmlFor="profile-goal">Nutrition goal</label><select id="profile-goal" className="select" value={profile.goalId} onChange={(event) => updateProfile("goalId", event.target.value)}>{seedData.nutritionGoals.map((goal) => <option key={goal.id} value={goal.id}>{goal.name}</option>)}</select></div><div className="form-field full"><label htmlFor="profile-diet">Dietary preference</label><select id="profile-diet" className="select" value={profile.dietaryPreference} onChange={(event) => updateProfile("dietaryPreference", event.target.value)}><option value="none">No preference</option><option value="vegetarian">Vegetarian</option><option value="vegan">Vegan</option><option value="halal">Halal</option></select></div><div className="form-field full"><label htmlFor="profile-allergies">Allergies or intolerances</label><input id="profile-allergies" className="input" value={profile.allergies} onChange={(event) => updateProfile("allergies", event.target.value)} placeholder="Separate with commas" /></div></div><div className="profile-modal-actions"><button type="button" className="button button-ghost" onClick={() => setProfileOpen(false)}>Cancel</button><button type="button" className="button button-primary" onClick={() => void saveProfile()} disabled={profileSaving || Boolean(profileSuccess)}>{profileSaving ? "Saving…" : profileSuccess ? "Saved" : "Save profile"}</button></div></>}</section></div>}
  </div>;
}
