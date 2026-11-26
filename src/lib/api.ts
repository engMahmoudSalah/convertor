export async function api<T = any>(path: string, body?: unknown): Promise<T & { _status: number }> {
  const r = await fetch('/api' + path, body === undefined ? { credentials: 'same-origin', cache: path === '/config' ? 'no-cache' : 'default' } : { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  let j: any = {}; try { j = await r.json(); } catch { /* empty */ }
  return { ...j, _status: r.status };
}
