import React, { useState } from "react";
import { RouteProp } from "@react-navigation/native";
import { Alert, Button, Linking, SafeAreaView, ScrollView, Text, View } from "react-native";

import api, { IS_SUPABASE_CONFIGURED, isApiError } from "../api/client";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { Header } from "../components/Header";
import { RootStackParamList } from "../navigation/types";
import { theme } from "../theme";

type Props = {
  route: RouteProp<RootStackParamList, "Termo">;
};

const avariasOptions = [
  "FOLGA EM BUCHA JUMELO",
  "FOLGA EM BUCHA TIRANTE",
  "FOLGA EM TERMINAL",
  "PINO DE CENTRO QUEBRADO",
  "FOLGA EM MANGA DE EIXO",
  "FOLGA EM ROLAMENTO",
  "MOLA QUEBRADA",
];

export function TermoScreen({ route }: Props) {
  const { execucaoId } = route.params;
  const [avarias, setAvarias] = useState<string[]>([]);
  const [carreta, setCarreta] = useState(false);
  const [cambagem, setCambagem] = useState(false);

  function toggleAvaria(item: string) {
    setAvarias((prev) =>
      prev.includes(item) ? prev.filter((av) => av !== item) : [...prev, item]
    );
  }

  function buildTermHtml(base: {
    placa: string;
    modelo: string | null;
    empresa: string | null;
    nome_motorista: string | null;
  }) {
    const modelo = base.modelo || "";
    const marca = modelo.split(" ")[0] || "";
    const modeloStr = modelo.split(" ").slice(1).join(" ");
    const nomeMotorista = base.nome_motorista || "";
    const empresa = base.empresa || "";
    const placa = base.placa || "";
    const agora = new Date().toLocaleDateString("pt-BR");

    const textoBase =
      `Eu, ${nomeMotorista}, responsavel pelo veiculo ${marca} ${modeloStr} de placa ${placa}, ` +
      `pertencente a empresa ${empresa}, declaro que autorizo a execucao do servico de alinhamento, ` +
      "ciente de que o servico sera realizado mesmo diante das condicoes abaixo descritas:";

    const partes: string[] = [textoBase];
    if (avarias.length) {
      partes.push("- O veiculo apresenta as seguintes avarias:");
      avarias.forEach((item) => partes.push(`  ${item}`));
      partes.push(
        "Estou ciente de que folgas na suspensao e direcao podem comprometer o alinhamento."
      );
    }
    if (carreta) {
      partes.push(
        "O caminhao encontra-se carregado e isso pode alterar a geometria durante o alinhamento."
      );
    }
    if (cambagem) {
      partes.push("Foi constatado que a cambagem esta fora dos parametros recomendados.");
    }
    partes.push(
      "Assumo responsabilidade pelas consequencias decorrentes da realizacao do alinhamento nessas condicoes."
    );

    const htmlTexto = partes.join("<br><br>");
    return `
      <html>
      <head><meta charset='utf-8'></head>
      <body style='font-family: Arial, sans-serif; padding: 24px;'>
        <h3 style='text-align:center;'>TERMO DE RESPONSABILIDADE</h3>
        <p style='text-align: justify; line-height: 1.5;'>${htmlTexto}</p>
        <p style='text-align:center; margin-top: 32px;'>Dourados - MS, ${agora}</p>
        <p style='text-align:center; margin-top: 48px;'>______________________________</p>
        <p style='text-align:center;'><b>${nomeMotorista}</b></p>
      </body>
      </html>
    `.trim();
  }

  async function abrirTermo() {
    if (!IS_SUPABASE_CONFIGURED) {
      Alert.alert(
        "Configuracao pendente",
        "Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no ambiente de build (EAS) e gere um novo APK."
      );
      return;
    }
    try {
      const response = await api.get(`/terms/${execucaoId}`);
      const data = response.data as {
        placa: string;
        modelo: string | null;
        empresa: string | null;
        nome_motorista: string | null;
      };
      const html = buildTermHtml(data);
      const uri = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
      await Linking.openURL(uri);
    } catch (err) {
      if (isApiError(err) && err.status === 404) {
        Alert.alert("Termo", "Servico nao encontrado.");
      } else {
        Alert.alert("Termo", "Falha ao gerar termo.");
      }
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.md }}>
        <Header title="Termo de Responsabilidade" />

        <Card>
          <Text style={{ fontWeight: "600", marginBottom: theme.spacing.xs }}>
            Selecione avarias
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {avariasOptions.map((item) => (
              <Chip
                key={item}
                label={item}
                selected={avarias.includes(item)}
                onPress={() => toggleAvaria(item)}
              />
            ))}
          </View>
        </Card>

        <Card>
          <Text style={{ fontWeight: "600", marginBottom: theme.spacing.xs }}>Condicoes</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            <Chip
              label="Carreta carregada"
              selected={carreta}
              onPress={() => setCarreta((prev) => !prev)}
            />
            <Chip
              label="Cambagem"
              selected={cambagem}
              onPress={() => setCambagem((prev) => !prev)}
            />
          </View>
        </Card>

        <View style={{ marginTop: theme.spacing.sm }}>
          <Button title="Abrir termo" onPress={abrirTermo} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
