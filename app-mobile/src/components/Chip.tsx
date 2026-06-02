import React from "react";
import { Text, TouchableOpacity } from "react-native";

import { theme } from "../theme";

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function Chip({ label, selected, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: theme.radius.sm,
        borderWidth: 1,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
        backgroundColor: selected ? theme.colors.primarySoft : theme.colors.card,
        marginRight: theme.spacing.xs,
        marginBottom: theme.spacing.xs,
      }}
    >
      <Text style={{ color: theme.colors.text }}>{label}</Text>
    </TouchableOpacity>
  );
}
