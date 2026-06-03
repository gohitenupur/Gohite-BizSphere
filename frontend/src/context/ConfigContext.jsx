import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useBusiness } from './BusinessContext.jsx';
import { useAuth } from './AuthContext.jsx';
import { apiRequest } from '../services/api.js';

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const { business } = useBusiness();
  const { isAuthenticated } = useAuth();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!isAuthenticated || !business?.id) {
      setConfig(null);
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest('/api/config/effective');
      setConfig(res.data);
    } catch {
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, business?.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <ConfigContext.Provider value={{ config, loading, reload }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
