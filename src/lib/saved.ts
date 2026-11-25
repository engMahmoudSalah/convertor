import { api } from './api';
export const MAX_STORE = 3 * 1024 * 1024;
const b64 = (b: Blob) => new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] ?? ''); r.readAsDataURL(b); });
/** Saves the operation record, then the result file in chunks when it is small enough. */
export async function saveOperation(meta: Record<string, unknown>, blob?: Blob | null): Promise<{ ok: boolean; error?: string; stored: boolean }> {
  const r = await api('/saved', meta); if (r._status >= 400) return { ok: false, error: r.error ?? 'Could not save', stored: false };
  if (!blob || blob.size > MAX_STORE) return { ok: true, stored: false };
  const CH = 600 * 1024; const n = Math.ceil(blob.size / CH);
  for (let i = 0; i < n; i++) {
    const q = await api('/saved/blob', { id: r.id, idx: i, data: await b64(blob.slice(i * CH, (i + 1) * CH)), last: i === n - 1 });
    if (q._status >= 400) return { ok: true, stored: false, error: q.error };
  }
  return { ok: true, stored: true };
}
export async function fetchSavedFile(id: string): Promise<Blob | null> {
  const r = await fetch('/api/saved/file?id=' + encodeURIComponent(id), { credentials: 'same-origin' }); return r.ok ? r.blob() : null;
}
