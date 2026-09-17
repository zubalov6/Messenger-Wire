import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getToken, setToken as persistToken } from "../api/client";
import { fetchMe, login as loginRequest, register as registerRequest } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | authed | guest

  const loadMe = useCallback(async () => {
    if (!getToken()) {
      setStatus("guest");
      return;
    }
    try {
      const me = await fetchMe();
      setUser(me);
      setStatus("authed");
    } catch {
      persistToken(null);
      setUser(null);
      setStatus("guest");
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = useCallback(async (loginValue, password) => {
    const data = await loginRequest(loginValue, password);
    persistToken(data.access_token);
    const me = await fetchMe();
    setUser(me);
    setStatus("authed");
  }, []);

  const register = useCallback(async (loginValue, password) => {
    await registerRequest(loginValue, password);
    await login(loginValue, password);
  }, [login]);

  const logout = useCallback(() => {
    persistToken(null);
    setUser(null);
    setStatus("guest");
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
