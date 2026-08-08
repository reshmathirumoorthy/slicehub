import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api, {
  clearAdminToken,
  getAdminToken,
  setAdminToken,
} from '../services/api';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(Boolean(getAdminToken()));

  const refresh = useCallback(async () => {
    if (!getAdminToken()) {
      setAdmin(null);
      setLoading(false);
      return null;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/admin/auth/me');
      const profile = data.data?.admin || data.data;
      setAdmin(profile);
      return profile;
    } catch {
      clearAdminToken();
      setAdmin(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async ({ email, password }) => {
    const { data } = await api.post('/admin/auth/login', { email, password });
    setAdminToken(data.data.token);
    setAdmin(data.data.admin);
    return data.data.admin;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/admin/auth/logout');
    } catch {
      /* ignore */
    }
    clearAdminToken();
    setAdmin(null);
  }, []);

  const value = useMemo(
    () => ({
      admin,
      loading,
      isAuthenticated: Boolean(admin),
      login,
      logout,
      refresh,
    }),
    [admin, loading, login, logout, refresh],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return ctx;
};
