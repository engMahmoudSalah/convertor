import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api';
export interface Plan { id: string; name: string; price_usd: number; price_egp: number; heavy_daily: number; ai_daily: number; max_mb: number; history_days: number; max_files: number; saved_max: number; saved_mb: number; ads: number }
import { HEAVY_TOOLS } from './heavy';
/** Built-in plan table, shown only when the server cannot supply plans (degraded mode). Mirrors the seeded defaults. */
const DEFAULT_PLANS: any[] = [
  { id: 'guest', name: 'Guest', price_usd: 0, price_egp: 0, heavy_daily: 3, ai_daily: 0, max_mb: 25, history_days: 0, max_files: 5, saved_max: 0, saved_mb: 0, ads: 2, sort: 0 },
  { id: 'free', name: 'Free', price_usd: 0, price_egp: 0, heavy_daily: 10, ai_daily: 3, max_mb: 50, history_days: 0, max_files: 10, saved_max: 10, saved_mb: 10, ads: 2, sort: 1 },
  { id: 'pro', name: 'Pro', price_usd: 5, price_egp: 249, heavy_daily: 100000, ai_daily: 100, max_mb: 500, history_days: 30, max_files: 50, saved_max: 50, saved_mb: 100, ads: 1, sort: 2 },
  { id: 'business', name: 'Business', price_usd: 15, price_egp: 749, heavy_daily: 100000, ai_daily: 500, max_mb: 2000, history_days: 90, max_files: 100, saved_max: 200, saved_mb: 400, ads: 0, sort: 3 }];
interface Ctx { google?: boolean; heavy?: string[]; ads?: { client: string | null; live: boolean } | null; adminExists: boolean; user: any; plan: Plan | null; usage: Record<string, number>; plans: Plan[]; disabled: string[]; loading: boolean; refresh: () => Promise<void>; logout: () => Promise<void> }
const C = createContext<Ctx>({} as Ctx);
export const useAuth = () => useContext(C);
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [s, setS] = useState<any>({ user: null, plan: null, usage: {}, plans: [], disabled: [], loading: true });
  const refresh = useCallback(async () => {
    const [me, cfg] = await Promise.all([api('/me'), api('/config')]);
    setS({ user: me.user ?? null, plan: me.plan ?? null, usage: me.usage ?? {}, adminExists: me.adminExists ?? true, plans: cfg.plans?.length ? cfg.plans : DEFAULT_PLANS, disabled: cfg.disabled ?? [], heavy: cfg.heavy?.length ? cfg.heavy : [...HEAVY_TOOLS], google: !!cfg.google, ads: cfg.ads ?? null, loading: false });
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const logout = async () => { await api('/auth/logout', {}); await refresh(); };
  return <C.Provider value={{ ...s, refresh, logout }}>{children}</C.Provider>;
};
