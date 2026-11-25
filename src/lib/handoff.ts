let pending: File[] = [];
export const setPending = (f: File[]) => { pending = f; };
export const takePending = () => { const p = pending; pending = []; return p; };
const EXT: Record<string, string> = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', bmp: 'image/bmp', svg: 'image/svg+xml', html: 'text/html', htm: 'text/html', txt: 'text/plain', md: 'text/markdown', csv: 'text/csv', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
export const guessType = (f: File) => f.type || EXT[(f.name.split('.').pop() ?? '').toLowerCase()] || '';
const key = 'mc_recent';
export const getRecent = (): string[] => { try { return JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { return []; } };
export const addRecent = (id: string) => { try { localStorage.setItem(key, JSON.stringify([id, ...getRecent().filter((x) => x !== id)].slice(0, 6))); } catch { /* ignore */ } };
