import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import api from "../api/client";
import { ActionButton } from "../components/ActionButton";
import { Badge } from "../components/Badge";
import { Card } from "../components/Card";
import { Header } from "../components/Header";
import { theme } from "../theme";
import { dateLabel, numberLabel, openWhatsApp } from "./crmHelpers";

type RevisaoItem = {
  patio_veiculo_id: number;
  cliente_id: string;
  cliente_nome: string;
  vendedor_id?: string | null;
  veiculo_id?: string | null;
  placa?: string | null;
  veiculo_descricao?: string | null;
  nome_motorista?: string | null;
  contato_motorista?: string | null;
  media_km_diaria?: number | null;
  data_revisao_proativa?: string | null;
  ultimo_km?: number | null;
  ultimo_atendimento_em?: string | null;
  dias_desde_ultima_visita?: number | null;
  km_estimado_desde_visita?: number | null;
  contato_recomendado?: string | null;
  contato_nome?: string | null;
  contato_tipo?: string | null;
  total_count?: number | null;
};

function buildRevisaoMessage(item: RevisaoItem, target: "motorista" | "gestor") {
  const contato = target === "motorista"
    ? item.nome_motorista || "Cliente"
    : item.contato_nome || "Cliente";
  const ultimoKm = item.ultimo_km ? numberLabel(item.ultimo_km) : "nao informado";
  const kmRodados = numberLabel(item.km_estimado_desde_visita);
  const kmAtual = item.ultimo_km ? numberLabel(item.ultimo_km + Number(item.km_estimado_desde_visita || 0)) : "nao estimado";

  return `Ola, ${contato}! Tudo bem?

Aqui e da Capital Truck Center. Vimos que o veiculo ${item.veiculo_descricao || ""}, placa ${item.placa || ""}, pode estar precisando de uma nova revisao.

A ultima visita foi com ${ultimoKm} km e, com base no historico do nosso sistema, ja rodou aproximadamente ${kmRodados} km desde entao, estando agora com cerca de ${kmAtual} km.

Nosso atendimento e por ordem de chegada, entao e so passar na loja quando puder.

Se a quilometragem atual estiver diferente dessa estimativa, por favor nos envie a KM correta para atualizarmos no sistema.`;
}

export function RevisaoScreen() {
  const [items, setItems] = useState<RevisaoItem[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [runningId, setRunningId] = useState<number | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const response = await api.get<RevisaoItem[]>("/crm/revisao");
      setItems(response.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData().catch(() => Alert.alert("CRM", "Falha ao carregar revisoes proativas."));
  }, []);

  const stats = useMemo(() => {
    const total = Number(items[0]?.total_count || items.length);
    const highKm = items.filter((item) => Number(item.km_estimado_desde_visita || 0) >= 10000).length;
    return { total, highKm };
  }, [items]);

  async function complete(item: RevisaoItem) {
    setRunningId(item.patio_veiculo_id);
    try {
      await api.post(`/crm/revisao/${item.patio_veiculo_id}/done`, {
        observacao: notes[item.patio_veiculo_id] || "",
      });
      setItems((current) => current.filter((row) => row.patio_veiculo_id !== item.patio_veiculo_id));
      setNotes((current) => {
        const next = { ...current };
        delete next[item.patio_veiculo_id];
        return next;
      });
    } catch {
      Alert.alert("CRM", "Nao foi possivel concluir a revisao proativa.");
    } finally {
      setRunningId(null);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: theme.spacing.lg }}
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
        <Header title="Revisao proativa" subtitle="Placas que devem receber contato com base em KM e ultima visita." />

        <View style={{ flexDirection: "row", gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
          <View style={{ flex: 1, backgroundColor: theme.colors.card, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md }}>
            <Text style={{ color: theme.colors.muted, fontWeight: "800" }}>Fila</Text>
            <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: "900", marginTop: 4 }}>{stats.total}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: theme.colors.card, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md }}>
            <Text style={{ color: theme.colors.muted, fontWeight: "800" }}>Acima 10k km</Text>
            <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: "900", marginTop: 4 }}>{stats.highKm}</Text>
          </View>
        </View>

        {loading && items.length === 0 ? (
          <Card>
            <Text style={{ color: theme.colors.muted }}>Carregando...</Text>
          </Card>
        ) : null}

        {!loading && items.length === 0 ? (
          <Card>
            <Text style={{ color: theme.colors.muted }}>Nenhuma revisao proativa pendente.</Text>
          </Card>
        ) : null}

        {items.map((item) => {
          const gestorPhone = item.contato_recomendado || undefined;
          const motoristaPhone = item.contato_motorista || undefined;
          return (
            <Card key={item.patio_veiculo_id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: "900" }}>{item.cliente_nome}</Text>
                  <Text style={{ color: theme.colors.muted, marginTop: 3 }}>
                    {item.placa || "Sem placa"} | {item.veiculo_descricao || "Veiculo"}
                  </Text>
                </View>
                <Badge label="REVISAO" variant="warning" />
              </View>

              <View style={{ marginTop: theme.spacing.sm }}>
                <Text style={{ color: theme.colors.text, fontWeight: "800" }}>
                  {numberLabel(item.km_estimado_desde_visita)} km estimados desde a ultima visita
                </Text>
                <Text style={{ color: theme.colors.muted, marginTop: 3 }}>
                  Ultima visita: {dateLabel(item.ultimo_atendimento_em)} | {numberLabel(item.dias_desde_ultima_visita)} dias
                </Text>
                <Text style={{ color: theme.colors.muted, marginTop: 3 }}>
                  Motorista: {item.nome_motorista || "N/A"} | Media {numberLabel(item.media_km_diaria)} km/dia
                </Text>
              </View>

              <TextInput
                value={notes[item.patio_veiculo_id] || ""}
                onChangeText={(value) => setNotes((current) => ({ ...current, [item.patio_veiculo_id]: value }))}
                placeholder="Observacao do contato"
                multiline
                style={{
                  minHeight: 76,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.sm,
                  backgroundColor: "#fbfcfa",
                  padding: theme.spacing.sm,
                  marginTop: theme.spacing.sm,
                  textAlignVertical: "top",
                }}
              />

              <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
                <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <ActionButton
                      label="Motorista"
                      variant="secondary"
                      onPress={() => openWhatsApp(motoristaPhone, buildRevisaoMessage(item, "motorista"))}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ActionButton
                      label="Gestor"
                      variant="secondary"
                      onPress={() => openWhatsApp(gestorPhone, buildRevisaoMessage(item, "gestor"))}
                    />
                  </View>
                </View>
                <ActionButton
                  label="Concluir contato"
                  loading={runningId === item.patio_veiculo_id}
                  onPress={() => complete(item)}
                />
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
