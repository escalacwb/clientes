import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export async function setToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function setUserInfo(info: { role: string; name?: string; user_id?: number | null }) {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(info));
}

export async function getUserInfo(): Promise<{ role: string; name?: string; user_id?: number | null } | null> {
  const value = await AsyncStorage.getItem(USER_KEY);
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function clearUserInfo() {
  await AsyncStorage.removeItem(USER_KEY);
}
