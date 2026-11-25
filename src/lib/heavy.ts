// Single source of truth: tools that count against the daily "advanced jobs" limit.
// Used by the Worker (enforcement) and the UI (marks, Pricing list, FAQ), so they cannot drift apart.
export const HEAVY_TOOLS = ['compress-pdf', 'pdf-to-images', 'pdf-to-word', 'pdf-to-excel', 'pdf-to-powerpoint', 'redact-pdf', 'unlock-pdf', 'repair-pdf'] as const;
export const isHeavy = (id: string) => (HEAVY_TOOLS as readonly string[]).includes(id);
