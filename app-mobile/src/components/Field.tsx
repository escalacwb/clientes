import React from "react";
import { Text, TextInput, View } from "react-native";

import { theme } from "../theme";

type Props = {
  label: string;
  value: string;
  placeholder?: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "numeric";
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "characters" | "sentences";
  rightAccessory?: React.ReactNode;
};

export function Field({
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType,
  secureTextEntry,
  autoCapitalize,
  rightAccessory,
}: Props) {
  return (
    <View style={{ marginBottom: theme.spacing.sm }}>
      <Text style={{ fontWeight: "600", marginBottom: 6 }}>{label}</Text>
      <View
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.sm,
          paddingLeft: theme.spacing.sm,
          backgroundColor: theme.colors.card,
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          style={{
            flex: 1,
            paddingVertical: theme.spacing.sm,
            paddingRight: theme.spacing.xs,
          }}
        />
        {rightAccessory ? <View style={{ paddingRight: theme.spacing.sm }}>{rightAccessory}</View> : null}
      </View>
    </View>
  );
}
