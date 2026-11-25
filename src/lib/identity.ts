export type Identity = 'paper' | 'forest';
export const applyIdentity = (v?: Identity) => {
  try {
    const q = new URLSearchParams(window.location.search).get('identity');
    const id = v ?? (q === 'forest' || q === 'paper' ? q : localStorage.getItem('mc_id')) ?? 'paper';
    localStorage.setItem('mc_id', id); document.documentElement.dataset.id = id;
  } catch { /* ignore */ }
};
export const currentIdentity = (): Identity => (document.documentElement.dataset.id === 'forest' ? 'forest' : 'paper');
