import type { LucideIcon } from 'lucide-react';
export type Opt =
  | { key: string; label: string; type: 'text'; default: string; hint?: string }
  | { key: string; label: string; type: 'number'; default: number; min?: number; max?: number }
  | { key: string; label: string; type: 'select'; default: string; options: { v: string; l: string }[] }
  | { key: string; label: string; type: 'check'; default: boolean }
  | { key: string; label: string; type: 'color'; default: string }
  | { key: string; label: string; type: 'file'; default: null };
export interface Out { name: string; blob: Blob; note?: string }
export interface Ctx { progress: (done: number, total: number, msg?: string) => void }
export type Category = 'organize' | 'optimize' | 'to-pdf' | 'from-pdf' | 'edit' | 'image' | 'doc' | 'security';
export interface Tool {
  id: string; title: string; desc: string; category: Category; icon: LucideIcon;
  accept: string[]; multiple: boolean; options?: Opt[]; minFiles?: number;
  run: (files: File[], o: Record<string, any>, c: Ctx) => Promise<Out[]>;
}
