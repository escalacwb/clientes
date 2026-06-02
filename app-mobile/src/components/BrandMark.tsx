import React from "react";
import { Text, View } from "react-native";

import { theme } from "../theme";

type Props = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: Props) {
  return (
    <View style={{ alignItems: compact ? "flex-start" : "center" }}>
      <Text
        style={{
          fontSize: compact ? 24 : 44,
          lineHeight: compact ? 26 : 46,
          fontWeight: "800",
          fontStyle: "italic",
          letterSpacing: 0.4,
          color: theme.colors.brand,
        }}
      >
        Capital
      </Text>
      <Text
        style={{
          marginTop: compact ? -2 : -4,
          fontSize: compact ? 15 : 20,
          lineHeight: compact ? 16 : 22,
          fontWeight: "700",
          fontStyle: "italic",
          color: theme.colors.brand,
        }}
      >
        Truck Center
      </Text>
    </View>
  );
}
