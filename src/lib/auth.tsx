import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api';
export interface Plan { id: string; name: string; price_usd: number; price_egp: number; heavy_daily: number; ai_daily: number; max_mb: number; history_days: number; max_files: number; saved_max: number; saved_mb: number; ads: number }
interface Ctx { ads?: { client: string | null; live: boolean } | null; adminExists: boolean; user: any; plan: Plan | null; usage: Record<string, number>; plans: Plan[]; disabled: string[]; loading: boolean; refresh: () => Promise<void>; logout: () => Promise<void> }
const C = createContext<Ctx>({} as Ctx);
export const useAuth = () => useContext(C);
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [s, setS] = useState<any>({ user: null, plan: null, usage: {}, plans: [], disabled: [], loading: true });
  const refresh = useCallback(async () => {
    const [me, cfg] = await Promise.all([api('/me'), api('/config')]);
    setS({ user: me.user ?? null, plan: me.plan ?? null, usage: me.usage ?? {}, adminExists: me.adminExists ?? true, plans: cfg.plans ?? [], disabled: cfg.disabled ?? [], ads: cfg.ads ?? null, loading: false });
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const logout = async () => { await api('/auth/logout', {}); await refresh(); };
  return <C.Provider value={{ ...s, refresh, logout }}>{children}</C.Provider>;
};
