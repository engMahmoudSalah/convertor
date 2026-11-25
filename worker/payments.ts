// Payment layer: providers share one interface so Paddle (or others) can be added later.
export interface Order { id: string; plan: string; amount: number; currency: string; email: string; name: string }
export interface WebhookResult { orderId: string; ok: boolean; txId: string; amount: number; currency: string }
export interface Provider {
  id: string; currency: string;
  configured(env: any): boolean;
  checkout(env: any, o: Order, origin: string): Promise<{ url: string; ref: string }>;
  webhook(env: any, url: URL, body: any): Promise<WebhookResult | null>;
}
const enc = new TextEncoder();
export async function hmacSha512(secret: string, msg: string) {
  const k = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(msg)))].map((x) => x.toString(16).padStart(2, '0')).join('');
}
const eq = (a: string, b: string) => { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };
const g = (o: any, p: string) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
// Order of fields in Paymob's transaction-processed HMAC (values taken from body.obj).
export const PAYMOB_HMAC_KEYS = ['amount_cents', 'created_at', 'currency', 'error_occured', 'has_parent_transaction', 'id', 'integration_id', 'is_3d_secure', 'is_auth', 'is_capture', 'is_refunded', 'is_standalone_payment', 'is_voided', 'order.id', 'owner', 'pending', 'source_data.pan', 'source_data.sub_type', 'source_data.type', 'success'];
export const paymobString = (obj: any) => PAYMOB_HMAC_KEYS.map((k) => String(g(obj, k))).join('');

export const paymob: Provider = {
  id: 'paymob', currency: 'EGP',
  configured: (env) => !!(env.PAYMOB_SECRET_KEY && env.PAYMOB_PUBLIC_KEY && env.PAYMOB_INTEGRATION_IDS && env.PAYMOB_HMAC),
  async checkout(env, o, origin) {
    const ids = String(env.PAYMOB_INTEGRATION_IDS).split(',').map((s) => Number(s.trim())).filter(Boolean);
    const [first, ...rest] = (o.name || 'Customer').split(' ');
    const r = await fetch(`${env.PAYMOB_API_BASE || 'https://accept.paymob.com'}/v1/intention/`, {
      method: 'POST', headers: { Authorization: `Token ${env.PAYMOB_SECRET_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        amount: Math.round(o.amount * 100), currency: 'EGP', payment_methods: ids, special_reference: o.id,
        items: [{ name: `Magic Convertor ${o.plan}`, amount: Math.round(o.amount * 100), description: '30 days', quantity: 1 }],
        billing_data: { first_name: first || 'Customer', last_name: rest.join(' ') || 'Customer', email: o.email, phone_number: 'NA', apartment: 'NA', floor: 'NA', street: 'NA', building: 'NA', city: 'NA', country: 'EG', state: 'NA' },
        notification_url: `${origin}/api/webhooks/paymob`, redirection_url: `${origin}/account?paid=1`,
      }),
    });
    const d: any = await r.json().catch(() => ({}));
    if (!r.ok || !d.client_secret) throw new Error('Payment provider refused the request');
    return { url: `https://eg.checkout.paymob.com/?publicKey=${encodeURIComponent(env.PAYMOB_PUBLIC_KEY)}&clientSecret=${encodeURIComponent(d.client_secret)}`, ref: String(d.id ?? d.intention_order_id ?? '') };
  },
  async webhook(env, url, body) {
    const obj = body?.obj; const given = url.searchParams.get('hmac') ?? ''; if (!obj || !given || !env.PAYMOB_HMAC) return null;
    if (!eq(await hmacSha512(env.PAYMOB_HMAC, paymobString(obj)), given.toLowerCase())) return null;
    const ref = obj.order?.merchant_order_id ?? obj.merchant_order_id; if (!ref) return null;
    const ok = obj.success === true && obj.pending !== true && obj.is_refunded !== true && obj.is_voided !== true && obj.error_occured !== true;
    return { orderId: String(ref), ok, txId: String(obj.id), amount: Number(obj.amount_cents) / 100, currency: String(obj.currency) };
  },
};
export const PROVIDERS: Record<string, Provider> = { paymob };
