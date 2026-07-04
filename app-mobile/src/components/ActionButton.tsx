import React from "react";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";

import { theme } from "../theme";

type Variant = "primary" | "secondary" | "danger";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
};

const variantStyles: Record<Variant, { bg: string; border: string; text: string }> = {
  primary: { bg: theme.colors.primary, border: theme.colors.primary, text: "#ffffff" },
  secondary: { bg: theme.colors.card, border: theme.colors.border, text: theme.colors.text },
  danger: { bg: "#fff1f0", border: "#ffccc7", text: theme.colors.danger },
};

export function ActionButton({ label, onPress, disabled, loading, variant = "primary" }: Props) {
  const colors = variantStyles[variant];

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      disabled={disabled || loading}
      style={{
        minHeight: 42,
        borderRadius: theme.radius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.bg,
        paddingHorizontal: 14,
        paddingVertical: 10,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text style={{ color: colors.text, fontWeight: "800" }}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
