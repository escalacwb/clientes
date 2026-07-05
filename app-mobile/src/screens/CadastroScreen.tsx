import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Linking, SafeAreaView, ScrollView, Text, View } from "react-native";

import api, { isApiError } from "../api/client";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { Field } from "../components/Field";
import { Header } from "../components/Header";
import { theme } from "../theme";

type ServiceItem = {
  area: string;
  tipo: string;
  qtd: number;
};

type AxisState = {
  alinhar: boolean;
  le: string[];
  ld: string[];
};

type ClientOption = {
  id: string;
  nome_empresa: string;
  nome_fantasia?: string | null;
  codigo_erp?: string | null;
  cidade?: string | null;
  uf?: string | null;
  nome_responsavel?: string | null;
  contato_responsavel?: string | null;
};

type PlateApiResult = {
  placa: string;
  modelo?: string | null;
  anoModelo?: number | string | null;
};

const desgasteOptions = ["Ombro Interno", "Ombro Externo", "Centro", "Escamado/Irregular"];

function toggleOption(list: string[], option: string) {
  if (list.includes(option)) {
    return list.filter((item) => item !== option);
  }
  return [...list, option];
}

function buildDiagnostico(axes: AxisState[], puxando: string, passarinhando: string, vibracao: string) {
  const eixos = axes
    .map((axis, index) => (axis.alinhar ? String(index + 1) : ""))
    .filter(Boolean);
  const obsPneus: string[] = [];
  axes.forEach((axis, index) => {
    if (!axis.alinhar) {
      return;
    }
    if (axis.le.length) {
      obsPneus.push(`- Eixo ${index + 1} (LE/Mot): ${axis.le.join(", ")}`);
    }
    if (axis.ld.length) {
      obsPneus.push(`- Eixo ${index + 1} (LD/Pass): ${axis.ld.join(", ")}`);
    }
  });

  let text = "";
  if (eixos.length) {
    text += `ALINHAMENTO NECESSARIO NOS EIXOS: ${eixos.join(", ")}\n`;
  } else {
    text += "Nenhum alinhamento solicitado.\n";
  }
  if (obsPneus.length) {
    text += `DESGASTE DE PNEUS:\n${obsPneus.join("\n")}\n`;
  }
  text += "--------------------\n";
  text += puxando === "Nao" ? "- Caminhao NAO esta puxando.\n" : `- Caminhao esta PUXANDO para a ${puxando}.\n`;
  text += passarinhando === "Nao"
    ? "- Volante normal (nao esta passarinhando).\n"
    : `- Caminhao esta com ${passarinhando.toUpperCase()}.\n`;
  text += vibracao === "Sim" ? "- Caminhao esta VIBRANDO.\n" : "- Caminhao NAO esta vibrando.\n";
  return text.trim();
}

function clientLabel(client: ClientOption) {
  const fantasia = client.nome_fantasia ? ` (${client.nome_fantasia})` : "";
  const codigo = client.codigo_erp ? ` - ${client.codigo_erp}` : "";
  const cidade = client.cidade ? ` - ${client.cidade}${client.uf ? `/${client.uf}` : ""}` : "";
  return `${client.nome_empresa}${fantasia}${codigo}${cidade}`;
}

export function CadastroScreen() {
  const [placa, setPlaca] = useState("");
  const [veiculo, setVeiculo] = useState<any>(null);
  const [veiculoNaoEncontrado, setVeiculoNaoEncontrado] = useState(false);
  const [plateApiResult, setPlateApiResult] = useState<PlateApiResult | null>(null);
  const [plateApiError, setPlateApiError] = useState("");
  const [consultingPlateApi, setConsultingPlateApi] = useState(false);
  const [quilometragem, setQuilometragem] = useState("");
  const [observacao, setObservacao] = useState("");
  const [area, setArea] = useState("");
  const [tipo, setTipo] = useState("");
  const [qtd, setQtd] = useState("1");
  const [itens, setItens] = useState<ServiceItem[]>([]);
  const [catalogo, setCatalogo] = useState<any>(null);
  const [tipoSearch, setTipoSearch] = useState("");
  const [numEixos, setNumEixos] = useState(2);
  const [axes, setAxes] = useState<AxisState[]>([{ alinhar: false, le: [], ld: [] }, { alinhar: false, le: [], ld: [] }]);
  const [diagPuxando, setDiagPuxando] = useState("Nao");
  const [diagPassarinhando, setDiagPassarinhando] = useState("Nao");
  const [diagVibracao, setDiagVibracao] = useState("Nao");
  const [showEditVehicle, setShowEditVehicle] = useState(false);
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);
  const [clientRespName, setClientRespName] = useState("");
  const [clientRespPhone, setClientRespPhone] = useState("");
  const [vehicleEdit, setVehicleEdit] = useState({
    modelo: "",
    ano_modelo: "",
    nome_motorista: "",
    contato_motorista: "",
  });
  const [newCompanySearch, setNewCompanySearch] = useState("");
  const [newClientOptions, setNewClientOptions] = useState<ClientOption[]>([]);
  const [newSelectedClient, setNewSelectedClient] = useState<ClientOption | null>(null);
  const [newVehicle, setNewVehicle] = useState({
    modelo: "",
    ano_modelo: String(new Date().getFullYear()),
    nome_motorista: "",
    contato_motorista: "",
  });

  useEffect(() => {
    api
      .get("/catalog/services")
      .then((res) => setCatalogo(res.data))
      .catch(() => {
        Alert.alert("Falha ao carregar catalogo de servicos");
      });
  }, []);

  useEffect(() => {
    if (numEixos < 2) {
      return;
    }
    setAxes((prev) => {
      const next = [...prev];
      while (next.length < numEixos) {
        next.push({ alinhar: false, le: [], ld: [] });
      }
      return next.slice(0, numEixos);
    });
  }, [numEixos]);

  useEffect(() => {
    if (companySearch.length < 3) {
      setClientOptions([]);
      return;
    }
    api
      .get("/crm/clients/search", { params: { term: companySearch } })
      .then((res) => setClientOptions(res.data || []))
      .catch(() => setClientOptions([]));
  }, [companySearch]);

  useEffect(() => {
    if (newCompanySearch.length < 3) {
      setNewClientOptions([]);
      return;
    }
    api
      .get("/crm/clients/search", { params: { term: newCompanySearch } })
      .then((res) => setNewClientOptions(res.data || []))
      .catch(() => setNewClientOptions([]));
  }, [newCompanySearch]);

  async function consultarPlacaApi(placaBusca = placa) {
    const placaFinal = placaBusca.trim().toUpperCase();
    if (!placaFinal) {
      Alert.alert("Informe a placa");
      return null;
    }

    setConsultingPlateApi(true);
    setPlateApiError("");
    try {
      const response = await api.post<PlateApiResult>("/vehicles/consult-plate", {
        placa: placaFinal,
      });
      const result = response.data;
      setPlateApiResult(result);
      setNewVehicle((prev) => ({
        ...prev,
        modelo: result.modelo || prev.modelo,
        ano_modelo: result.anoModelo ? String(result.anoModelo) : prev.ano_modelo,
      }));
      return result;
    } catch (err) {
      setPlateApiError("Nao foi possivel consultar a placa na API.");
      return null;
    } finally {
      setConsultingPlateApi(false);
    }
  }

  async function buscarVeiculo() {
    if (!placa) {
      Alert.alert("Informe a placa");
      return;
    }
    setPlateApiResult(null);
    setPlateApiError("");
    try {
      const response = await api.get(`/vehicles/by-plate/${placa}`);
      setVeiculo(response.data);
      setVeiculoNaoEncontrado(false);
      setVehicleEdit({
        modelo: response.data.modelo || "",
        ano_modelo: response.data.ano_modelo ? String(response.data.ano_modelo) : "",
        nome_motorista: response.data.nome_motorista || "",
        contato_motorista: response.data.contato_motorista || "",
      });
      setCompanySearch(response.data.empresa || "");
      setSelectedClient(null);
      setClientRespName(response.data.nome_responsavel || "");
      setClientRespPhone(response.data.contato_responsavel || "");
    } catch (err) {
      setVeiculo(null);
      if (isApiError(err) && err.status === 404) {
        setVeiculoNaoEncontrado(true);
        setNewCompanySearch("");
        setNewSelectedClient(null);
        setNewClientOptions([]);
        setNewVehicle((prev) => ({
          ...prev,
          modelo: "",
          ano_modelo: String(new Date().getFullYear()),
          nome_motorista: "",
          contato_motorista: "",
        }));
        consultarPlacaApi(placa).catch(() => undefined);
      } else {
        setVeiculoNaoEncontrado(false);
        Alert.alert("Falha na busca", "Nao foi possivel consultar o veiculo.");
      }
    }
  }

  async function cadastrarNovoVeiculo() {
    const empresaFinal = (newSelectedClient?.nome_empresa || newCompanySearch).trim();
    const modeloFinal = newVehicle.modelo.trim();
    if (!placa.trim() || !empresaFinal || !modeloFinal) {
      Alert.alert("Campos obrigatorios", "Preencha placa, empresa e modelo.");
      return;
    }

    const anoModeloNum = Number(newVehicle.ano_modelo);
    try {
      const response = await api.post("/vehicles", {
        placa,
        empresa: empresaFinal,
        modelo: modeloFinal,
        ano_modelo: Number.isFinite(anoModeloNum) ? anoModeloNum : null,
        nome_motorista: newVehicle.nome_motorista.trim() || null,
        contato_motorista: newVehicle.contato_motorista.trim() || null,
        cliente_id: newSelectedClient?.id ?? null,
      });

      if ((response.data as any)?.already_exists) {
        Alert.alert("Veiculo ja existe", "A placa ja esta cadastrada. Carregando dados...");
      } else {
        Alert.alert("Veiculo cadastrado", "Cadastro inicial concluido com sucesso.");
      }
      await buscarVeiculo();
    } catch (err) {
      Alert.alert("Falha ao cadastrar", "Nao foi possivel cadastrar o veiculo.");
    }
  }

  function adicionarItem() {
    if (!area || !tipo) {
      Alert.alert("Informe area e tipo");
      return;
    }
    const qtdNum = Number(qtd) || 1;
    setItens((prev) => [...prev, { area, tipo, qtd: qtdNum }]);
    setTipo("");
  }

  function removerItem(index: number) {
    setItens((prev) => prev.filter((_, idx) => idx !== index));
  }

  const diagnostico = useMemo(
    () => buildDiagnostico(axes, diagPuxando, diagPassarinhando, diagVibracao),
    [axes, diagPuxando, diagPassarinhando, diagVibracao]
  );

  function buildMensagem(placaValue: string) {
    const servicosResumo = itens.map((s) => `${s.tipo}(${s.qtd})`).join(", ");
    const modelo = veiculo?.modelo || "N/A";
    const ano = veiculo?.ano_modelo || "N/A";
    const motorista = veiculo?.nome_motorista || "N/A";
    const empresa = veiculo?.empresa || "N/A";
    const responsavel = veiculo?.nome_responsavel || "N/A";

    let mensagem = `*NOVO SERVICO CADASTRADO*\n\n`;
    mensagem += `*DADOS DO VEICULO:*\n`;
    mensagem += `*Placa:* \`${placaValue}\`\n`;
    mensagem += `*Modelo:* ${modelo}\n`;
    mensagem += `*Ano:* ${ano}\n`;
    mensagem += `*KM:* \`${quilometragem ? Number(quilometragem).toLocaleString("pt-BR") : "NAO LANCADO"}\`\n\n`;
    mensagem += `*DADOS DO MOTORISTA:*\n`;
    mensagem += `*Nome:* ${motorista}\n\n`;
    mensagem += `*DADOS DA EMPRESA:*\n`;
    mensagem += `*Empresa:* ${empresa}\n`;
    mensagem += `*Responsavel:* ${responsavel}\n\n`;
    mensagem += `*SERVICOS SOLICITADOS:*\n${servicosResumo}\n\n`;
    mensagem += `*DIAGNOSTICO:*\n\n\`${diagnostico}\`\n`;

    if (observacao.trim()) {
      mensagem += `\n\n*OBSERVACOES ADICIONAIS:*\n${observacao}`;
    }
    return mensagem;
  }

  async function salvarEdicaoVeiculo() {
    if (!veiculo) {
      return;
    }
    try {
      await api.put(`/vehicles/${veiculo.id}`, {
        modelo: vehicleEdit.modelo,
        ano_modelo: vehicleEdit.ano_modelo ? Number(vehicleEdit.ano_modelo) : null,
        nome_motorista: vehicleEdit.nome_motorista,
        contato_motorista: vehicleEdit.contato_motorista,
      });
      Alert.alert("Veiculo atualizado");
      setShowEditVehicle(false);
      await buscarVeiculo();
    } catch (err) {
      Alert.alert("Falha ao atualizar veiculo");
    }
  }

  async function salvarEmpresa() {
    if (!veiculo) {
      return;
    }
    try {
      let clientId = selectedClient?.id || null;
      let empresaFinal = companySearch || veiculo.empresa;
      if (clientId && (clientRespName || clientRespPhone)) {
        await api.put(`/crm/clients/${clientId}`, {
          nome_responsavel: clientRespName,
          contato_responsavel: clientRespPhone,
        });
      }
      await api.put(`/vehicles/${veiculo.id}/company`, {
        empresa: empresaFinal,
        cliente_id: clientId,
        crm_cliente: true,
      });
      Alert.alert("Empresa atualizada");
      setShowEditCompany(false);
      await buscarVeiculo();
    } catch (err) {
      Alert.alert("Falha ao atualizar empresa");
    }
  }

  async function enviarCadastro() {
    if (!veiculo) {
      Alert.alert("Busque o veiculo primeiro");
      return;
    }
    if (itens.length === 0) {
      Alert.alert("Adicione pelo menos um servico");
      return;
    }
    const observacaoFinal = diagnostico + (observacao ? `\n\n${observacao}` : "");
    try {
      await api.post("/services/register", {
        veiculo_id: veiculo.id,
        quilometragem: quilometragem ? Number(quilometragem) : null,
        observacao: observacaoFinal,
        itens,
      });
      const mensagem = buildMensagem(veiculo.placa);
      const link = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
      await Linking.openURL(link);
      Alert.alert("Cadastro realizado");
      setItens([]);
      setObservacao("");
      setQuilometragem("");
    } catch (err) {
      Alert.alert("Falha ao cadastrar");
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.md }}>
        <Header title="Cadastro de Servico" />
        <Field
          label="Placa"
          placeholder="Ex: ABC1234"
          value={placa}
          onChangeText={(value) => {
            setPlaca(value);
            setVeiculoNaoEncontrado(false);
            setPlateApiResult(null);
            setPlateApiError("");
          }}
          autoCapitalize="characters"
        />
        <Button title="Buscar Veiculo" onPress={buscarVeiculo} />

        {!veiculo && veiculoNaoEncontrado && (
          <Card>
            <Text style={{ fontWeight: "600", marginBottom: theme.spacing.xs }}>
              Dados encontrados na API
            </Text>
            {plateApiResult ? (
              <Text style={{ marginBottom: theme.spacing.sm, color: theme.colors.muted }}>
                {plateApiResult.placa} - {plateApiResult.modelo || "Modelo nao informado"}
                {plateApiResult.anoModelo ? ` - ${plateApiResult.anoModelo}` : ""}
              </Text>
            ) : (
              <Text style={{ marginBottom: theme.spacing.sm, color: theme.colors.muted }}>
                Placa nao encontrada na base sincronizada.
              </Text>
            )}
            {plateApiError ? (
              <Text style={{ marginBottom: theme.spacing.sm, color: theme.colors.danger }}>
                {plateApiError}
              </Text>
            ) : null}
            <Button
              title={consultingPlateApi ? "Consultando..." : "Buscar placa na API"}
              onPress={() => consultarPlacaApi()}
              disabled={consultingPlateApi}
            />

            <Field
              label="Cliente/empresa"
              placeholder="Digite para buscar cliente no CRM"
              value={newCompanySearch}
              onChangeText={(value) => {
                setNewCompanySearch(value);
                setNewSelectedClient(null);
              }}
            />
            {newClientOptions.map((opt) => (
              <Chip
                key={`new-${opt.id}`}
                label={clientLabel(opt)}
                selected={newSelectedClient?.id === opt.id}
                onPress={() => {
                  setNewSelectedClient(opt);
                  setNewCompanySearch(opt.nome_empresa);
                }}
              />
            ))}

            <Field
              label="Modelo do veiculo"
              value={newVehicle.modelo}
              onChangeText={(value) => setNewVehicle((prev) => ({ ...prev, modelo: value }))}
            />
            <Field
              label="Ano do modelo"
              keyboardType="numeric"
              value={newVehicle.ano_modelo}
              onChangeText={(value) => setNewVehicle((prev) => ({ ...prev, ano_modelo: value }))}
            />
            <Field
              label="Nome do motorista"
              value={newVehicle.nome_motorista}
              onChangeText={(value) => setNewVehicle((prev) => ({ ...prev, nome_motorista: value }))}
            />
            <Field
              label="Contato do motorista"
              value={newVehicle.contato_motorista}
              onChangeText={(value) => setNewVehicle((prev) => ({ ...prev, contato_motorista: value }))}
            />
            <Button title="Cadastrar e iniciar entrada" onPress={cadastrarNovoVeiculo} />
          </Card>
        )}

        {!veiculo && !veiculoNaoEncontrado && (
          <Card>
            <Text>Busque uma placa para iniciar o cadastro de servicos.</Text>
          </Card>
        )}

        {veiculo && (
          <Card>
            <Text style={{ fontWeight: "600" }}>Dados do Veiculo</Text>
            <Text>Placa: {veiculo.placa}</Text>
            <Text>Empresa: {veiculo.empresa}</Text>
            <Text>Modelo: {veiculo.modelo}</Text>
            <View style={{ marginTop: theme.spacing.xs }}>
              <Button
                title={showEditVehicle ? "Fechar edicao" : "Editar veiculo"}
                onPress={() => setShowEditVehicle((prev) => !prev)}
              />
            </View>
            {showEditVehicle && (
              <View style={{ marginTop: theme.spacing.sm }}>
                <Field
                  label="Modelo"
                  value={vehicleEdit.modelo}
                  onChangeText={(value) => setVehicleEdit((prev) => ({ ...prev, modelo: value }))}
                />
                <Field
                  label="Ano modelo"
                  value={vehicleEdit.ano_modelo}
                  onChangeText={(value) => setVehicleEdit((prev) => ({ ...prev, ano_modelo: value }))}
                  keyboardType="numeric"
                />
                <Field
                  label="Motorista"
                  value={vehicleEdit.nome_motorista}
                  onChangeText={(value) => setVehicleEdit((prev) => ({ ...prev, nome_motorista: value }))}
                />
                <Field
                  label="Contato motorista"
                  value={vehicleEdit.contato_motorista}
                  onChangeText={(value) => setVehicleEdit((prev) => ({ ...prev, contato_motorista: value }))}
                />
                <Button title="Salvar veiculo" onPress={salvarEdicaoVeiculo} />
              </View>
            )}
          </Card>
        )}

        {veiculo && (
          <Card>
            <Text style={{ fontWeight: "600" }}>Empresa e responsavel</Text>
            <Text>Empresa atual: {veiculo.empresa}</Text>
            <Text>Responsavel: {veiculo.nome_responsavel || "N/A"}</Text>
            <View style={{ marginTop: theme.spacing.xs }}>
              <Button
                title={showEditCompany ? "Fechar edicao" : "Editar empresa"}
                onPress={() => setShowEditCompany((prev) => !prev)}
              />
            </View>
            {showEditCompany && (
              <View style={{ marginTop: theme.spacing.sm }}>
                <Field
                  label="Buscar/alterar empresa"
                  placeholder="Digite para buscar"
                  value={companySearch}
                  onChangeText={(value) => {
                    setCompanySearch(value);
                    setSelectedClient(null);
                  }}
                />
                {clientOptions.map((opt) => (
                  <Chip
                    key={opt.id}
                    label={clientLabel(opt)}
                    selected={selectedClient?.id === opt.id}
                    onPress={async () => {
                      setSelectedClient(opt);
                      setCompanySearch(opt.nome_empresa);
                      try {
                        const details = await api.get(`/crm/clients/${opt.id}`);
                        setClientRespName(details.data.nome_responsavel || "");
                        setClientRespPhone(details.data.contato_responsavel || "");
                      } catch {
                        setClientRespName("");
                        setClientRespPhone("");
                      }
                    }}
                  />
                ))}
                <Field
                  label="Responsavel"
                  value={clientRespName}
                  onChangeText={setClientRespName}
                />
                <Field
                  label="Contato responsavel"
                  value={clientRespPhone}
                  onChangeText={setClientRespPhone}
                />
                <Button title="Salvar empresa" onPress={salvarEmpresa} />
              </View>
            )}
          </Card>
        )}

        {veiculo && (
          <>
        <Card>
          <Text style={{ fontWeight: "600", marginBottom: theme.spacing.xs }}>
            Diagnostico do veiculo
          </Text>
          <Field
            label="Numero de eixos"
            value={String(numEixos)}
            onChangeText={(value) => setNumEixos(Math.max(2, Math.min(9, Number(value) || 2)))}
            keyboardType="numeric"
          />
          {axes.map((axis, idx) => (
            <View key={`axis-${idx}`} style={{ marginBottom: theme.spacing.sm }}>
              <Chip
                label={`Alinhar eixo ${idx + 1}`}
                selected={axis.alinhar}
                onPress={() =>
                  setAxes((prev) =>
                    prev.map((item, index) =>
                      index === idx ? { ...item, alinhar: !item.alinhar } : item
                    )
                  )
                }
              />
              {axis.alinhar && (
                <>
                  <Text style={{ marginTop: theme.spacing.xs }}>Pneu LE (Motorista)</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {desgasteOptions.map((opt) => (
                      <Chip
                        key={`${idx}-le-${opt}`}
                        label={opt}
                        selected={axis.le.includes(opt)}
                        onPress={() =>
                          setAxes((prev) =>
                            prev.map((item, index) =>
                              index === idx ? { ...item, le: toggleOption(item.le, opt) } : item
                            )
                          )
                        }
                      />
                    ))}
                  </View>
                  <Text style={{ marginTop: theme.spacing.xs }}>Pneu LD (Passageiro)</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {desgasteOptions.map((opt) => (
                      <Chip
                        key={`${idx}-ld-${opt}`}
                        label={opt}
                        selected={axis.ld.includes(opt)}
                        onPress={() =>
                          setAxes((prev) =>
                            prev.map((item, index) =>
                              index === idx ? { ...item, ld: toggleOption(item.ld, opt) } : item
                            )
                          )
                        }
                      />
                    ))}
                  </View>
                </>
              )}
            </View>
          ))}
          <Text style={{ marginTop: theme.spacing.sm }}>Caminhao puxando?</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {["Nao", "Esquerda", "Direita"].map((opt) => (
              <Chip key={opt} label={opt} selected={diagPuxando === opt} onPress={() => setDiagPuxando(opt)} />
            ))}
          </View>
          <Text style={{ marginTop: theme.spacing.sm }}>Passarinhando ou volante pesado?</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {["Nao", "Passarinhando", "Volante Pesado"].map((opt) => (
              <Chip key={opt} label={opt} selected={diagPassarinhando === opt} onPress={() => setDiagPassarinhando(opt)} />
            ))}
          </View>
          <Text style={{ marginTop: theme.spacing.sm }}>Caminhao vibrando?</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {["Nao", "Sim"].map((opt) => (
              <Chip key={opt} label={opt} selected={diagVibracao === opt} onPress={() => setDiagVibracao(opt)} />
            ))}
          </View>
          <Card>
            <Text style={{ fontWeight: "600" }}>Previa do diagnostico</Text>
            <Text style={{ color: theme.colors.muted }}>{diagnostico}</Text>
          </Card>
        </Card>

        <Card>
          <Field
            label="Quilometragem"
            placeholder="KM"
            keyboardType="numeric"
            value={quilometragem}
            onChangeText={setQuilometragem}
          />
          <Field
            label="Observacao"
            placeholder="Observacao geral"
            value={observacao}
            onChangeText={setObservacao}
          />
        </Card>

        <Card>
          <Text style={{ fontWeight: "600", marginBottom: theme.spacing.xs }}>Adicionar Servico</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {[
              { key: "borracharia", label: "Borracharia" },
              { key: "alinhamento", label: "Alinhamento" },
              { key: "manutencao", label: "Manutencao" },
            ].map((item) => (
              <Chip
                key={item.key}
                label={item.label}
                selected={area === item.key}
                onPress={() => {
                  setArea(item.key);
                  setTipo("");
                  setTipoSearch("");
                }}
              />
            ))}
          </View>
          <Field
            label="Buscar tipo"
            placeholder="Digite para filtrar"
            value={tipoSearch}
            onChangeText={setTipoSearch}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {(catalogo?.[area] || [])
              .filter((item: string) =>
                item.toLowerCase().includes(tipoSearch.toLowerCase())
              )
              .map((item: string) => (
                <Chip key={item} label={item} selected={tipo === item} onPress={() => setTipo(item)} />
              ))}
          </View>
          <Field
            label="Quantidade"
            placeholder="Qtd"
            keyboardType="numeric"
            value={qtd}
            onChangeText={setQtd}
          />
          <Button title="Adicionar" onPress={adicionarItem} />
        </Card>

        {itens.length > 0 && (
          <Card>
            <Text style={{ fontWeight: "600", marginBottom: theme.spacing.xs }}>Servicos</Text>
            {itens.map((item, idx) => (
              <View
                key={`${item.tipo}-${idx}`}
                style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}
              >
                <Text style={{ flex: 1 }}>
                  - {item.area}: {item.tipo} ({item.qtd})
                </Text>
                <Text style={{ color: theme.colors.danger }} onPress={() => removerItem(idx)}>
                  Remover
                </Text>
              </View>
            ))}
          </Card>
        )}

        <View style={{ marginTop: theme.spacing.sm }}>
          <Button title="Cadastrar e abrir WhatsApp" onPress={enviarCadastro} />
        </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
