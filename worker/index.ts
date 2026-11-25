// Magic Convertor backend: one Worker + one SQLite-backed Durable Object.
import { DurableObject } from 'cloudflare:workers';

const HEAVY = new Set(['compress-pdf', 'pdf-to-images', 'pdf-to-word', 'pdf-to-excel', 'pdf-to-powerpoint', 'redact-pdf', 'unlock-pdf', 'repair-pdf']);
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
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT, pass_hash TEXT, salt TEXT, plan TEXT DEFAULT 'free', role TEXT DEFAULT 'user', banned INTEGER DEFAULT 0, created_at INTEGER, last_login INTEGER);
      CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id TEXT, created_at INTEGER, expires_at INTEGER);
      CREATE TABLE IF NOT EXISTS usage(subject TEXT, day TEXT, kind TEXT, n INTEGER DEFAULT 0, PRIMARY KEY(subject, day, kind));
      CREATE TABLE IF NOT EXISTS history(id INTEGER PRIMARY KEY AUTOINCREMENT, subject TEXT, tool TEXT, files INTEGER, bytes INTEGER, ms INTEGER, ts INTEGER);
      CREATE TABLE IF NOT EXISTS plans(id TEXT PRIMARY KEY, name TEXT, price_usd REAL, price_egp REAL, heavy_daily INTEGER, ai_daily INTEGER, max_mb INTEGER, history_days INTEGER, sort INTEGER);
      CREATE TABLE IF NOT EXISTS flags(tool TEXT PRIMARY KEY, enabled INTEGER DEFAULT 1);
      CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER, actor TEXT, action TEXT, target TEXT, detail TEXT);
      CREATE TABLE IF NOT EXISTS attempts(k TEXT PRIMARY KEY, n INTEGER, reset_at INTEGER);
    `);
    if (!this.sql.exec('SELECT 1 FROM plans LIMIT 1').toArray().length) {
      const P = this.sql;
      P.exec(`INSERT INTO plans VALUES('guest','Guest',0,0,3,0,25,0,0),('free','Free',0,0,10,3,50,0,1),('pro','Pro',5,249,100000,100,500,30,2),('business','Business',15,749,100000,500,2000,90,3)`);
    }
  }
  rows(q: string, ...a: any[]) { return this.sql.exec(q, ...a).toArray() as any[]; }
  audit(actor: string, action: string, target = '', detail = '') { this.sql.exec('INSERT INTO audit(ts,actor,action,target,detail) VALUES(?,?,?,?,?)', now(), actor, action, target, detail); }
  plan(id: string) { return this.rows('SELECT * FROM plans WHERE id=?', id)[0] ?? this.rows("SELECT * FROM plans WHERE id='free'")[0]; }
  async user(req: Request) {
    const m = /(?:^|;\s*)mc_session=([a-f0-9]{64})/.exec(req.headers.get('cookie') ?? ''); if (!m) return null;
    const r = this.rows('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?', await sha(m[1]), now())[0];
    return r && !r.banned ? r : null;
  }
  pub(u: any) { return u && { id: u.id, email: u.email, name: u.name, plan: u.plan, role: u.role, created_at: u.created_at }; }
  limit(key: string, max: number, windowMs: number) {
    const r = this.rows('SELECT * FROM attempts WHERE k=?', key)[0];
    if (!r || r.reset_at < now()) { this.sql.exec('INSERT OR REPLACE INTO attempts VALUES(?,?,?)', key, 1, now() + windowMs); return true; }
    if (r.n >= max) return false; this.sql.exec('UPDATE attempts SET n=n+1 WHERE k=?', key); return true;
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
      return json({ plans: this.rows('SELECT * FROM plans ORDER BY sort'), disabled: this.rows('SELECT tool FROM flags WHERE enabled=0').map((r) => r.tool), heavy: [...HEAVY] });
    }
    if (path === '/auth/signup' && method === 'POST') {
      if (!this.limit(`su:${ip}`, 10, 3600e3)) return json({ error: 'Too many attempts, try later' }, 429);
      const email = String(body.email ?? '').trim().toLowerCase(), pw = String(body.password ?? ''), name = String(body.name ?? '').trim().slice(0, 60);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 120) return json({ error: 'Enter a valid email' }, 400);
      if (pw.length < 8 || pw.length > 200) return json({ error: 'Password must be at least 8 characters' }, 400);
      if (this.rows('SELECT 1 FROM users WHERE email=?', email).length) return json({ error: 'Email already registered' }, 409);
      const id = 'u_' + rnd(8), salt = rnd(16); this.sql.exec('INSERT INTO users(id,email,name,pass_hash,salt,created_at,last_login) VALUES(?,?,?,?,?,?,?)', id, email, name, await pbkdf2(pw, salt), salt, now(), now());
      this.audit(id, 'signup', email);
      return json({ user: this.pub(this.rows('SELECT * FROM users WHERE id=?', id)[0]) }, 200, { 'set-cookie': await this.startSession(id) });
    }
    if (path === '/auth/login' && method === 'POST') {
      const email = String(body.email ?? '').trim().toLowerCase();
      if (!this.limit(`li:${ip}:${email}`, 8, 900e3)) return json({ error: 'Too many attempts, try again in 15 minutes' }, 429);
      const r = this.rows('SELECT * FROM users WHERE email=?', email)[0];
      const ok = r && safeEq(await pbkdf2(String(body.password ?? ''), r.salt), r.pass_hash);
      if (!ok) return json({ error: 'Wrong email or password' }, 401);
      if (r.banned) return json({ error: 'This account is suspended' }, 403);
      this.sql.exec('UPDATE users SET last_login=? WHERE id=?', now(), r.id);
      return json({ user: this.pub(r) }, 200, { 'set-cookie': await this.startSession(r.id) });
    }
    if (path === '/auth/logout' && method === 'POST') {
      const m = /mc_session=([a-f0-9]{64})/.exec(req.headers.get('cookie') ?? ''); if (m) this.sql.exec('DELETE FROM sessions WHERE token_hash=?', await sha(m[1]));
      return json({ ok: true }, 200, { 'set-cookie': 'mc_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0' });
    }
    if (path === '/me' && method === 'GET') {
      const p = this.plan(u ? u.plan : 'guest');
      return json({ user: this.pub(u), plan: p, usage: this.usageToday(subject) });
    }
    if (path === '/usage/consume' && method === 'POST') {
      const tool = String(body.tool ?? ''); const bytes = Number(body.bytes) || 0;
      if (this.rows('SELECT 1 FROM flags WHERE tool=? AND enabled=0', tool).length) return json({ error: 'This tool is temporarily disabled' }, 503);
      const p = this.plan(u ? u.plan : 'guest');
      if (bytes > p.max_mb * 1048576) return json({ error: `File limit for your plan is ${p.max_mb} MB`, upgrade: true }, 413);
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
    if (path === '/admin/claim' && method === 'POST') {
      if (!u) return json({ error: 'Sign in first' }, 401);
      if (!this.limit(`cl:${ip}`, 5, 3600e3)) return json({ error: 'Too many attempts' }, 429);
      if (this.rows("SELECT 1 FROM users WHERE role='admin'").length) return json({ error: 'An admin already exists' }, 409);
      if (!this.env.ADMIN_SETUP_KEY || !safeEq(String(body.key ?? ''), this.env.ADMIN_SETUP_KEY)) return json({ error: 'Invalid setup key' }, 403);
      this.sql.exec("UPDATE users SET role='admin' WHERE id=?", u.id); this.audit(u.id, 'admin_claimed', u.email);
      return json({ ok: true });
    }
    if (path.startsWith('/admin/')) {
      if (!u || u.role !== 'admin') return json({ error: 'Admins only' }, 403);
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
        this.sql.exec('UPDATE plans SET price_usd=?,price_egp=?,heavy_daily=?,ai_daily=?,max_mb=?,history_days=? WHERE id=?', n('price_usd', p.price_usd), n('price_egp', p.price_egp), n('heavy_daily', p.heavy_daily), n('ai_daily', p.ai_daily), n('max_mb', p.max_mb), n('history_days', p.history_days), p.id);
        this.audit(u.email, 'edit_plan', p.id, JSON.stringify(body).slice(0, 200)); return json({ ok: true });
      }
      if (path === '/admin/flag' && method === 'POST') {
        this.sql.exec('INSERT INTO flags VALUES(?,?) ON CONFLICT(tool) DO UPDATE SET enabled=?', String(body.tool), body.enabled ? 1 : 0, body.enabled ? 1 : 0);
        this.audit(u.email, body.enabled ? 'enable_tool' : 'disable_tool', String(body.tool)); return json({ ok: true });
      }
      if (path === '/admin/audit' && method === 'GET') return json({ audit: this.rows('SELECT * FROM audit ORDER BY id DESC LIMIT 100') });
    }
    return json({ error: 'Not found' }, 404);
  }
}

export default {
  async fetch(req: Request, env: any): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) {
      const stub = env.DB.get(env.DB.idFromName('main'));
      return stub.fetch(req);
    }
    return env.ASSETS.fetch(req);
  },
};
