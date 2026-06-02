import React, { useEffect, useMemo, useState } from "react";
import { Alert, RefreshControl, SafeAreaView, ScrollView, Text, View } from "react-native";

import api from "../api/client";
import { Badge } from "../components/Badge";
import { Card } from "../components/Card";
import { Header } from "../components/Header";
import { theme } from "../theme";
import { logEvent } from "../utils/logger";

export function FilasScreen() {
  const [boxes, setBoxes] = useState<any[]>([]);
  const [fila, setFila] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    const response = await api.get("/queues");
    setBoxes(response.data.boxes || []);
    setFila(response.data.fila || []);
  }

  useEffect(() => {
    loadData().catch(() => {
      logEvent({ level: "error", message: "Falha ao carregar filas" });
      Alert.alert("Falha ao carregar filas");
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      loadData().catch(() => {});
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const counts = useMemo(
    () => ({ atendimento: boxes.length, fila: fila.length }),
    [boxes, fila]
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
        <Header title="Filas de Servico" />

        <Card>
          <Text style={{ fontWeight: "600" }}>Resumo</Text>
          <Text style={{ color: theme.colors.muted }}>Em atendimento: {counts.atendimento}</Text>
          <Text style={{ color: theme.colors.muted }}>Na fila: {counts.fila}</Text>
        </Card>

        <Text style={{ fontWeight: "600", marginBottom: theme.spacing.xs }}>Em atendimento</Text>
        {boxes.length === 0 && (
          <Card>
            <Text style={{ color: theme.colors.muted }}>Nenhum box em atendimento</Text>
          </Card>
        )}
        {boxes.map((box) => (
          <Card key={box.box_id}>
            <Text style={{ fontWeight: "600" }}>Box {box.box_id}</Text>
            <Badge label="EM ANDAMENTO" variant="info" />
            <Text>{box.placa} - {box.empresa}</Text>
            <Text style={{ color: theme.colors.muted }}>
              {box.funcionario || "N/A"}
            </Text>
            <Text>{box.servicos || "N/A"}</Text>
          </Card>
        ))}

        <Text style={{ fontWeight: "600", marginTop: theme.spacing.md, marginBottom: theme.spacing.xs }}>
          Fila
        </Text>
        {fila.length === 0 && (
          <Card>
            <Text style={{ color: theme.colors.muted }}>Fila vazia</Text>
          </Card>
        )}
        {fila.map((item, idx) => (
          <Card key={`${item.placa}-${idx}`}>
            <Text style={{ fontWeight: "600" }}>
              {idx + 1} - {item.placa} - {item.empresa}
            </Text>
            <Badge label="FILA" variant="warning" />
            <Text>{item.servicos || "N/A"}</Text>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
