import React from "react";
import { View } from "react-native";

import { theme } from "../theme";

type Props = {
  children: React.ReactNode;
};

export function Card({ children }: Props) {
  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
      }}
    >
      {children}
    </View>
  );
}
