import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import api from "../api/client";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { Field } from "../components/Field";
import { Header } from "../components/Header";
import { theme } from "../theme";

type Vehicle = { id: number; placa: string; empresa: string };

type Option = { id: number; nome?: string };

export function AlocarScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [areas, setAreas] = useState<string[]>([]);
  const [area, setArea] = useState("");
  const [funcionarios, setFuncionarios] = useState<Option[]>([]);
  const [boxes, setBoxes] = useState<Option[]>([]);
  const [funcionarioId, setFuncionarioId] = useState("");
  const [boxId, setBoxId] = useState("");
  const [quilometragem, setQuilometragem] = useState(0);
  const [filter, setFilter] = useState("");
  const [isAllocating, setIsAllocating] = useState(false);

  async function loadInitial() {
    const [veh, func, box] = await Promise.all([
      api.get("/allocation/pending-vehicles"),
      api.get("/allocation/funcionarios"),
      api.get("/allocation/boxes"),
    ]);
    setVehicles(veh.data || []);
    setFuncionarios(func.data || []);
    setBoxes(box.data || []);
  }

  useEffect(() => {
    loadInitial().catch(() => {
      Alert.alert("Falha ao carregar dados");
    });
  }, []);

  async function loadAreas(veiculoId: number) {
    const response = await api.get(`/allocation/areas/${veiculoId}`);
    setAreas(response.data.areas || []);
    setQuilometragem(response.data.quilometragem || 0);
  }

  async function handleSelectVehicle(veiculo: Vehicle) {
    setSelectedVehicle(veiculo);
    await loadAreas(veiculo.id);
  }

  async function handleAlocar() {
    if (isAllocating) {
      return;
    }
    if (!selectedVehicle || !area || !boxId || !funcionarioId) {
      Alert.alert("Preencha todos os campos");
      return;
    }
    try {
      setIsAllocating(true);
      await api.post("/allocation/assign", {
        veiculo_id: selectedVehicle.id,
        area,
        box_id: Number(boxId),
        funcionario_id: Number(funcionarioId),
      });
      Alert.alert("Alocado com sucesso");
      await loadInitial();
    } catch (err) {
      Alert.alert("Falha ao alocar");
    } finally {
      setIsAllocating(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.md }}>
        <Header title="Alocar Servicos" />

        <View style={{ marginBottom: theme.spacing.sm }}>
          <Button title="Atualizar dados" onPress={loadInitial} />
        </View>

        <Card>
          <Field
            label="Filtrar veiculos"
            placeholder="Placa ou empresa"
            value={filter}
            onChangeText={setFilter}
          />
          <Text style={{ fontWeight: "600", marginBottom: theme.spacing.xs }}>
            Veiculos pendentes
          </Text>
          {vehicles.length === 0 && <Text>Nenhum veiculo pendente</Text>}
          {vehicles
            .filter((veh) =>
              `${veh.placa} ${veh.empresa}`
                .toLowerCase()
                .includes(filter.toLowerCase())
            )
            .map((veh) => (
              <TouchableOpacity
                key={veh.id}
                onPress={() => handleSelectVehicle(veh)}
                style={{
                  borderWidth: 1,
                  borderColor: selectedVehicle?.id === veh.id ? theme.colors.primary : theme.colors.border,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.sm,
                  marginBottom: theme.spacing.xs,
                  backgroundColor:
                    selectedVehicle?.id === veh.id ? theme.colors.primarySoft : theme.colors.card,
                }}
              >
                <Text style={{ fontWeight: "600" }}>{veh.placa}</Text>
                <Text style={{ color: theme.colors.muted }}>{veh.empresa}</Text>
              </TouchableOpacity>
            ))}
          {selectedVehicle && (
            <Text style={{ marginTop: theme.spacing.xs, color: theme.colors.muted }}>
              KM cadastro: {quilometragem || "N/A"}
            </Text>
          )}
        </Card>
        <Card>
          <Text style={{ fontWeight: "600", marginBottom: theme.spacing.xs }}>Area pendente</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {areas.map((item) => (
              <Chip
                key={item}
                label={item}
                selected={area === item}
                onPress={() => setArea(item)}
              />
            ))}
          </View>
        </Card>

        <Card>
          <Text style={{ fontWeight: "600", marginBottom: theme.spacing.xs }}>Box disponivel</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {boxes.map((box) => (
              <Chip
                key={box.id}
                label={String(box.id)}
                selected={boxId === String(box.id)}
                onPress={() => setBoxId(String(box.id))}
              />
            ))}
          </View>
        </Card>

        <Card>
          <Text style={{ fontWeight: "600", marginBottom: theme.spacing.xs }}>Funcionario</Text>
          {funcionarios.map((func) => (
            <TouchableOpacity
              key={func.id}
              onPress={() => setFuncionarioId(String(func.id))}
              style={{
                borderWidth: 1,
                borderColor: funcionarioId === String(func.id) ? theme.colors.primary : theme.colors.border,
                borderRadius: theme.radius.md,
                padding: theme.spacing.sm,
                marginBottom: theme.spacing.xs,
                backgroundColor: funcionarioId === String(func.id) ? theme.colors.primarySoft : theme.colors.card,
              }}
            >
              <Text style={{ fontWeight: "600" }}>{func.nome || "Funcionario"}</Text>
            </TouchableOpacity>
          ))}
        </Card>

        <Button
          title={isAllocating ? "Alocando..." : "Alocar"}
          onPress={handleAlocar}
          disabled={isAllocating}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
