import type { ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, type TextInputProps, View } from "react-native";
import { colors, styles } from "./theme";
import { Href, Link } from "expo-router";

export function Screen({ children, centered = false, contentStyle }: { children: ReactNode; centered?: boolean; contentStyle?: object }) { return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView contentContainerStyle={[styles.content, centered && styles.centered, contentStyle]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView></KeyboardAvoidingView>; }
export function BackButton({ href = "/(tabs)" }: { href?: Href }) { return <Link href={href} style={styles.backButton}>‹ Back to Nouriva</Link>; }
export function Card({ children, style }: { children: ReactNode; style?: object }) { return <View style={[styles.card, style]}>{children}</View>; }
export function SectionHeader({ title }: { title: string }) { return <Text style={styles.sectionTitle}>{title}</Text>; }
export function TextField({ label, style, ...props }: TextInputProps & { label: string }) { return <View><Text style={styles.inputLabel}>{label}</Text><TextInput style={[styles.input, style]} placeholderTextColor={colors.muted} cursorColor={colors.green} selectionColor={colors.green} {...props} /></View>; }
export function SelectField({ label, value, options, onChange }: { label: string; value: string; options: Array<{ label: string; value: string }>; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((option) => option.value === value)?.label ?? value;
  return <View>
    <Text style={styles.inputLabel}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={label} style={styles.select} onPress={() => setOpen(true)}>
      <Text style={styles.selectText}>{selectedLabel}</Text>
      <Ionicons name="chevron-down" size={18} color={colors.muted} />
    </Pressable>
    <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
      <View style={styles.selectOverlay}>
        <Pressable style={styles.selectBackdrop} onPress={() => setOpen(false)} />
        <View style={styles.selectMenu}>
          <Text style={styles.selectMenuTitle}>{label}</Text>
          {options.map((option) => <Pressable key={option.value} style={styles.selectOption} onPress={() => { onChange(option.value); setOpen(false); }}>
            <Text style={styles.selectOptionText}>{option.label}</Text>
            {option.value === value && <Ionicons name="checkmark" size={18} color={colors.green} />}
          </Pressable>)}
        </View>
      </View>
    </Modal>
  </View>;
}
export function Button({ label, onPress, variant = "primary", disabled = false }: { label: string; onPress: () => void; variant?: "primary" | "secondary"; disabled?: boolean }) { return <Pressable accessibilityRole="button" disabled={disabled} style={({ pressed }) => [styles.button, variant === "secondary" && styles.buttonSecondary, disabled && styles.buttonDisabled, pressed && styles.buttonPressed]} onPress={onPress}><Text style={[styles.buttonText, variant === "secondary" && styles.buttonSecondaryText]}>{label}</Text></Pressable>; }
export function ProgressBar({ label, value, target, unit }: { label: string; value: number; target: number; unit: string }) { const progress = Math.min(1, Math.max(0, target ? value / target : 0)); return <View style={styles.progressBlock}><View style={styles.progressHeader}><Text style={styles.caption}>{label}</Text><Text style={styles.caption}>{Math.round(value)} / {target}{unit}</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress * 100}%` }]} /></View></View>; }
export function EmptyState({ title, body }: { title: string; body: string }) { return <View style={styles.empty}><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyBody}>{body}</Text></View>; }
