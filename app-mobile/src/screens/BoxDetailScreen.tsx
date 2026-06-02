import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import { RouteProp } from "@react-navigation/native";

import api from "../api/client";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { Field } from "../components/Field";
import { Header } from "../components/Header";
import { RootStackParamList } from "../navigation/types";
import { theme } from "../theme";
import { logEvent } from "../utils/logger";

type ServiceItem = {
  area: string;
  id: string;
  tipo: string;
  quantidade: number;
  observacao_cadastro?: string | null;
  observacao_execucao?: string | null;
};

type Props = {
  route: RouteProp<RootStackParamList, "BoxDetail">;
};

export function BoxDetailScreen({ route }: Props) {
  const { boxId } = route.params;
  const [execucao, setExecucao] = useState<any>(null);
  const [servicos, setServicos] = useState<ServiceItem[]>([]);
  const [obsFinal, setObsFinal] = useState("");
  const [loadingAction, setLoadingAction] = useState<"finalize" | "unassign" | "add" | null>(null);
  const [catalogo, setCatalogo] = useState<any>(null);
  const [novoTipo, setNovoTipo] = useState("");
  const [tipoSearch, setTipoSearch] = useState("");
  const [novoQtd, setNovoQtd] = useState("1");

  async function loadData() {
    const response = await api.get(`/boxes/${boxId}/details`);
    setExecucao(response.data.execucao);
    setServicos(response.data.servicos || []);
  }

  async function loadCatalogo() {
    const response = await api.get("/catalog/services");
    setCatalogo(response.data);
  }

  useEffect(() => {
    loadData().catch(() => {
      logEvent({ level: "error", message: "Falha ao carregar box", meta: { boxId } });
      Alert.alert("Falha ao carregar box");
    });
    loadCatalogo().catch(() => {
      logEvent({ level: "error", message: "Falha ao carregar catalogo" });
      Alert.alert("Falha ao carregar catalogo");
    });
  }, [boxId]);

  function updateQuantidade(id: string, valor: string) {
    const qtd = Number(valor) || 0;
    setServicos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantidade: qtd } : item))
    );
  }

  async function finalizeExecucao() {
    if (!execucao) {
      Alert.alert("Box livre");
      return;
    }
    setLoadingAction("finalize");
    try {
      await api.post(`/boxes/${boxId}/finalize`, {
        obs_final: obsFinal,
        servicos: servicos.map((s) => ({
          area: s.area,
          id: s.id,
          quantidade: s.quantidade,
        })),
      });
      Alert.alert("Box finalizado");
      setObsFinal("");
      await loadData();
    } catch (err) {
      logEvent({ level: "error", message: "Falha ao finalizar box", meta: { boxId } });
      Alert.alert("Falha ao finalizar");
    } finally {
      setLoadingAction(null);
    }
  }

  function finalizarBox() {
    Alert.alert("Confirmar", "Deseja finalizar o box?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Finalizar", onPress: finalizeExecucao },
    ]);
  }

  async function adicionarServicoExtra() {
    if (!novoTipo) {
      Alert.alert("Selecione o tipo de servico");
      return;
    }
    setLoadingAction("add");
    try {
      await api.post(`/boxes/${boxId}/services`, {
        tipo: novoTipo,
        quantidade: Number(novoQtd) || 1,
      });
      setNovoTipo("");
      setTipoSearch("");
      await loadData();
    } catch (err) {
      logEvent({ level: "error", message: "Falha ao adicionar servico", meta: { boxId } });
      Alert.alert("Falha ao adicionar servico");
    } finally {
      setLoadingAction(null);
    }
  }

  async function unassignExecucao() {
    setLoadingAction("unassign");
    try {
      await api.post(`/boxes/${boxId}/unassign`);
      Alert.alert("Box liberado");
      await loadData();
    } catch (err) {
      logEvent({ level: "error", message: "Falha ao retirar do box", meta: { boxId } });
      Alert.alert("Falha ao retirar do box");
    } finally {
      setLoadingAction(null);
    }
  }

  function retirarDoBox() {
    Alert.alert("Confirmar", "Deseja retirar o box?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Retirar", onPress: unassignExecucao },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.md }}>
        <Header title={`Box ${boxId}`} />

        {!execucao && (
          <Card>
            <Text style={{ color: theme.colors.muted }}>Box livre</Text>
          </Card>
        )}

        {execucao && (
          <>
            <Card>
              <Text style={{ fontWeight: "600" }}>{execucao.placa}</Text>
              <Text>{execucao.empresa}</Text>
              <Text style={{ color: theme.colors.muted }}>
                Motorista: {execucao.nome_motorista || "N/A"}
              </Text>
              <Text>Funcionario: {execucao.funcionario || "N/A"}</Text>
              <Text style={{ color: theme.colors.muted }}>
                KM entrada: {execucao.quilometragem || "N/A"}
              </Text>
              <View style={{ marginTop: theme.spacing.xs }}>
                <Button
                  title={loadingAction === "unassign" ? "Retirando..." : "Retirar do box"}
                  onPress={retirarDoBox}
                  disabled={loadingAction !== null}
                />
              </View>
            </Card>

            <Card>
              <Text style={{ fontWeight: "600", marginBottom: theme.spacing.xs }}>
                Servicos em execucao
              </Text>
              {servicos.map((srv) => (
                <View key={`${srv.area}-${srv.id}`} style={{ marginBottom: theme.spacing.sm }}>
                  <Text style={{ fontWeight: "600" }}>{srv.tipo}</Text>
                  <Text style={{ color: theme.colors.muted }}>{srv.area}</Text>
                  {srv.observacao_cadastro ? (
                    <Text style={{ color: theme.colors.muted }}>
                      Obs cadastro: {srv.observacao_cadastro}
                    </Text>
                  ) : null}
                  {srv.observacao_execucao ? (
                    <Text style={{ color: theme.colors.muted }}>
                      Obs execucao: {srv.observacao_execucao}
                    </Text>
                  ) : null}
                  <Field
                    label="Quantidade"
                    value={String(srv.quantidade)}
                    onChangeText={(val) => updateQuantidade(srv.id, val)}
                    keyboardType="numeric"
                  />
                </View>
              ))}
            </Card>

            <Card>
              <Text style={{ fontWeight: "600", marginBottom: theme.spacing.xs }}>
                Adicionar servico extra
              </Text>
              <Field
                label="Buscar tipo"
                placeholder="Digite para filtrar"
                value={tipoSearch}
                onChangeText={setTipoSearch}
              />
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {[...(catalogo?.borracharia || []), ...(catalogo?.alinhamento || []), ...(catalogo?.manutencao || [])]
                  .filter((item: string) =>
                    item.toLowerCase().includes(tipoSearch.toLowerCase())
                  )
                  .map((item: string) => (
                    <Chip
                      key={item}
                      label={item}
                      selected={novoTipo === item}
                      onPress={() => setNovoTipo(item)}
                    />
                  ))}
              </View>
              <Field
                label="Quantidade"
                value={novoQtd}
                onChangeText={setNovoQtd}
                keyboardType="numeric"
              />
              <Button
                title={loadingAction === "add" ? "Adicionando..." : "Adicionar"}
                onPress={adicionarServicoExtra}
                disabled={loadingAction !== null}
              />
            </Card>

            <Card>
              <Field
                label="Observacoes finais"
                placeholder="Observacoes"
                value={obsFinal}
                onChangeText={setObsFinal}
              />
              <Button
                title={loadingAction === "finalize" ? "Finalizando..." : "Finalizar Box"}
                onPress={finalizarBox}
                disabled={loadingAction !== null}
              />
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
