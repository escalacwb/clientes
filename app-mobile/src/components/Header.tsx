import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { useAuth } from "../context/AuthContext";
import { theme } from "../theme";
import { BrandMark } from "./BrandMark";

type Props = {
  title: string;
  subtitle?: string;
};

export function Header({ title, subtitle }: Props) {
  const { signOut } = useAuth();
  const navigation = useNavigation<any>();
  const canGoHome = navigation.canGoBack();

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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {canGoHome ? (
            <TouchableOpacity
              onPress={() => navigation.navigate("Home")}
              style={{
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.sm,
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: theme.colors.card,
              }}
            >
              <Text style={{ color: theme.colors.text, fontWeight: "700" }}>Inicio</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={signOut}>
            <Text style={{ color: theme.colors.danger, fontWeight: "700" }}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={{ fontSize: 22, fontWeight: "800", color: theme.colors.text, marginTop: 12 }}>{title}</Text>
      {subtitle ? (
        <Text style={{ color: theme.colors.muted, marginTop: 4, lineHeight: 19 }}>{subtitle}</Text>
      ) : null}
    </View>
  );
}
