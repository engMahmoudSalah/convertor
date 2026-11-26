// Magic Convertor backend: one Worker + one SQLite-backed Durable Object.
import { DurableObject } from 'cloudflare:workers';
import { PROVIDERS } from './payments';
import { HEAVY_TOOLS } from '../src/lib/heavy';
import { seoPage, sitemap, robots, adsTxt } from './seo';

const HEAVY = new Set<string>(HEAVY_TOOLS);
const enc = new TextEncoder();
const hex = (b: ArrayBuffer | Uint8Array) => [...new Uint8Array(b as ArrayBuffer)].map((x) => x.toString(16).padStart(2, '0')).join('');
const sha = async (s: string) => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
const rnd = (n = 32) => hex(crypto.getRandomValues(new Uint8Array(n)));
const day = () => new Date().toISOString().slice(0, 10);
const now = () => Date.now();
function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers } });
}
async function pbkdf2(pw: string, salt: string) {
  const k = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 100000 }, k, 256));
}
const safeEq = (a: string, b: string) => { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };

export class AppDB extends DurableObject<any> {
  sql: any;
  constructor(state: DurableObjectState, env: any) {
    super(state, env); this.sql = state.storage.sql;
    // Migrations run once per schema version. Re-running them on every cold start burned the free Durable Object read quota.
    this.sql.exec('CREATE TABLE IF NOT EXISTS meta(k TEXT PRIMARY KEY, v TEXT)');
    const sv = this.sql.exec("SELECT v FROM meta WHERE k='schema'").toArray()[0]?.v;
    if (sv !== '4') {
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT, pass_hash TEXT, salt TEXT, plan TEXT DEFAULT 'free', role TEXT DEFAULT 'user', banned INTEGER DEFAULT 0, created_at INTEGER, last_login INTEGER);
      CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id TEXT, created_at INTEGER, expires_at INTEGER);
      CREATE TABLE IF NOT EXISTS usage(subject TEXT, day TEXT, kind TEXT, n INTEGER DEFAULT 0, PRIMARY KEY(subject, day, kind));
      CREATE TABLE IF NOT EXISTS history(id INTEGER PRIMARY KEY AUTOINCREMENT, subject TEXT, tool TEXT, files INTEGER, bytes INTEGER, ms INTEGER, ts INTEGER);
      CREATE TABLE IF NOT EXISTS saved(id TEXT PRIMARY KEY, user_id TEXT, tool TEXT, name TEXT, opts TEXT, files TEXT, summary TEXT, ts INTEGER);
      CREATE TABLE IF NOT EXISTS plans(id TEXT PRIMARY KEY, name TEXT, price_usd REAL, price_egp REAL, heavy_daily INTEGER, ai_daily INTEGER, max_mb INTEGER, history_days INTEGER, sort INTEGER);
      CREATE TABLE IF NOT EXISTS flags(tool TEXT PRIMARY KEY, enabled INTEGER DEFAULT 1);
      CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER, actor TEXT, action TEXT, target TEXT, detail TEXT);
      CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY, user_id TEXT, plan TEXT, provider TEXT, amount REAL, currency TEXT, status TEXT, ref TEXT, tx_id TEXT, created_at INTEGER, paid_at INTEGER);
      CREATE TABLE IF NOT EXISTS tokens(hash TEXT PRIMARY KEY, user_id TEXT, kind TEXT, expires_at INTEGER);
      CREATE TABLE IF NOT EXISTS attempts(k TEXT PRIMARY KEY, n INTEGER, reset_at INTEGER);
    `);
    try { this.sql.exec('ALTER TABLE users ADD COLUMN plan_until INTEGER'); } catch { /* exists */ }
    try { this.sql.exec('ALTER TABLE users ADD COLUMN google_sub TEXT'); } catch { /* exists */ }
    try { this.sql.exec('ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0'); } catch { /* exists */ }
    for (const c of ['max_files INTEGER', 'saved_max INTEGER', 'saved_mb INTEGER', 'ads INTEGER']) { try { this.sql.exec('ALTER TABLE plans ADD COLUMN ' + c); } catch { /* exists */ } }
    this.sql.exec("UPDATE plans SET max_files=COALESCE(max_files, CASE id WHEN 'guest' THEN 5 WHEN 'free' THEN 10 WHEN 'pro' THEN 50 ELSE 100 END), saved_max=COALESCE(saved_max, CASE id WHEN 'guest' THEN 0 WHEN 'free' THEN 10 WHEN 'pro' THEN 50 ELSE 200 END), saved_mb=COALESCE(saved_mb, CASE id WHEN 'guest' THEN 0 WHEN 'free' THEN 10 WHEN 'pro' THEN 100 ELSE 400 END), ads=CASE id WHEN 'pro' THEN 1 WHEN 'business' THEN 0 ELSE 2 END WHERE max_files IS NULL");
    this.sql.exec('CREATE TABLE IF NOT EXISTS saved_blob(saved_id TEXT, idx INTEGER, data TEXT, PRIMARY KEY(saved_id, idx))');
    for (const c of ['out_name TEXT', 'out_size INTEGER', 'out_mime TEXT', 'has_file INTEGER DEFAULT 0']) { try { this.sql.exec('ALTER TABLE saved ADD COLUMN ' + c); } catch { /* exists */ } }
    if (!this.sql.exec('SELECT 1 FROM plans LIMIT 1').toArray().length) {
      const P = this.sql;
      P.exec(`INSERT INTO plans(id,name,price_usd,price_egp,heavy_daily,ai_daily,max_mb,history_days,sort) VALUES('guest','Guest',0,0,3,0,25,0,0),('free','Free',0,0,10,3,50,0,1),('pro','Pro',5,249,100000,100,500,30,2),('business','Business',15,749,100000,500,2000,90,3)`);
    }
    this.sql.exec("UPDATE plans SET max_files=CASE id WHEN 'guest' THEN 5 WHEN 'free' THEN 10 WHEN 'pro' THEN 50 ELSE 100 END, saved_max=CASE id WHEN 'guest' THEN 0 WHEN 'free' THEN 10 WHEN 'pro' THEN 50 ELSE 200 END, saved_mb=CASE id WHEN 'guest' THEN 0 WHEN 'free' THEN 10 WHEN 'pro' THEN 100 ELSE 400 END, ads=CASE id WHEN 'pro' THEN 1 WHEN 'business' THEN 0 ELSE 2 END WHERE max_files IS NULL");
      this.sql.exec("INSERT OR REPLACE INTO meta(k,v) VALUES('schema','4')");
    }
  }
  rows(q: string, ...a: any[]) { return this.sql.exec(q, ...a).toArray() as any[]; }
  audit(actor: string, action: string, target = '', detail = '') { this.sql.exec('INSERT INTO audit(ts,actor,action,target,detail) VALUES(?,?,?,?,?)', now(), actor, action, target, detail); }
  private adminSeen = false;
  adminExists() { if (this.adminSeen) return true; this.adminSeen = this.rows("SELECT 1 FROM users WHERE role='admin' LIMIT 1").length > 0; return this.adminSeen; }
  plan(id: string) { return this.rows('SELECT * FROM plans WHERE id=?', id)[0] ?? this.rows("SELECT * FROM plans WHERE id='free'")[0]; }
  async user(req: Request) {
    const m = /(?:^|;\s*)mc_session=([a-f0-9]{64})/.exec(req.headers.get('cookie') ?? ''); if (!m) return null;
    const r = this.rows('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?', await sha(m[1]), now())[0];
    if (r && r.plan_until && r.plan_until < now() && r.plan !== 'free') { this.sql.exec("UPDATE users SET plan='free', plan_until=NULL WHERE id=?", r.id); this.audit('system', 'plan_expired', r.email, r.plan); r.plan = 'free'; r.plan_until = null; }
    return r && !r.banned ? r : null;
  }
  async mail(to: string, subject: string, text: string, html: string) {
    const key = this.env.RESEND_KEY; if (!key) { if (this.env.MAIL_DEBUG) console.log('MAILDEBUG ' + text); this.audit('system', 'mail_skipped', to, subject); return false; }
    try {
      const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' }, body: JSON.stringify({ from: this.env.MAIL_FROM || 'Magic Convertor <onboarding@resend.dev>', to: [to], subject, text, html }) });
      if (!r.ok) { this.audit('system', 'mail_failed', to, String(r.status)); return false; }
      return true;
    } catch { this.audit('system', 'mail_failed', to, 'network'); return false; }
  }
  async makeToken(userId: string, kind: string, ttlMs: number) {
    this.sql.exec('DELETE FROM tokens WHERE user_id=? AND kind=?', userId, kind);
    const t = rnd(32); this.sql.exec('INSERT INTO tokens(hash,user_id,kind,expires_at) VALUES(?,?,?,?)', await sha(t), userId, kind, now() + ttlMs); return t;
  }
  async sendVerify(u: any, origin: string) {
    const t = await this.makeToken(u.id, 'verify', 48 * 3600e3), link = `${origin}/verify?token=${t}`;
    return this.mail(u.email, 'Confirm your email for Magic Convertor', `Confirm your email: ${link}\n\nThis link works for 48 hours. If you did not sign up, ignore this email.`, `<p>Confirm your email for Magic Convertor:</p><p><a href="${link}">Confirm email</a></p><p>This link works for 48 hours. If you did not sign up, ignore this email.</p>`);
  }
  pub(u: any) { return u && { id: u.id, email: u.email, name: u.name, plan: u.plan, plan_until: u.plan_until ?? null, role: u.role, created_at: u.created_at, email_verified: !!u.email_verified, has_password: !!u.pass_hash, google: !!u.google_sub }; }
  limit(key: string, max: number, windowMs: number) {
    const r = this.rows('SELECT * FROM attempts WHERE k=?', key)[0];
    if (!r || r.reset_at < now()) { this.sql.exec('INSERT OR REPLACE INTO attempts VALUES(?,?,?)', key, 1, now() + windowMs); return true; }
    if (r.n >= max) { if (r.n === max) { this.sql.exec('UPDATE attempts SET n=n+1 WHERE k=?', key); this.audit('system', 'rate_limited', key.split(':')[0], 'limit ' + max); } return false; }
    this.sql.exec('UPDATE attempts SET n=n+1 WHERE k=?', key); return true;
  }
  async startSession(uid: string) {
    const t = rnd(32); this.sql.exec('INSERT INTO sessions VALUES(?,?,?,?)', await sha(t), uid, now(), now() + 30 * 864e5);
    return `mc_session=${t}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 86400}`;
  }
  usageToday(subject: string) { const o: Record<string, number> = { heavy: 0, ai: 0 }; this.rows('SELECT kind,n FROM usage WHERE subject=? AND day=?', subject, day()).forEach((r) => (o[r.kind] = r.n)); return o; }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url); const path = url.pathname.replace(/^\/api/, ''); const method = req.method;
    const ip = req.headers.get('cf-connecting-ip') ?? 'x';
    if (method !== 'GET') {
      if (!(req.headers.get('content-type') ?? '').includes('application/json')) return json({ error: 'JSON required' }, 415);
      const o = req.headers.get('origin'); if (o && new URL(o).host !== url.host) return json({ error: 'Bad origin' }, 403);
    }
    let body: any = {}; if (method !== 'GET') { try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); } }
    const u = await this.user(req);
    const subject = u ? u.id : `ip:${(await sha(ip)).slice(0, 16)}`;

    if (path === '/config' && method === 'GET') {
      return json({ plans: this.rows('SELECT * FROM plans ORDER BY sort'), disabled: this.rows('SELECT tool FROM flags WHERE enabled=0').map((r) => r.tool), heavy: [...HEAVY], google: !!(this.env.GOOGLE_CLIENT_ID && this.env.GOOGLE_CLIENT_SECRET), ads: { client: this.env.ADSENSE_PUB ? String(this.env.ADSENSE_PUB) : null, live: this.env.ADS_LIVE === '1' } });
    }
    if (path === '/auth/signup' && method === 'POST') {
      if (!this.limit(`su:${ip}`, 10, 3600e3)) return json({ error: 'Too many attempts, try later' }, 429);
      const email = String(body.email ?? '').trim().toLowerCase(), pw = String(body.password ?? ''), name = String(body.name ?? '').trim().slice(0, 60);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 120) return json({ error: 'Enter a valid email' }, 400);
      if (pw.length < 8 || pw.length > 200) return json({ error: 'Password must be at least 8 characters' }, 400);
      if (this.rows('SELECT 1 FROM users WHERE email=?', email).length) return json({ error: 'Email already registered' }, 409);
      const id = 'u_' + rnd(8), salt = rnd(16); this.sql.exec('INSERT INTO users(id,email,name,pass_hash,salt,created_at,last_login) VALUES(?,?,?,?,?,?,?)', id, email, name, await pbkdf2(pw, salt), salt, now(), now());
      this.audit(id, 'signup', email);
      this.ctx.waitUntil(this.sendVerify({ id, email }, new URL(req.url).origin));
      return json({ user: this.pub(this.rows('SELECT * FROM users WHERE id=?', id)[0]) }, 200, { 'set-cookie': await this.startSession(id) });
    }
    if (path === '/auth/delete' && method === 'POST') {
      if (!u) return json({ error: 'Sign in first' }, 401);
      if (u.role === 'admin') return json({ error: 'Admin accounts cannot be deleted here' }, 400);
      if (!this.limit(`del:${u.id}`, 5, 900e3)) return json({ error: 'Too many attempts, try again later' }, 429);
      if (u.pass_hash ? !safeEq(await pbkdf2(String(body.password ?? ''), u.salt), u.pass_hash) : String(body.password ?? '').trim().toLowerCase() !== u.email) return json({ error: u.pass_hash ? 'Wrong password' : 'Type your account email to confirm' }, 401);
      this.sql.exec('DELETE FROM saved_blob WHERE saved_id IN (SELECT id FROM saved WHERE user_id=?)', u.id); this.sql.exec('DELETE FROM saved WHERE user_id=?', u.id);
      this.sql.exec('DELETE FROM history WHERE subject=?', u.id); this.sql.exec('DELETE FROM sessions WHERE user_id=?', u.id); this.sql.exec('DELETE FROM users WHERE id=?', u.id);
      this.audit(u.email, 'delete_account', u.email, '');
      return json({ ok: true }, 200, { 'set-cookie': 'mc_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0' });
    }
    if (path === '/auth/google/start' && method === 'GET') {
      if (!this.env.GOOGLE_CLIENT_ID || !this.env.GOOGLE_CLIENT_SECRET) return new Response(null, { status: 302, headers: { location: '/login?error=google_off' } });
      if (!this.limit(`gs:${ip}`, 30, 900e3)) return new Response(null, { status: 302, headers: { location: '/login?error=rate' } });
      const state = rnd(16), verifier = rnd(32), challenge = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(verifier))))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const nx = url.searchParams.get('next') ?? ''; const next = nx.startsWith('/') && !nx.startsWith('//') && nx.length < 200 ? nx : '/account';
      const q = new URLSearchParams({ client_id: String(this.env.GOOGLE_CLIENT_ID), redirect_uri: `${url.origin}/api/auth/google/callback`, response_type: 'code', scope: 'openid email profile', state, code_challenge: challenge, code_challenge_method: 'S256', prompt: 'select_account' });
      const h = new Headers({ location: 'https://accounts.google.com/o/oauth2/v2/auth?' + q });
      h.append('set-cookie', `mc_oauth=${state}.${verifier}.${encodeURIComponent(next)}; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
      return new Response(null, { status: 302, headers: h });
    }
    if (path === '/auth/google/callback' && method === 'GET') {
      const fail = (c: string) => { const h = new Headers({ location: '/login?error=' + c }); h.append('set-cookie', 'mc_oauth=; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=0'); return new Response(null, { status: 302, headers: h }); };
      const m = /(?:^|;\s*)mc_oauth=([a-f0-9]{32})\.([a-f0-9]{64})\.([^;]*)/.exec(req.headers.get('cookie') ?? '');
      const code = url.searchParams.get('code') ?? '', st = url.searchParams.get('state') ?? '';
      if (!m || !code || !safeEq(m[1], st)) return fail('google_state');
      let tok: any; try {
        const r = await fetch(String(this.env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token'), { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: String(this.env.GOOGLE_CLIENT_ID), client_secret: String(this.env.GOOGLE_CLIENT_SECRET), redirect_uri: `${url.origin}/api/auth/google/callback`, grant_type: 'authorization_code', code_verifier: m[2] }) });
        if (!r.ok) return fail('google_token'); tok = await r.json();
      } catch { return fail('google_token'); }
      let c: any; try { const b64 = String(tok.id_token).split('.')[1].replace(/-/g, '+').replace(/_/g, '/'); c = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b64), (x) => x.charCodeAt(0)))); } catch { return fail('google_token'); }
      // The id_token came straight from Google's token endpoint over TLS (OIDC Core 3.1.3.7); still check the claims.
      if (!['https://accounts.google.com', 'accounts.google.com'].includes(c.iss) || c.aud !== String(this.env.GOOGLE_CLIENT_ID) || !(c.exp * 1000 > now()) || !c.sub || !c.email || c.email_verified !== true) return fail('google_claims');
      const email = String(c.email).toLowerCase();
      let r = this.rows('SELECT * FROM users WHERE google_sub=?', String(c.sub))[0] ?? this.rows('SELECT * FROM users WHERE email=?', email)[0];
      if (r && r.banned) return fail('banned');
      if (!r) {
        const id = 'u_' + rnd(8); this.sql.exec('INSERT INTO users(id,email,name,google_sub,email_verified,created_at,last_login) VALUES(?,?,?,?,1,?,?)', id, email, String(c.name ?? '').slice(0, 60), String(c.sub), now(), now());
        this.audit(id, 'signup_google', email); r = this.rows('SELECT * FROM users WHERE id=?', id)[0];
      } else if (!r.google_sub) {
        // Link to the existing email account. An unverified password account could belong to an attacker, so drop its password and sessions.
        if (!r.email_verified) { this.sql.exec('UPDATE users SET pass_hash=NULL, salt=NULL WHERE id=?', r.id); this.sql.exec('DELETE FROM sessions WHERE user_id=?', r.id); }
        this.sql.exec('UPDATE users SET google_sub=?, email_verified=1 WHERE id=?', String(c.sub), r.id); this.audit(r.id, 'google_linked', email);
      }
      this.sql.exec('UPDATE users SET last_login=? WHERE id=?', now(), r.id);
      let next = '/account'; try { const n = decodeURIComponent(m[3]); if (n.startsWith('/') && !n.startsWith('//')) next = n; } catch { /* default */ }
      const h = new Headers({ location: next }); h.append('set-cookie', await this.startSession(r.id)); h.append('set-cookie', 'mc_oauth=; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
      return new Response(null, { status: 302, headers: h });
    }
    if (path === '/auth/login' && method === 'POST') {
      const email = String(body.email ?? '').trim().toLowerCase();
      if (!this.limit(`li:${ip}:${email}`, 8, 900e3)) return json({ error: 'Too many attempts, try again in 15 minutes' }, 429);
      const r = this.rows('SELECT * FROM users WHERE email=?', email)[0];
      const ok = r && r.pass_hash && safeEq(await pbkdf2(String(body.password ?? ''), r.salt), r.pass_hash);
      if (!ok) return json({ error: 'Wrong email or password' }, 401);
      if (r.banned) return json({ error: 'This account is suspended' }, 403);
      this.sql.exec('UPDATE users SET last_login=? WHERE id=?', now(), r.id);
      return json({ user: this.pub(r) }, 200, { 'set-cookie': await this.startSession(r.id) });
    }
    if (path === '/auth/forgot' && method === 'POST') {
      const email = String(body.email ?? '').trim().toLowerCase();
      if (!this.limit(`fg:${ip}`, 5, 3600e3) || !this.limit(`fgm:${email}`, 3, 3600e3)) return json({ error: 'Too many attempts, try again later' }, 429);
      const r = this.rows('SELECT * FROM users WHERE email=? AND banned=0', email)[0];
      if (r) { const t = await this.makeToken(r.id, 'reset', 3600e3), link = `${new URL(req.url).origin}/reset?token=${t}`; this.audit(r.id, 'reset_requested', r.email); this.ctx.waitUntil(this.mail(r.email, 'Reset your Magic Convertor password', `Reset your password: ${link}\n\nThis link works for 1 hour. If you did not ask for it, ignore this email.`, `<p>Reset your Magic Convertor password:</p><p><a href="${link}">Choose a new password</a></p><p>This link works for 1 hour. If you did not ask for it, ignore this email.</p>`)); }
      return json({ ok: true });
    }
    if (path === '/auth/reset' && method === 'POST') {
      if (!this.limit(`rs:${ip}`, 10, 900e3)) return json({ error: 'Too many attempts, try again later' }, 429);
      const np = String(body.newPassword ?? ''); if (np.length < 8 || np.length > 200) return json({ error: 'New password must be at least 8 characters' }, 400);
      const h = await sha(String(body.token ?? '')), t = this.rows("SELECT * FROM tokens WHERE hash=? AND kind='reset' AND expires_at>?", h, now())[0];
      if (!t) return json({ error: 'This link is invalid or expired' }, 400);
      const salt = rnd(16); this.sql.exec('UPDATE users SET pass_hash=?, salt=?, email_verified=1 WHERE id=?', await pbkdf2(np, salt), salt, t.user_id);
      this.sql.exec('DELETE FROM tokens WHERE user_id=?', t.user_id); this.sql.exec('DELETE FROM sessions WHERE user_id=?', t.user_id); this.audit(t.user_id, 'password_reset', '');
      return json({ ok: true });
    }
    if (path === '/auth/verify' && method === 'POST') {
      if (!this.limit(`vf:${ip}`, 20, 900e3)) return json({ error: 'Too many attempts, try again later' }, 429);
      const t = this.rows("SELECT * FROM tokens WHERE hash=? AND kind='verify' AND expires_at>?", await sha(String(body.token ?? '')), now())[0];
      if (!t) return json({ error: 'This link is invalid or expired' }, 400);
      this.sql.exec('UPDATE users SET email_verified=1 WHERE id=?', t.user_id); this.sql.exec('DELETE FROM tokens WHERE hash=?', t.hash); this.audit(t.user_id, 'email_verified', '');
      return json({ ok: true });
    }
    if (path === '/auth/resend-verify' && method === 'POST') {
      if (!u) return json({ error: 'Sign in first' }, 401);
      if (u.email_verified) return json({ ok: true, already: true });
      if (!this.limit(`rv:${u.id}`, 3, 3600e3)) return json({ error: 'Too many attempts, try again later' }, 429);
      const sent = await this.sendVerify(u, new URL(req.url).origin);
      return json({ ok: true, sent });
    }
    if (path === '/auth/logout' && method === 'POST') {
      const m = /mc_session=([a-f0-9]{64})/.exec(req.headers.get('cookie') ?? ''); if (m) this.sql.exec('DELETE FROM sessions WHERE token_hash=?', await sha(m[1]));
      return json({ ok: true }, 200, { 'set-cookie': 'mc_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0' });
    }
    if (path === '/auth/logout-all' && method === 'POST') {
      if (!u) return json({ error: 'Sign in first' }, 401);
      this.sql.exec('DELETE FROM sessions WHERE user_id=?', u.id); this.audit(u.id, 'logout_all', u.email);
      return json({ ok: true }, 200, { 'set-cookie': 'mc_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0' });
    }
    if (path === '/auth/password' && method === 'POST') {
      if (!u) return json({ error: 'Sign in first' }, 401);
      if (!this.limit(`pw:${u.id}`, 5, 900e3)) return json({ error: 'Too many attempts, try again later' }, 429);
      const np = String(body.newPassword ?? ''); if (np.length < 8 || np.length > 200) return json({ error: 'New password must be at least 8 characters' }, 400);
      if (!u.pass_hash || !safeEq(await pbkdf2(String(body.password ?? ''), u.salt), u.pass_hash)) return json({ error: 'Wrong current password' }, 401);
      const salt = rnd(16); this.sql.exec('UPDATE users SET pass_hash=?, salt=? WHERE id=?', await pbkdf2(np, salt), salt, u.id);
      this.sql.exec('DELETE FROM sessions WHERE user_id=?', u.id); this.audit(u.id, 'password_changed', u.email);
      return json({ ok: true }, 200, { 'set-cookie': await this.startSession(u.id) });
    }
    if (path === '/me' && method === 'GET') {
      const p = this.plan(u ? u.plan : 'guest');
      return json({ user: this.pub(u), plan: p, usage: this.usageToday(subject), adminExists: this.adminExists() });
    }
    if (path === '/usage/consume' && method === 'POST') {
      const tool = String(body.tool ?? ''); const bytes = Number(body.bytes) || 0; const nfiles = Math.max(0, Math.floor(Number(body.files) || 0));
      if (this.rows('SELECT 1 FROM flags WHERE tool=? AND enabled=0', tool).length) return json({ error: 'This tool is temporarily disabled' }, 503);
      const p = this.plan(u ? u.plan : 'guest');
      if (bytes > p.max_mb * 1048576) return json({ error: `File limit for your plan is ${p.max_mb} MB`, upgrade: true }, 413);
      if (nfiles > p.max_files) return json({ error: `Your plan allows up to ${p.max_files} files per batch`, upgrade: true, plan: p.id }, 413);
      const kind = body.ai ? 'ai' : HEAVY.has(tool) ? 'heavy' : null;
      if (kind) {
        const used = this.usageToday(subject)[kind] ?? 0; const max = kind === 'ai' ? p.ai_daily : p.heavy_daily;
        if (used >= max) return json({ error: kind === 'ai' ? `Daily AI limit reached (${max}).` : `Daily limit for advanced tools reached (${max}).`, upgrade: true, plan: p.id }, 429);
        this.sql.exec('INSERT INTO usage VALUES(?,?,?,1) ON CONFLICT(subject,day,kind) DO UPDATE SET n=n+1', subject, day(), kind);
      }
      return json({ ok: true, usage: this.usageToday(subject) });
    }
    if (path === '/history' && method === 'POST') {
      this.sql.exec('INSERT INTO history(subject,tool,files,bytes,ms,ts) VALUES(?,?,?,?,?,?)', subject, String(body.tool ?? '').slice(0, 40), Number(body.files) || 0, Number(body.bytes) || 0, Number(body.ms) || 0, now());
      return json({ ok: true });
    }
    if (path === '/history' && method === 'GET') {
      if (!u) return json({ error: 'Sign in first' }, 401);
      const p = this.plan(u.plan); const since = now() - Math.max(1, p.history_days) * 864e5;
      return json({ history: this.rows('SELECT tool,files,bytes,ms,ts FROM history WHERE subject=? AND ts>? ORDER BY ts DESC LIMIT 100', u.id, since), days: p.history_days });
    }
    if (path === '/saved' && method === 'GET') {
      if (!u) return json({ error: 'Sign in first' }, 401);
      return json({ saved: this.rows('SELECT id,tool,name,opts,files,summary,ts,out_name,out_size,out_mime,has_file FROM saved WHERE user_id=? ORDER BY ts DESC LIMIT 100', u.id) });
    }
    if (path === '/saved' && method === 'POST') {
      if (!u) return json({ error: 'Sign in first' }, 401);
      { const pl = this.plan(u.plan); if (pl.saved_max <= 0) return json({ error: 'Saving is not included in your plan', upgrade: true }, 403); if (this.rows('SELECT 1 FROM saved WHERE user_id=?', u.id).length >= pl.saved_max) return json({ error: `Your plan keeps up to ${pl.saved_max} saved operations. Delete one first.`, upgrade: true }, 400); }
      const id = crypto.randomUUID(); const cap = (v: unknown, n: number) => JSON.stringify(v ?? null).slice(0, n);
      this.sql.exec('INSERT INTO saved(id,user_id,tool,name,opts,files,summary,ts,out_name,out_size,out_mime,has_file) VALUES(?,?,?,?,?,?,?,?,?,?,?,0)', id, u.id, String(body.tool ?? '').slice(0, 40), String(body.name ?? '').slice(0, 80), cap(body.opts, 4000), cap(body.files, 4000), cap(body.summary, 1000), now(), String(body.out_name ?? '').slice(0, 120), Number(body.out_size) || 0, String(body.out_mime ?? '').slice(0, 80));
      return json({ ok: true, id });
    }
    if (path === '/saved/blob' && method === 'POST') {
      if (!u) return json({ error: 'Sign in first' }, 401);
      const id = String(body.id ?? ''); const data = String(body.data ?? ''); const idx = Number(body.idx) || 0;
      if (!this.rows('SELECT 1 FROM saved WHERE id=? AND user_id=?', id, u.id).length) return json({ error: 'Not found' }, 404);
      if (data.length > 1_000_000 || idx < 0 || idx > 60) return json({ error: 'Chunk too large' }, 400);
      const used = this.rows('SELECT coalesce(sum(length(b.data)),0) n FROM saved_blob b JOIN saved s ON s.id=b.saved_id WHERE s.user_id=?', u.id)[0].n as number;
      { const pl = this.plan(u.plan); if (used + data.length > pl.saved_mb * 1_400_000) return json({ error: `Your saved files storage is full (${pl.saved_mb} MB on your plan). Delete one first.`, upgrade: true }, 413); }
      this.sql.exec('INSERT OR REPLACE INTO saved_blob(saved_id,idx,data) VALUES(?,?,?)', id, idx, data);
      if (body.last) this.sql.exec('UPDATE saved SET has_file=1 WHERE id=?', id);
      return json({ ok: true });
    }
    if (path === '/saved/file' && method === 'GET') {
      if (!u) return json({ error: 'Sign in first' }, 401);
      const id = url.searchParams.get('id') ?? ''; const r = this.rows('SELECT out_name,out_mime FROM saved WHERE id=? AND user_id=? AND has_file=1', id, u.id)[0];
      if (!r) return json({ error: 'No stored file' }, 404);
      const parts = this.rows('SELECT data FROM saved_blob WHERE saved_id=? ORDER BY idx', id).map((x) => { const bin = atob(String(x.data)); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; });
      return new Response(new Blob(parts), { headers: { 'content-type': r.out_mime || 'application/octet-stream', 'cache-control': 'no-store' } });
    }
    if (path === '/saved/delete' && method === 'POST') {
      if (!u) return json({ error: 'Sign in first' }, 401);
      { const sid = String(body.id ?? ''); if (!this.rows('SELECT 1 FROM saved WHERE id=? AND user_id=?', sid, u.id).length) return json({ error: 'Not found' }, 404); if (this.rows('SELECT 1 FROM saved WHERE id=? AND user_id=?', sid, u.id).length) this.sql.exec('DELETE FROM saved_blob WHERE saved_id=?', sid); this.sql.exec('DELETE FROM saved WHERE id=? AND user_id=?', sid, u.id); }
      return json({ ok: true });
    }
    if (path === '/billing/status' && method === 'GET') {
      return json({ providers: Object.values(PROVIDERS).filter((p) => p.configured(this.env)).map((p) => ({ id: p.id, currency: p.currency })), orders: u ? this.rows('SELECT id,plan,provider,amount,currency,status,created_at,paid_at FROM orders WHERE user_id=? ORDER BY created_at DESC LIMIT 20', u.id) : [] });
    }
    if (path === '/billing/checkout' && method === 'POST') {
      if (!u) return json({ error: 'Sign in first' }, 401);
      const prov = PROVIDERS[String(body.provider ?? 'paymob')]; const pl = this.rows("SELECT * FROM plans WHERE id=? AND id NOT IN ('guest','free')", String(body.plan ?? ''))[0];
      if (!prov || !pl) return json({ error: 'Unknown plan or provider' }, 400);
      if (!prov.configured(this.env)) return json({ error: 'Payments are not active yet' }, 503);
      if (!this.limit(`co:${u.id}`, 10, 3600e3)) return json({ error: 'Too many attempts' }, 429);
      const amount = prov.currency === 'EGP' ? pl.price_egp : pl.price_usd; if (!(amount > 0)) return json({ error: 'This plan has no price set' }, 400);
      const id = 'ord_' + rnd(10); this.sql.exec('INSERT INTO orders VALUES(?,?,?,?,?,?,?,?,?,?,?)', id, u.id, pl.id, prov.id, amount, prov.currency, 'pending', '', '', now(), null);
      try { const c = await prov.checkout(this.env, { id, plan: pl.name, amount, currency: prov.currency, email: u.email, name: u.name || '' }, url.origin); this.sql.exec('UPDATE orders SET ref=? WHERE id=?', c.ref, id); return json({ url: c.url }); }
      catch (e: any) { this.sql.exec("UPDATE orders SET status='failed' WHERE id=?", id); return json({ error: e.message ?? 'Payment failed to start' }, 502); }
    }
    if (path.startsWith('/webhooks/') && method === 'POST') {
      const prov = PROVIDERS[path.slice(10)]; if (!prov) return json({ error: 'Unknown provider' }, 404);
      const r = await prov.webhook(this.env, url, body); if (!r) return json({ error: 'Invalid signature' }, 401);
      const o = this.rows('SELECT * FROM orders WHERE id=? AND provider=?', r.orderId, prov.id)[0]; if (!o) return json({ ok: true });
      if (o.status === 'paid') return json({ ok: true });
      if (!r.ok) { this.sql.exec("UPDATE orders SET status='failed', tx_id=? WHERE id=? AND status!='paid'", r.txId, o.id); return json({ ok: true }); }
      if (Math.abs(r.amount - o.amount) > 0.001 || r.currency !== o.currency) { this.audit('payments', 'amount_mismatch', o.id, `${r.amount} ${r.currency}`); return json({ ok: true }); }
      const usr = this.rows('SELECT * FROM users WHERE id=?', o.user_id)[0];
      if (usr) { const base = usr.plan === o.plan && usr.plan_until && usr.plan_until > now() ? usr.plan_until : now(); this.sql.exec('UPDATE users SET plan=?, plan_until=? WHERE id=?', o.plan, base + 30 * 864e5, usr.id); }
      this.sql.exec("UPDATE orders SET status='paid', tx_id=?, paid_at=? WHERE id=?", r.txId, now(), o.id); this.audit('payments', 'paid', usr?.email ?? o.user_id, `${o.plan} ${o.amount} ${o.currency}`);
      return json({ ok: true });
    }
    if (path === '/admin/claim' && method === 'POST') {
      if (!u) return json({ error: 'Sign in first' }, 401);
      if (!this.limit(`cl:${ip}`, 5, 3600e3)) return json({ error: 'Too many attempts' }, 429);
      if (!this.env.ADMIN_SETUP_KEY || !safeEq(String(body.key ?? ''), this.env.ADMIN_SETUP_KEY)) return json({ error: 'Invalid setup key' }, 403);
      this.sql.exec("UPDATE users SET role='admin' WHERE id=?", u.id); this.audit(u.id, 'admin_claimed', u.email); this.adminSeen = true;
      return json({ ok: true });
    }
    if (path.startsWith('/admin/')) {
      if (!u || u.role !== 'admin') return json({ error: 'Admins only' }, 403);
      if (path === '/admin/orders' && method === 'GET') return json({ orders: this.rows('SELECT o.*, u.email FROM orders o LEFT JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC LIMIT 100') });
      if (path === '/admin/stats') {
        const c = (q: string, ...a: any[]) => this.rows(q, ...a)[0].c as number; const t = now();
        return json({
          users: c('SELECT count(*) c FROM users'), pro: c("SELECT count(*) c FROM users WHERE plan IN ('pro','business')"), banned: c('SELECT count(*) c FROM users WHERE banned=1'),
          signups7: c('SELECT count(*) c FROM users WHERE created_at>?', t - 7 * 864e5), jobs24: c('SELECT count(*) c FROM history WHERE ts>?', t - 864e5), jobs7: c('SELECT count(*) c FROM history WHERE ts>?', t - 7 * 864e5),
          topTools: this.rows('SELECT tool, count(*) n FROM history WHERE ts>? GROUP BY tool ORDER BY n DESC LIMIT 8', t - 7 * 864e5),
          perDay: this.rows('SELECT strftime("%Y-%m-%d", ts/1000, "unixepoch") d, count(*) n FROM history WHERE ts>? GROUP BY d ORDER BY d', t - 7 * 864e5),
          mrrUsd: this.rows("SELECT sum(p.price_usd) s FROM users u JOIN plans p ON p.id=u.plan WHERE u.banned=0")[0].s ?? 0, flags: this.rows('SELECT * FROM flags'),
        });
      }
      if (path === '/admin/users' && method === 'GET') {
        const q = `%${(url.searchParams.get('q') ?? '').toLowerCase()}%`;
        return json({ users: this.rows('SELECT id,email,name,plan,role,banned,created_at,last_login FROM users WHERE lower(email) LIKE ? OR lower(name) LIKE ? ORDER BY created_at DESC LIMIT 200', q, q) });
      }
      if (path === '/admin/user' && method === 'POST') {
        const t = this.rows('SELECT * FROM users WHERE id=?', String(body.id))[0]; if (!t) return json({ error: 'No such user' }, 404);
        if (t.id === u.id && (body.banned || (body.role && body.role !== 'admin'))) return json({ error: 'You cannot demote or suspend yourself' }, 400);
        if (body.plan !== undefined) { if (!this.rows('SELECT 1 FROM plans WHERE id=?', body.plan).length || body.plan === 'guest') return json({ error: 'Unknown plan' }, 400); this.sql.exec('UPDATE users SET plan=? WHERE id=?', body.plan, t.id); this.audit(u.email, 'set_plan', t.email, body.plan); }
        if (body.role !== undefined) { if (!['user', 'admin'].includes(body.role)) return json({ error: 'Bad role' }, 400); this.sql.exec('UPDATE users SET role=? WHERE id=?', body.role, t.id); this.audit(u.email, 'set_role', t.email, body.role); }
        if (body.banned !== undefined) { this.sql.exec('UPDATE users SET banned=? WHERE id=?', body.banned ? 1 : 0, t.id); if (body.banned) this.sql.exec('DELETE FROM sessions WHERE user_id=?', t.id); this.audit(u.email, body.banned ? 'ban' : 'unban', t.email); }
        return json({ ok: true });
      }
      if (path === '/admin/plan' && method === 'POST') {
        const p = this.rows('SELECT * FROM plans WHERE id=?', String(body.id))[0]; if (!p) return json({ error: 'No such plan' }, 404);
        const n = (k: string, d: number) => (body[k] === undefined ? d : Math.max(0, Number(body[k]) || 0));
        this.sql.exec('UPDATE plans SET price_usd=?,price_egp=?,heavy_daily=?,ai_daily=?,max_mb=?,history_days=?,max_files=?,saved_max=?,saved_mb=?,ads=? WHERE id=?', n('price_usd', p.price_usd), n('price_egp', p.price_egp), n('heavy_daily', p.heavy_daily), n('ai_daily', p.ai_daily), n('max_mb', p.max_mb), n('history_days', p.history_days), Math.max(1, n('max_files', p.max_files)), n('saved_max', p.saved_max), n('saved_mb', p.saved_mb), Math.min(2, n('ads', p.ads)), p.id);
        this.audit(u.email, 'edit_plan', p.id, JSON.stringify(body).slice(0, 200)); return json({ ok: true });
      }
      if (path === '/admin/flag' && method === 'POST') {
        this.sql.exec('INSERT INTO flags VALUES(?,?) ON CONFLICT(tool) DO UPDATE SET enabled=?', String(body.tool), body.enabled ? 1 : 0, body.enabled ? 1 : 0);
        this.audit(u.email, body.enabled ? 'enable_tool' : 'disable_tool', String(body.tool)); return json({ ok: true });
      }
      if (path === '/admin/export' && method === 'GET') {
        this.audit(u.email, 'admin_export', '', '');
        const data = { exported_at: new Date().toISOString(), users: this.rows('SELECT id,email,name,plan,plan_until,role,banned,email_verified,created_at,last_login FROM users'), plans: this.rows('SELECT * FROM plans'), flags: this.rows('SELECT * FROM flags'), orders: this.rows('SELECT * FROM orders'), saved: this.rows('SELECT id,user_id,tool,name,summary,out_name,out_size,has_file,ts FROM saved'), history: this.rows('SELECT * FROM history ORDER BY id DESC LIMIT 5000'), audit: this.rows('SELECT * FROM audit ORDER BY id DESC LIMIT 5000') };
        return new Response(JSON.stringify(data, null, 2), { headers: { 'content-type': 'application/json', 'content-disposition': `attachment; filename="magic-convertor-backup-${day()}.json"`, 'cache-control': 'no-store' } });
      }
      if (path === '/admin/overview' && method === 'GET') {
        const t = now(), since = t - 14 * 864e5, ds = (col: string, tbl: string, extra = '') => this.rows(`SELECT strftime('%Y-%m-%d', ${col}/1000, 'unixepoch') d, count(*) n FROM ${tbl} WHERE ${col}>? ${extra} GROUP BY d ORDER BY d`, since);
        const c = (q: string, ...a: any[]) => (this.rows(q, ...a)[0]?.c ?? 0) as number;
        return json({
          signupsPerDay: ds('created_at', 'users'), jobsPerDay: ds('ts', 'history'),
          bytesPerDay: this.rows("SELECT strftime('%Y-%m-%d', ts/1000, 'unixepoch') d, sum(bytes) n FROM history WHERE ts>? GROUP BY d ORDER BY d", since),
          plans: this.rows('SELECT plan id, count(*) n FROM users GROUP BY plan'),
          topTools30: this.rows('SELECT tool, count(*) n, sum(bytes) bytes, avg(ms) ms FROM history WHERE ts>? GROUP BY tool ORDER BY n DESC LIMIT 12', t - 30 * 864e5),
          verified: c('SELECT count(*) c FROM users WHERE email_verified=1'), google: c('SELECT count(*) c FROM users WHERE google_sub IS NOT NULL'), total: c('SELECT count(*) c FROM users'),
          saved: c('SELECT count(*) c FROM saved'), savedBytes: c('SELECT coalesce(sum(out_size),0) c FROM saved'),
          abuse24: c("SELECT count(*) c FROM audit WHERE action='rate_limited' AND ts>?", t - 864e5),
          revenue: this.rows("SELECT status, count(*) n, coalesce(sum(amount),0) amt, currency FROM orders GROUP BY status, currency"),
        });
      }
      if (path === '/admin/abuse' && method === 'GET') return json({ events: this.rows("SELECT * FROM audit WHERE action IN ('rate_limited','ban','mail_failed') ORDER BY id DESC LIMIT 100"), byKind: this.rows("SELECT target k, count(*) n FROM audit WHERE action='rate_limited' AND ts>? GROUP BY target ORDER BY n DESC", now() - 7 * 864e5) });
      if (path === '/admin/system' && method === 'GET') return json({ ads: { publisher: !!this.env.ADSENSE_PUB, live: this.env.ADS_LIVE === '1' }, google: !!(this.env.GOOGLE_CLIENT_ID && this.env.GOOGLE_CLIENT_SECRET), mail: !!this.env.RESEND_KEY, payments: !!(this.env.PAYMOB_SECRET_KEY && this.env.PAYMOB_PUBLIC_KEY), schema: this.rows("SELECT v FROM meta WHERE k='schema'")[0]?.v ?? null, tables: ['users', 'sessions', 'history', 'saved', 'orders', 'audit'].map((n) => ({ n, c: this.rows(`SELECT count(*) c FROM ${n}`)[0].c })) });
      if (path === '/admin/audit' && method === 'GET') { const q = `%${(url.searchParams.get('q') ?? '').toLowerCase()}%`; return json({ audit: this.rows('SELECT * FROM audit WHERE lower(actor||action||target||detail) LIKE ? ORDER BY id DESC LIMIT 200', q) }); }
    }
    return json({ error: 'Not found' }, 404);
  }
}

const ADS = 'https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.googleadservices.com https://*.doubleclick.net https://*.adtrafficquality.google https://fundingchoicesmessages.google.com https://www.googletagservices.com https://*.google.com';
const cspFor = (live: boolean) => [
  "default-src 'self'", `script-src 'self' 'wasm-unsafe-eval' blob:${live ? ' ' + ADS : ''}`, "style-src 'self' 'unsafe-inline'", "font-src 'self' data:",
  live ? `img-src 'self' data: blob: https:` : `img-src 'self' data: blob:`, `connect-src 'self' blob:${live ? ' ' + ADS : ''}`, live ? `frame-src ${ADS}` : "frame-src 'none'", "worker-src 'self' blob:", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'", 'upgrade-insecure-requests',
].join('; ');
function harden(res: Response, isApi: boolean, env: any): Response {
  const h = new Headers(res.headers);
  h.set('strict-transport-security', 'max-age=63072000; includeSubDomains; preload'); h.set('x-content-type-options', 'nosniff'); h.set('x-frame-options', 'DENY');
  h.set('referrer-policy', 'strict-origin-when-cross-origin'); h.set('permissions-policy', 'camera=(), microphone=(), geolocation=(), payment=(self), interest-cohort=()');
  h.set('cross-origin-opener-policy', 'same-origin-allow-popups'); if (isApi) h.set('cross-origin-resource-policy', 'same-origin');
  if ((h.get('content-type') ?? '').includes('text/html') || isApi) h.set('content-security-policy', cspFor(env?.ADS_LIVE === '1'));
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}
export default {
  async fetch(req: Request, env: any): Promise<Response> {
    const isApi = new URL(req.url).pathname.startsWith('/api/');
    try { return harden(await route(req, env), isApi, env); } catch (e) { console.error('unhandled', e instanceof Error ? e.message : 'error'); return harden(new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), { status: 500, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } }), isApi, env); }
  },
};
async function route(req: Request, env: any): Promise<Response> {
  {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) {
      const stub = env.DB.get(env.DB.idFromName('main'));
      // /api/config is public and read on every page load: serve it from the edge cache for 60s so it costs no Durable Object reads.
      const cacheable = url.pathname === '/api/config' && req.method === 'GET'; const ck = new Request(url.origin + '/api/config', { method: 'GET' });
      if (cacheable) { const hit = await caches.default.match(ck); if (hit) return hit; }
      try { const r = await stub.fetch(req); if (cacheable && r.ok) { const c = new Response(r.clone().body, r); c.headers.set('cache-control', 'public, max-age=60'); await caches.default.put(ck, c.clone()); return c; } return r; } catch (e) {
        const msg = e instanceof Error ? e.message : '';
        console.error('do_error', msg);
        // Storage quota or outage: keep client-side tools usable instead of blocking everything.
        if (url.pathname === '/api/usage/consume') return new Response(JSON.stringify({ ok: true, degraded: true }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
        if (url.pathname === '/api/config') return new Response(JSON.stringify({ plans: [], disabled: [], heavy: [], google: false, ads: { client: null, live: false }, degraded: true }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
        if (url.pathname === '/api/me') return new Response(JSON.stringify({ user: null, plan: null, usage: {}, adminExists: true, degraded: true }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
        if (url.pathname === '/api/history') return new Response(JSON.stringify({ ok: true, degraded: true }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
        return new Response(JSON.stringify({ error: 'The service is busy right now. Please try again in a little while.' }), { status: 503, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
      }
    }
    if (req.method === 'GET' || req.method === 'HEAD') {
      const t = (b: string, type: string) => new Response(b, { headers: { 'content-type': type + '; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
      if (url.pathname === '/sitemap.xml') return t(sitemap(url.origin), 'application/xml');
      if (url.pathname === '/robots.txt') return t(robots(url.origin), 'text/plain');
      if (url.pathname === '/ads.txt') return t(adsTxt(env.ADSENSE_PUB), 'text/plain');
      if (!url.pathname.startsWith('/assets/') && !/\.[a-z0-9]{2,5}$/i.test(url.pathname)) { const r = await seoPage(req, env); if (r) return r; }
    }
    return env.ASSETS.fetch(req);
  }
}
