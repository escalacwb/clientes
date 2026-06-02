import React from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import { LoginScreen } from "../screens/LoginScreen";
import { CadastroScreen } from "../screens/CadastroScreen";
import { AlocarScreen } from "../screens/AlocarScreen";
import { FilasScreen } from "../screens/FilasScreen";
import { BoxesScreen } from "../screens/BoxesScreen";
import { ConcluidosScreen } from "../screens/ConcluidosScreen";
import { BoxDetailScreen } from "../screens/BoxDetailScreen";
import { TermoScreen } from "../screens/TermoScreen";
import { TabIcon } from "../components/icons/AppIcons";
import { theme } from "../theme";
import { RootStackParamList } from "./types";

const Stack = createStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator();

function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === "android" ? 14 : 0);
  const tabHeight = 56 + bottomInset;

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          height: tabHeight,
          paddingTop: 6,
          paddingBottom: bottomInset,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarIcon: ({ color, size }) => (
          <TabIcon routeName={route.name} color={color} size={size} />
        ),
      })}
    >
      <Tabs.Screen name="Cadastro" component={CadastroScreen} />
      <Tabs.Screen name="Alocar" component={AlocarScreen} />
      <Tabs.Screen name="Filas" component={FilasScreen} />
      <Tabs.Screen name="Boxes" component={BoxesScreen} />
      <Tabs.Screen name="Concluidos" component={ConcluidosScreen} />
    </Tabs.Navigator>
  );
}

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
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="BoxDetail" component={BoxDetailScreen} />
          <Stack.Screen name="Termo" component={TermoScreen} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
