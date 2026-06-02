import React, { useState } from "react";
import { Alert, Button, SafeAreaView, Text, TouchableOpacity, View } from "react-native";

import api, { IS_SUPABASE_CONFIGURED, SUPABASE_URL, isApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Field } from "../components/Field";
import { BrandMark } from "../components/BrandMark";
import { EyeClosedIcon, EyeOpenIcon } from "../components/icons/AppIcons";
import { theme } from "../theme";

export function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  async function handleLogin() {
    if (!username || !password) {
      Alert.alert("Preencha usuario e senha");
      return;
    }

    if (!IS_SUPABASE_CONFIGURED) {
      Alert.alert(
        "Configuracao pendente",
        "Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no ambiente de build (EAS) e gere um novo APK."
      );
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/login", { username, password });
      await signIn(
        response.data.access_token,
        response.data.user_role,
        response.data.user_name,
        response.data.user_id
      );
    } catch (err) {
      if (isApiError(err)) {
        const status = err.status;
        if (status === 401) {
          Alert.alert("Login falhou", "Usuario ou senha invalidos");
        } else if (!status) {
          Alert.alert(
            "Sem conexao com Supabase",
            `Nao foi possivel acessar ${SUPABASE_URL}.`
          );
        } else {
          Alert.alert("Erro no login", `Supabase respondeu com status ${status}.`);
        }
      } else {
        Alert.alert("Erro no login", "Erro inesperado ao tentar autenticar.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        padding: 20,
        justifyContent: "center",
        backgroundColor: theme.colors.bg,
      }}
    >
      <View
        style={{
          backgroundColor: theme.colors.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: 18,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <BrandMark />
        <Text
          style={{
            fontSize: 17,
            fontWeight: "700",
            marginTop: 14,
            color: theme.colors.text,
            textAlign: "center",
          }}
        >
          Controle de Patio
        </Text>
        <Text
          style={{
            fontSize: 13,
            marginTop: 4,
            marginBottom: 12,
            color: theme.colors.muted,
            textAlign: "center",
          }}
        >
          Entre com seu usuario e senha para continuar
        </Text>
        <Field
          label="Usuario"
          placeholder="Digite seu usuario"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <Field
          label="Senha"
          placeholder="Digite sua senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          rightAccessory={(
            <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
              {showPassword ? (
                <EyeClosedIcon color={theme.colors.muted} size={20} />
              ) : (
                <EyeOpenIcon color={theme.colors.muted} size={20} />
              )}
            </TouchableOpacity>
          )}
        />
        <View style={{ marginTop: 4 }}>
          <Button title={loading ? "Entrando..." : "Entrar"} onPress={handleLogin} />
        </View>
      </View>
    </SafeAreaView>
  );
}
