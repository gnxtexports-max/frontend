import { createContext, useContext, useState, useEffect, useCallback } from "react";

const API = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem("gnxt_user");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem("gnxt_user");
      return !cached; // If we have a cached user, don't show full-page load
    } catch {
      return true;
    }
  });

  // Check session on mount
  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setUser(res.data);
          localStorage.setItem("gnxt_user", JSON.stringify(res.data));
        } else {
          setUser(null);
          localStorage.removeItem("gnxt_user");
        }
      })
      .catch((err) => {
        console.warn("[AuthContext] Silent session validation failed:", err.message);
        // Do NOT clear user on network failure, to support offline usage
      })
      .finally(() => setLoading(false));
  }, []);

  // Listen for global unauthorized events to automatically clear local session
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      localStorage.removeItem("gnxt_user");
    };
    window.addEventListener("unauthorized-access", handleUnauthorized);
    return () => window.removeEventListener("unauthorized-access", handleUnauthorized);
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Login failed");
    setUser(data.user);
    localStorage.setItem("gnxt_user", JSON.stringify(data.user));
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await fetch(`${API}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    setUser(null);
    localStorage.removeItem("gnxt_user");
  }, []);

  const hasGranularPermission = useCallback((key) => {
    if (user?.role === "Super Admin") return true;
    if (!user?.granularPermissions) return false;
    return !!user.granularPermissions[key];
  }, [user]);

  const hasPermission = useCallback((moduleName, action) => {
    if (user?.role === "Super Admin") return true;
    if (!user?.permissions) return false;
    const perm = user.permissions.find(p => p.module?.toLowerCase() === moduleName?.toLowerCase());
    if (!perm) return false;
    return !!perm[action?.toLowerCase()];
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token: "session", loading, login, logout, isAuthenticated: !!user, hasPermission, hasGranularPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
