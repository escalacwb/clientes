import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, RefreshControl, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import api from "../api/client";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { Header } from "../components/Header";
import { theme } from "../theme";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/Badge";
import { logEvent } from "../utils/logger";

type CompletedItem = {
  execucao_id: number;
  service_id: string | null;
  veiculo_id: number;
  placa: string;
  empresa: string;
  quilometragem: number;
  fim_execucao: string | null;
  area: string;
  tipo: string;
  quantidade: number;
  funcionario: string | null;
  observacao: string | null;
  tipo_atendimento?: string | null;
};

export function ConcluidosScreen() {
  const [items, setItems] = useState<CompletedItem[]>([]);
  const [rangeDays, setRangeDays] = useState(30);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const { role } = useAuth();
  const navigation = useNavigation<any>();

  const pageSize = 10;

  async function loadData() {
    setLoading(true);
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - rangeDays);
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);

    try {
      const response = await api.get("/services/completed", {
        params: { start_date: startDate, end_date: endDate },
      });
      setItems(response.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData().catch(() => Alert.alert("Falha ao carregar concluidos"));
    setPage(1);
  }, [rangeDays]);

  const grouped = useMemo(() => {
    const map = new Map<number, CompletedItem[]>();
    items.forEach((item) => {
      const list = map.get(item.execucao_id) || [];
      list.push(item);
      map.set(item.execucao_id, list);
    });
    return Array.from(map.values());
  }, [items]);

  const paged = useMemo(() => grouped.slice(0, page * pageSize), [grouped, page]);

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
        <Header title="Servicos Concluidos" />

        <View style={{ flexDirection: "row", marginBottom: theme.spacing.sm }}>
          {[7, 30, 90].map((days) => (
            <Chip
              key={days}
              label={`${days} dias`}
              selected={rangeDays === days}
              onPress={() => setRangeDays(days)}
            />
          ))}
        </View>

        {loading && items.length === 0 && (
          <Card>
            <Text style={{ color: theme.colors.muted }}>Carregando...</Text>
          </Card>
        )}
        {!loading && grouped.length === 0 && (
          <Card>
            <Text style={{ color: theme.colors.muted }}>Sem registros no periodo</Text>
          </Card>
        )}
        {paged.map((group, idx) => {
          const first = group[0];
          const observacoes = Array.from(
            new Set(group.map((item) => item.observacao).filter(Boolean))
          );
          return (
            <Card key={`${first.execucao_id}-${idx}`}>
              <Text style={{ fontWeight: "600" }}>
                {first.placa} - {first.empresa}
              </Text>
              <Badge label="CONCLUIDO" variant="success" />
              <Text style={{ color: theme.colors.muted }}>KM: {first.quilometragem}</Text>
              <Text style={{ color: theme.colors.muted }}>
                Finalizado: {first.fim_execucao || "N/A"}
              </Text>
              <View style={{ marginTop: theme.spacing.xs, marginBottom: theme.spacing.xs }}>
                <Button
                  title="Gerar termo"
                  onPress={() => navigation.navigate("Termo", { execucaoId: first.execucao_id })}
                />
              </View>
              {observacoes.length > 0 && (
                <Text style={{ color: theme.colors.muted, marginTop: theme.spacing.xs }}>
                  Obs: {observacoes.join(" | ")}
                </Text>
              )}
              {group.map((item, jdx) => (
                <View key={`${item.execucao_id}-${jdx}`} style={{ marginTop: 6 }}>
                  <Text>
                    - {item.area}: {item.tipo} ({item.quantidade})
                  </Text>
                  {role === "admin" && item.service_id && (
                    <View style={{ flexDirection: "row", marginTop: 4 }}>
                      {[
                        { label: "Normal", value: "Normal" },
                        { label: "Retorno", value: "Retorno" },
                      ].map((opt) => (
                        <Chip
                          key={`${item.service_id}-${opt.value}`}
                          label={opt.label}
                          selected={item.tipo_atendimento === opt.value}
                          onPress={async () => {
                            try {
                              await api.put(`/services/${item.service_id}/tipo-atendimento`, {
                                area: item.area,
                                tipo_atendimento: opt.value,
                              });
                              setItems((prev) =>
                                prev.map((entry) =>
                                  entry.service_id === item.service_id
                                    ? { ...entry, tipo_atendimento: opt.value }
                                    : entry
                                )
                              );
                              Alert.alert("Tipo atualizado");
                            } catch {
                              Alert.alert("Falha ao atualizar tipo");
                            }
                          }}
                        />
                      ))}
                    </View>
                  )}
                </View>
              ))}
              {role === "admin" && (
                <View style={{ marginTop: theme.spacing.sm }}>
                  <Button
                    title="Reverter visita"
                    color={theme.colors.danger}
                    onPress={async () => {
                      Alert.alert("Confirmar", "Deseja reverter a visita?", [
                        { text: "Cancelar", style: "cancel" },
                        {
                          text: "Reverter",
                          onPress: async () => {
                            try {
                              await api.post("/services/revert", {
                                veiculo_id: first.veiculo_id,
                                quilometragem: first.quilometragem,
                              });
                              Alert.alert("Visita revertida");
                              await loadData();
                            } catch {
                              Alert.alert("Falha ao reverter");
                            }
                          },
                        },
                      ]);
                    }}
                  />
                </View>
              )}
            </Card>
          );
        })}
        {paged.length < grouped.length && (
          <View style={{ marginTop: theme.spacing.sm }}>
            <Button title="Carregar mais" onPress={() => setPage((prev) => prev + 1)} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
