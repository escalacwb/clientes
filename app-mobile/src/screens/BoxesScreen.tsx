import React, { useEffect, useMemo, useState } from "react";
import { Alert, RefreshControl, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import api from "../api/client";
import { Badge } from "../components/Badge";
import { Card } from "../components/Card";
import { Field } from "../components/Field";
import { Header } from "../components/Header";
import { theme } from "../theme";
import { logEvent } from "../utils/logger";

export function BoxesScreen() {
  const [boxes, setBoxes] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("");
  const navigation = useNavigation<any>();

  async function loadData() {
    const response = await api.get("/boxes/active");
    setBoxes(response.data || []);
  }

  useEffect(() => {
    loadData().catch(() => {
      logEvent({ level: "error", message: "Falha ao carregar boxes" });
      Alert.alert("Falha ao carregar boxes");
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      loadData().catch(() => {});
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const filtered = useMemo(
    () =>
      boxes.filter((box) =>
        `${box.placa || ""} ${box.empresa || ""} ${box.box_id}`
          .toLowerCase()
          .includes(filter.toLowerCase())
      ),
    [boxes, filter]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.md }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await loadData();
              } finally {
                setRefreshing(false);
              }
            }}
          />
        }
      >
        <Header title="Visao dos Boxes" />
        <Field
          label="Filtrar"
          value={filter}
          onChangeText={setFilter}
          placeholder="Placa, empresa ou box"
        />
        {filtered.length === 0 && (
          <Card>
            <Text style={{ color: theme.colors.muted }}>Nenhum box encontrado</Text>
          </Card>
        )}
        {filtered.map((box) => (
          <Card key={box.box_id}>
            <Text style={{ fontWeight: "600" }}>
              Box {box.box_id} - {box.box_area || ""}
            </Text>
            {box.placa ? (
              <>
                <Badge label="OCUPADO" variant="success" />
                <Text>{box.placa} - {box.empresa}</Text>
                <Text style={{ color: theme.colors.muted }}>
                  Motorista: {box.nome_motorista || "N/A"}
                </Text>
                <Text>Funcionario: {box.funcionario || "N/A"}</Text>
                <Text
                  style={{
                    color: theme.colors.primary,
                    marginTop: theme.spacing.xs,
                    fontWeight: "600",
                  }}
                  onPress={() => navigation.navigate("BoxDetail", { boxId: box.box_id })}
                >
                  Ver detalhes
                </Text>
              </>
            ) : (
              <>
                <Badge label="LIVRE" variant="warning" />
                <Text style={{ color: theme.colors.muted }}>Livre</Text>
              </>
            )}
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
