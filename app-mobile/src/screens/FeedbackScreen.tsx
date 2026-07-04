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

type FeedbackItem = {
  patio_execucao_id: number;
  cliente_id: string;
  cliente_nome: string;
  vendedor_id?: string | null;
  veiculo_id?: string | null;
  placa?: string | null;
  veiculo_descricao?: string | null;
  quilometragem?: number | null;
  fim_execucao?: string | null;
  nome_motorista?: string | null;
  contato_motorista?: string | null;
  contato_recomendado?: string | null;
  contato_nome?: string | null;
  contato_tipo?: string | null;
  servicos?: string[] | null;
};

function buildFeedbackMessage(item: FeedbackItem) {
  const servicos = (item.servicos || []).slice(0, 3).join(", ");
  const contato = item.contato_nome || item.nome_motorista || "Cliente";
  const km = item.quilometragem ? `${numberLabel(item.quilometragem)} km` : "KM nao informado";

  return `Ola ${contato},

Somos da Capital Truck Center e estamos fazendo o acompanhamento do servico realizado no seu veiculo ${item.veiculo_descricao || ""}, placa ${item.placa || ""}, no dia ${dateLabel(item.fim_execucao)}.

Foi feito ${servicos || "servico de patio"}, com ${km}.

Gostariamos do seu feedback:

1. O servico resolveu o problema?
2. Como voce avalia a agilidade e o conhecimento da equipe?
3. O atendimento e a estrutura da loja foram satisfatorios?

Agradecemos sua parceria e ficamos a disposicao no (67) 98417-3800.

Equipe de Qualidade | Capital Truck Center`;
}

export function FeedbackScreen() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [runningId, setRunningId] = useState<number | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const response = await api.get<FeedbackItem[]>("/crm/feedback");
      setItems(response.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData().catch(() => Alert.alert("CRM", "Falha ao carregar feedbacks pendentes."));
  }, []);

  const stats = useMemo(() => {
    const withoutPhone = items.filter((item) => !item.contato_recomendado && !item.contato_motorista).length;
    return { total: items.length, withoutPhone };
  }, [items]);

  async function complete(item: FeedbackItem) {
    setRunningId(item.patio_execucao_id);
    try {
      await api.post(`/crm/feedback/${item.patio_execucao_id}/done`, {
        observacao: notes[item.patio_execucao_id] || "",
      });
      setItems((current) => current.filter((row) => row.patio_execucao_id !== item.patio_execucao_id));
      setNotes((current) => {
        const next = { ...current };
        delete next[item.patio_execucao_id];
        return next;
      });
    } catch {
      Alert.alert("CRM", "Nao foi possivel concluir o feedback.");
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
        <Header title="Feedback pos-servico" subtitle="Contatos pendentes depois de servicos concluidos no patio." />

        <View style={{ flexDirection: "row", gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
          <View style={{ flex: 1, backgroundColor: theme.colors.card, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md }}>
            <Text style={{ color: theme.colors.muted, fontWeight: "800" }}>Pendentes</Text>
            <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: "900", marginTop: 4 }}>{stats.total}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: theme.colors.card, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md }}>
            <Text style={{ color: theme.colors.muted, fontWeight: "800" }}>Sem telefone</Text>
            <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: "900", marginTop: 4 }}>{stats.withoutPhone}</Text>
          </View>
        </View>

        {loading && items.length === 0 ? (
          <Card>
            <Text style={{ color: theme.colors.muted }}>Carregando...</Text>
          </Card>
        ) : null}

        {!loading && items.length === 0 ? (
          <Card>
            <Text style={{ color: theme.colors.muted }}>Nenhum feedback pendente.</Text>
          </Card>
        ) : null}

        {items.map((item) => {
          const phone = item.contato_recomendado || item.contato_motorista || undefined;
          return (
            <Card key={item.patio_execucao_id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: "900" }}>{item.cliente_nome}</Text>
                  <Text style={{ color: theme.colors.muted, marginTop: 3 }}>
                    {item.placa || "Sem placa"} | {item.veiculo_descricao || "Veiculo"}
                  </Text>
                </View>
                <Badge label="FEEDBACK" variant="info" />
              </View>

              <View style={{ marginTop: theme.spacing.sm }}>
                <Text style={{ color: theme.colors.text, fontWeight: "800" }}>
                  {item.contato_nome || item.nome_motorista || "Contato nao identificado"}
                </Text>
                <Text style={{ color: theme.colors.muted, marginTop: 3 }}>
                  Servico: {dateLabel(item.fim_execucao)} | KM {numberLabel(item.quilometragem)}
                </Text>
                {(item.servicos || []).length > 0 ? (
                  <Text style={{ color: theme.colors.muted, marginTop: 3 }}>{(item.servicos || []).slice(0, 3).join(", ")}</Text>
                ) : null}
              </View>

              <TextInput
                value={notes[item.patio_execucao_id] || ""}
                onChangeText={(value) => setNotes((current) => ({ ...current, [item.patio_execucao_id]: value }))}
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

              <View style={{ flexDirection: "row", gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <ActionButton
                    label="WhatsApp"
                    variant="secondary"
                    onPress={() => openWhatsApp(phone, buildFeedbackMessage(item))}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ActionButton
                    label="Concluir"
                    loading={runningId === item.patio_execucao_id}
                    onPress={() => complete(item)}
                  />
                </View>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
