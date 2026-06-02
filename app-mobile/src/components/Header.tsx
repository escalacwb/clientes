import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { useAuth } from "../context/AuthContext";
import { theme } from "../theme";
import { BrandMark } from "./BrandMark";

type Props = {
  title: string;
};

export function Header({ title }: Props) {
  const { signOut } = useAuth();

  return (
    <View style={{ marginBottom: 16 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <BrandMark compact />
        <TouchableOpacity onPress={signOut}>
          <Text style={{ color: theme.colors.danger, fontWeight: "600" }}>Sair</Text>
        </TouchableOpacity>
      </View>
      <Text style={{ fontSize: 20, fontWeight: "700", color: theme.colors.text, marginTop: 8 }}>{title}</Text>
    </View>
  );
}
