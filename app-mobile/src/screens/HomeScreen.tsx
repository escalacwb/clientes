import React from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { Header } from "../components/Header";
import { TabIcon } from "../components/icons/AppIcons";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../navigation/types";
import { theme } from "../theme";

type RouteName = keyof Omit<RootStackParamList, "Login" | "Home" | "BoxDetail" | "Termo">;

type MenuItem = {
  title: string;
  description: string;
  route: RouteName;
  badge?: string;
};

const patioItems: MenuItem[] = [
  { title: "Cadastro", description: "Entrada de veiculos", route: "Cadastro" },
  { title: "Alocar", description: "Box, area e funcionario", route: "Alocar" },
  { title: "Filas", description: "Fila e atendimentos", route: "Filas" },
  { title: "Boxes", description: "Ocupacao em tempo real", route: "Boxes" },
  { title: "Servicos concluidos", description: "Historico recente", route: "Concluidos" },
];

const crmItems: MenuItem[] = [
  { title: "Feedback", description: "Pos-servico pendente", route: "Feedback", badge: "CRM" },
  { title: "Revisao proativa", description: "Contato por KM estimado", route: "Revisao", badge: "CRM" },
];

function MenuCard({ item }: { item: MenuItem }) {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={() => navigation.navigate(item.route)}
      style={{
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        minHeight: 92,
        marginBottom: theme.spacing.sm,
        shadowColor: "#12312f",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 12 }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: theme.radius.sm,
              backgroundColor: theme.colors.primarySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TabIcon routeName={item.route} color={theme.colors.primary} size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: "800" }}>{item.title}</Text>
            <Text style={{ color: theme.colors.muted, marginTop: 3 }}>{item.description}</Text>
          </View>
        </View>
        {item.badge ? (
          <View
            style={{
              backgroundColor: theme.colors.accent,
              borderRadius: theme.radius.sm,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: theme.colors.primary, fontSize: 11, fontWeight: "900" }}>{item.badge}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: theme.spacing.md }}>
      <Text
        style={{
          color: theme.colors.muted,
          fontSize: 12,
          fontWeight: "900",
          textTransform: "uppercase",
          marginBottom: theme.spacing.xs,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

export function HomeScreen() {
  const { role } = useAuth();
  const canUseCrm = role === "admin" || role === "vendedor";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: theme.spacing.lg }}>
        <Header
          title="Capital Truck Mobile"
          subtitle={canUseCrm ? "Patio operacional e contatos essenciais do CRM." : "Patio operacional."}
        />

        <View
          style={{
            backgroundColor: theme.colors.primary,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.sm,
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "900" }}>Operacao do dia</Text>
          <Text style={{ color: "#d8e7e2", marginTop: 5, lineHeight: 20 }}>
            {canUseCrm
              ? "Patio operacional, feedback e revisao proativa no mesmo aplicativo."
              : "Cadastro, alocacao, filas, boxes e servicos concluidos."}
          </Text>
        </View>

        <Section title="Patio">
          {patioItems.map((item) => (
            <MenuCard key={item.route} item={item} />
          ))}
        </Section>

        {canUseCrm ? (
          <Section title="CRM">
            {crmItems.map((item) => (
              <MenuCard key={item.route} item={item} />
            ))}
          </Section>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
