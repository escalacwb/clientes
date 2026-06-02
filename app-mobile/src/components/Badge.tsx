import React from "react";
import { Text, View } from "react-native";

import { theme } from "../theme";

type Variant = "info" | "success" | "warning" | "danger";

type Props = {
  label: string;
  variant?: Variant;
};

const variantMap: Record<Variant, { bg: string; text: string; border: string }> = {
  info: { bg: "#e7f1ff", text: theme.colors.primary, border: "#c8ddff" },
  success: { bg: "#e8f7ee", text: theme.colors.success, border: "#c9edd7" },
  warning: { bg: "#fff4db", text: theme.colors.warning, border: "#ffe4b5" },
  danger: { bg: "#fdecec", text: theme.colors.danger, border: "#f6c6c6" },
};

export function Badge({ label, variant = "info" }: Props) {
  const colors = variantMap[variant];
  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
        marginTop: 4,
        marginBottom: 4,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}
