import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Linking,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
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
import { openWhatsApp } from "./crmHelpers";

type ServiceItem = {
  area: string;
  id: string;
  tipo: string;
  quantidade: number;
  observacao_cadastro?: string | null;
  observacao_execucao?: string | null;
};

type OmsysVendaPrompt = {
  deve_perguntar?: boolean;
  motivo?: string;
  venda_id?: string | null;
  venda_aberta_id?: string | null;
  status?: string | null;
  placa?: string | null;
  km?: string | null;
  cliente_codigo?: string | null;
  cliente_consumidor?: boolean;
  itens?: number;
  total?: string | number;
  url_sistema?: string | null;
  bloqueios?: string[];
  avisos?: string[];
};

type Props = {
  route: RouteProp<RootStackParamList, "BoxDetail">;
};

function buildBoxWhatsAppMessage(execucao: any, target: "motorista" | "responsavel") {
  const name = target === "motorista" ? execucao?.nome_motorista : execucao?.responsavel_nome;
  const greeting = name ? `Ola ${name},` : "Ola,";
  const vehicle = [execucao?.placa, execucao?.modelo].filter(Boolean).join(" - ");
  return `${greeting}

Aqui e da Capital Truck Center. O veiculo ${vehicle || "em atendimento"} esta no Box ${execucao?.box_id || ""}.

Qualquer novidade falamos por aqui.`;
}

function ContactLine({
  label,
  name,
  phone,
  message,
}: {
  label: string;
  name?: string | null;
  phone?: string | null;
  message: string;
}) {
  const displayName = name || (phone ? "Abrir WhatsApp" : "N/A");

  if (!phone) {
    return (
      <Text style={{ color: theme.colors.muted, marginTop: 2 }}>
        {label}: {displayName}
      </Text>
    );
  }

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", marginTop: 2 }}>
      <Text style={{ color: theme.colors.muted }}>{label}: </Text>
      <TouchableOpacity activeOpacity={0.8} onPress={() => openWhatsApp(phone || undefined, message)}>
        <Text
          style={{
            color: theme.colors.primary,
            fontWeight: "800",
            textDecorationLine: "underline",
          }}
        >
          {displayName}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function BoxDetailScreen({ route }: Props) {
  const { boxId } = route.params;
  const [execucao, setExecucao] = useState<any>(null);
  const [servicos, setServicos] = useState<ServiceItem[]>([]);
  const [obsFinal, setObsFinal] = useState("");
  const [loadingAction, setLoadingAction] = useState<"finalize" | "unassign" | "add" | "save" | null>(null);
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

  async function salvarServicos(servicosParaSalvar = servicos) {
    if (!execucao) {
      Alert.alert("Box livre");
      return;
    }

    setLoadingAction("save");
    try {
      const response = await api.post<{ servicos?: ServiceItem[] }>(`/boxes/${boxId}/services/save`, {
        servicos: servicosParaSalvar.map((s) => ({
          id: s.id,
          quantidade: Math.max(0, Math.round(Number(s.quantidade) || 0)),
          observacao_execucao: s.observacao_execucao || "",
        })),
      });
      setServicos(response.data?.servicos || []);
      Alert.alert("Servicos salvos");
    } catch (err) {
      logEvent({ level: "error", message: "Falha ao salvar servicos do box", meta: { boxId } });
      Alert.alert("Falha ao salvar servicos");
    } finally {
      setLoadingAction(null);
    }
  }

  function salvarAlteracoesServicos() {
    const removidos = servicos.filter((s) => Number(s.quantidade) <= 0);
    if (removidos.length > 0) {
      Alert.alert(
        "Remover servicos?",
        `${removidos.length} servico(s) com quantidade 0 serao removidos deste box.`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Salvar", onPress: () => salvarServicos() },
        ],
      );
      return;
    }

    salvarServicos();
  }

  function removerServico(servico: ServiceItem) {
    Alert.alert("Remover servico?", servico.tipo, [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: () => salvarServicos([{ ...servico, quantidade: 0 }]) },
    ]);
  }

  async function finalizeExecucao() {
    if (!execucao) {
      Alert.alert("Box livre");
      return;
    }
    setLoadingAction("finalize");
    try {
      const response = await api.post<{ omsys_venda?: OmsysVendaPrompt }>(`/boxes/${boxId}/finalize`, {
        obs_final: obsFinal,
        servicos: servicos.map((s) => ({
          area: s.area,
          id: s.id,
          quantidade: s.quantidade,
        })),
      });
      const venda = response.data?.omsys_venda;
      setObsFinal("");
      await loadData();
      handleOmsysVendaPrompt(venda);
    } catch (err) {
      logEvent({ level: "error", message: "Falha ao finalizar box", meta: { boxId } });
      Alert.alert("Falha ao finalizar");
    } finally {
      setLoadingAction(null);
    }
  }

  function handleOmsysVendaPrompt(venda?: OmsysVendaPrompt) {
    if (venda?.deve_perguntar && venda.venda_id && venda.url_sistema) {
      const total = venda.total ? `Total sugerido: R$ ${String(venda.total).replace(".", ",")}.` : "";
      const cliente = venda.cliente_consumidor ? " Cliente sera Consumidor 55555." : "";
      Alert.alert(
        "Abrir tela de vendas no OMSYS?",
        `${venda.placa || "Veiculo"} - ${venda.km || "KM NÃO LANÇADO"}\n${venda.itens || 0} itens. ${total}${cliente}`,
        [
          { text: "Depois", style: "cancel" },
          { text: "Abrir", onPress: () => abrirVendaNoSistema(venda) },
        ],
      );
      return;
    }

    if (venda?.motivo === "venda_aberta_existente") {
      Alert.alert("Box finalizado", "Ja existe venda aberta marcada para esta placa.");
      return;
    }

    if (venda?.motivo === "venda_bloqueada") {
      Alert.alert("Box finalizado", `Venda nao sugerida: ${venda.bloqueios?.join(", ") || "bloqueada"}.`);
      return;
    }

    Alert.alert("Box finalizado");
  }

  async function abrirVendaNoSistema(venda: OmsysVendaPrompt) {
    if (!venda.venda_id || !venda.url_sistema) return;

    try {
      await Linking.openURL(venda.url_sistema);
      Alert.alert("Confirmar abertura", "A tela de vendas abriu corretamente no OMSYS?", [
        { text: "Nao", style: "cancel" },
        {
          text: "Sim, abriu",
          onPress: () => {
            api.post(`/omsys/sales/${venda.venda_id}/opened`).catch(() => {
              Alert.alert("Aviso", "Nao conseguimos marcar a abertura no CRM.");
            });
          },
        },
      ]);
    } catch (err) {
      logEvent({ level: "error", message: "Falha ao abrir venda OMSYS", meta: { vendaId: venda.venda_id } });
      Alert.alert("Falha ao abrir venda", "A venda foi finalizada no patio, mas nao conseguimos abrir o sistema.");
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
              <ContactLine
                label="Motorista"
                name={execucao.nome_motorista}
                phone={execucao.contato_motorista}
                message={buildBoxWhatsAppMessage(execucao, "motorista")}
              />
              <ContactLine
                label="Responsavel"
                name={execucao.responsavel_nome}
                phone={execucao.contato_responsavel}
                message={buildBoxWhatsAppMessage(execucao, "responsavel")}
              />
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
              <Text style={{ color: theme.colors.muted, marginBottom: theme.spacing.xs }}>
                Altere a quantidade e toque em Salvar. Quantidade 0 remove o servico do box.
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
                  <Button
                    title="Remover"
                    onPress={() => removerServico(srv)}
                    disabled={loadingAction !== null}
                  />
                </View>
              ))}
              <Button
                title={loadingAction === "save" ? "Salvando..." : "Salvar alterações"}
                onPress={salvarAlteracoesServicos}
                disabled={loadingAction !== null}
              />
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
