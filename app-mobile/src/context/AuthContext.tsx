import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { clearToken, clearUserInfo, getToken, getUserInfo, setToken, setUserInfo } from "../storage/auth";

type AuthContextValue = {
  isLoading: boolean;
  isAuthed: boolean;
  role: string | null;
  signIn: (token: string, role: string, name?: string, userId?: number | null) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function bootstrap() {
      const token = await getToken();
      const info = await getUserInfo();
      setIsAuthed(Boolean(token));
      setRole(info?.role || null);
      setIsLoading(false);
    }
    bootstrap();
  }, []);

  const value = useMemo(
    () => ({
      isLoading,
      isAuthed,
      role,
      signIn: async (token: string, userRole: string, name?: string, userId?: number | null) => {
        await setToken(token);
        await setUserInfo({ role: userRole, name, user_id: userId ?? null });
        setIsAuthed(true);
        setRole(userRole);
      },
      signOut: async () => {
        await clearToken();
        await clearUserInfo();
        setIsAuthed(false);
        setRole(null);
      },
    }),
    [isLoading, isAuthed, role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
