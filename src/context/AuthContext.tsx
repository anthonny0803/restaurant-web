import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { User } from "../types/api";
import * as authService from "../services/auth.service";
import { setStoredToken, removeStoredToken } from "../lib/api";

const USER_KEY = "auth_user";

function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function setStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function removeStoredUser(): void {
  localStorage.removeItem(USER_KEY);
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (body: {
    name: string;
    email: string;
    email_confirmation: string;
    phone: string;
    password: string;
    password_confirmation: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (user: User, token: string) => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser);

  const saveSession = useCallback((user: User, token: string) => {
    setStoredToken(token);
    setStoredUser(user);
    setUser(user);
  }, []);

  const clearSession = useCallback(() => {
    removeStoredToken();
    removeStoredUser();
    setUser(null);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authService.login({ email, password });
      saveSession(response.data.user, response.data.token);
    },
    [saveSession],
  );

  const updateUser = useCallback((user: User) => {
    setStoredUser(user);
    setUser(user);
  }, []);

  const register = useCallback(
    async (body: {
      name: string;
      email: string;
      email_confirmation: string;
      phone: string;
      password: string;
      password_confirmation: string;
    }) => {
      const response = await authService.register(body);
      saveSession(response.data.user, response.data.token);
    },
    [saveSession],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
      setSession: saveSession,
      updateUser,
    }),
    [user, login, register, logout, saveSession, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
