import React from "react";
import { ActivityIndicator, View } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";

import { useAuth } from "../context/AuthContext";
import { LoginScreen } from "../screens/LoginScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { CadastroScreen } from "../screens/CadastroScreen";
import { AlocarScreen } from "../screens/AlocarScreen";
import { FilasScreen } from "../screens/FilasScreen";
import { BoxesScreen } from "../screens/BoxesScreen";
import { ConcluidosScreen } from "../screens/ConcluidosScreen";
import { FeedbackScreen } from "../screens/FeedbackScreen";
import { RevisaoScreen } from "../screens/RevisaoScreen";
import { BoxDetailScreen } from "../screens/BoxDetailScreen";
import { TermoScreen } from "../screens/TermoScreen";
import { RootStackParamList } from "./types";

const Stack = createStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { isAuthed, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthed ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Cadastro" component={CadastroScreen} />
          <Stack.Screen name="Alocar" component={AlocarScreen} />
          <Stack.Screen name="Filas" component={FilasScreen} />
          <Stack.Screen name="Boxes" component={BoxesScreen} />
          <Stack.Screen name="Concluidos" component={ConcluidosScreen} />
          <Stack.Screen name="Feedback" component={FeedbackScreen} />
          <Stack.Screen name="Revisao" component={RevisaoScreen} />
          <Stack.Screen name="BoxDetail" component={BoxDetailScreen} />
          <Stack.Screen name="Termo" component={TermoScreen} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
