// Calculators, date, design, privacy and SEO helpers. Pure functions that run in the browser.
type Fn = (text: string, o: any, second?: string) => string | Promise<string>;
const safe = (f: Fn, allowEmpty = false): Fn => async (t, o, s) => { if (!allowEmpty && !t.trim()) return ''; try { return await f(t, o, s); } catch (e: any) { return String(e.message || e); } };
const num = (v: any, d = 0) => { const n = Number(String(v ?? '').trim().replace(/,/g, '')); return Number.isFinite(n) && String(v ?? '').trim() !== '' ? n : d; };
const fmt = (n: number, dp = 6) => (Number.isFinite(n) ? String(Number(n.toFixed(dp))) : 'n/a');
const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nums = (t: string) => t.split(/[\s,;]+/).filter(Boolean).map((x) => { const n = Number(x); if (!Number.isFinite(n)) throw new Error(`Not a number: ${x.slice(0, 20)}`); return n; });

// ---------- calculators ----------
const percentage: Fn = safe((t, o) => t.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
  const [a, b] = nums(l); if (b === undefined) throw new Error(`Give two numbers on each line: ${l}`);
  if (o.mode === 'is') return `${fmt(a)} is ${fmt((a / b) * 100)}% of ${fmt(b)}`;
  if (o.mode === 'change') return `${fmt(a)} to ${fmt(b)}: ${fmt(((b - a) / Math.abs(a)) * 100)}% ${b >= a ? 'increase' : 'decrease'}`;
  return `${fmt(a)}% of ${fmt(b)} = ${fmt((a * b) / 100)}`;
}).join('\n'));
const loan: Fn = safe((_t, o) => {
  const P = num(o.amount), yrs = num(o.years), n = Math.round(yrs * 12), r = num(o.rate) / 1200;
  if (P <= 0 || n <= 0) throw new Error('Enter an amount and a term above zero.');
  const pay = r ? (P * r) / (1 - Math.pow(1 + r, -n)) : P / n, total = pay * n;
  return [`Monthly payment: ${money(pay)}`, `Total paid: ${money(total)}`, `Total interest: ${money(total - P)}`, `Payments: ${n}`].join('\n');
}, true);
const bmi: Fn = safe((_t, o) => {
  const kg = num(o.kg), cm = num(o.cm); if (kg <= 0 || cm <= 0) throw new Error('Enter weight and height above zero.');
  const v = kg / Math.pow(cm / 100, 2), c = v < 18.5 ? 'Underweight' : v < 25 ? 'Normal weight' : v < 30 ? 'Overweight' : 'Obesity';
  return [`BMI: ${fmt(v, 2)}`, `Category (WHO adult ranges): ${c}`, `Healthy weight for this height: ${fmt(18.5 * Math.pow(cm / 100, 2), 1)} to ${fmt(24.9 * Math.pow(cm / 100, 2), 1)} kg`, '', 'BMI is a rough screen, not medical advice.'].join('\n');
}, true);
const stats: Fn = safe((t) => {
  const a = nums(t); if (!a.length) return ''; const n = a.length, sum = a.reduce((x, y) => x + y, 0), mean = sum / n, s = [...a].sort((x, y) => x - y);
  const med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; const cnt = new Map<number, number>(); a.forEach((x) => cnt.set(x, (cnt.get(x) || 0) + 1));
  const top = Math.max(...cnt.values()), modes = [...cnt].filter(([, c]) => c === top).map(([v]) => v);
  const ss = a.reduce((x, y) => x + (y - mean) ** 2, 0);
  return [`Count: ${n}`, `Sum: ${fmt(sum)}`, `Mean: ${fmt(mean)}`, `Median: ${fmt(med)}`, `Mode: ${top === 1 ? 'none (all values differ)' : modes.map((x) => fmt(x)).join(', ')}`, `Min: ${fmt(s[0])}`, `Max: ${fmt(s[n - 1])}`, `Range: ${fmt(s[n - 1] - s[0])}`, `Variance (population): ${fmt(ss / n)}`, `Std deviation (population): ${fmt(Math.sqrt(ss / n))}`, ...(n > 1 ? [`Std deviation (sample): ${fmt(Math.sqrt(ss / (n - 1)))}`] : [])].join('\n');
});
const gcd2 = (a: number, b: number): number => (b ? gcd2(b, a % b) : Math.abs(a));
const factor = (n: number) => { const f: string[] = []; let x = n; for (let p = 2; p * p <= x && p < 1e7; p++) { let c = 0; while (x % p === 0) { x /= p; c++; } if (c) f.push(c > 1 ? `${p}^${c}` : String(p)); } if (x > 1) f.push(String(x)); return f.join(' x '); };
const gcdLcm: Fn = safe((t) => {
  const a = nums(t); if (a.some((x) => !Number.isInteger(x) || x <= 0)) throw new Error('Use whole numbers above zero.'); if (a.length < 2) throw new Error('Give at least two numbers.');
  const g = a.reduce(gcd2), l = a.reduce((x, y) => (x / gcd2(x, y)) * y);
  return [`GCD: ${g}`, `LCM: ${l}`, '', ...a.map((x) => `${x} = ${x === 1 ? '1' : factor(x) === String(x) ? x + ' (prime)' : factor(x)}`)].join('\n');
});
const compound: Fn = safe((_t, o) => {
  const P = num(o.principal), r = num(o.rate) / 100, yrs = num(o.years), n = Math.max(1, Math.round(num(o.freq, 12))), pm = num(o.monthly);
  if (yrs <= 0) throw new Error('Enter a number of years above zero.');
  const im = Math.pow(1 + r / n, n / 12) - 1, months = Math.round(yrs * 12); let b = P; for (let i = 0; i < months; i++) b = b * (1 + im) + pm;
  const put = P + pm * months;
  return [`Final balance: ${money(b)}`, `Total you put in: ${money(put)}`, `Interest earned: ${money(b - put)}`].join('\n');
}, true);
const discount: Fn = safe((_t, o) => {
  const p = num(o.price), d = num(o.off), d2 = num(o.off2); if (p <= 0) throw new Error('Enter a price above zero.');
  const f = p * (1 - d / 100) * (1 - d2 / 100); return [`Final price: ${money(f)}`, `You save: ${money(p - f)} (${fmt(((p - f) / p) * 100, 2)}%)`].join('\n');
}, true);

// ---------- date and time ----------
const pd = (s: string) => { const m = /^\s*(\d{4})-(\d{1,2})-(\d{1,2})\s*$/.exec(s || ''); if (!m) throw new Error('Use the date format YYYY-MM-DD, like 2026-11-26.'); const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); if (d.getUTCMonth() !== +m[2] - 1) throw new Error('That date does not exist.'); return d; };
const iso = (d: Date) => d.toISOString().slice(0, 10);
const todayUtc = () => { const n = new Date(); return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())); };
const dim = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const wd = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
const ymd = (a: Date, b: Date) => { let y = b.getUTCFullYear() - a.getUTCFullYear(), m = b.getUTCMonth() - a.getUTCMonth(), d = b.getUTCDate() - a.getUTCDate(); if (d < 0) { m--; d += dim(b.getUTCFullYear(), b.getUTCMonth() - 1); } if (m < 0) { y--; m += 12; } return `${y} years, ${m} months, ${d} days`; };
const dayDiff = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 864e5);
const age: Fn = safe((_t, o) => {
  const b = pd(o.birth), n = o.asof && String(o.asof).trim() ? pd(o.asof) : todayUtc(); if (b > n) throw new Error('The birth date is after the "as of" date.');
  let nb = new Date(Date.UTC(n.getUTCFullYear(), b.getUTCMonth(), Math.min(b.getUTCDate(), dim(n.getUTCFullYear(), b.getUTCMonth())))); if (nb < n) nb = new Date(Date.UTC(n.getUTCFullYear() + 1, b.getUTCMonth(), Math.min(b.getUTCDate(), dim(n.getUTCFullYear() + 1, b.getUTCMonth()))));
  return [`Age: ${ymd(b, n)}`, `Total days lived: ${dayDiff(b, n)}`, `Total weeks: ${Math.floor(dayDiff(b, n) / 7)}`, `Born on a: ${wd(b)}`, `Next birthday: ${iso(nb)} (${dayDiff(n, nb)} days away)`].join('\n');
}, true);
const dateDiff: Fn = safe((_t, o) => {
  let a = pd(o.from), b = pd(o.to); const sign = a > b ? -1 : 1; if (sign < 0) [a, b] = [b, a]; const days = dayDiff(a, b);
  let wk = 0; for (let i = 0; i <= days; i++) { const g = new Date(a.getTime() + i * 864e5).getUTCDay(); if (g !== 0 && g !== 6) wk++; }
  return [`Difference: ${days} days${sign < 0 ? ' (the first date is later)' : ''}`, `In weeks: ${Math.floor(days / 7)} weeks and ${days % 7} days`, `Calendar: ${ymd(a, b)}`, `Weekdays (Mon to Fri, both ends counted): ${wk}`].join('\n');
}, true);
const dateAdd: Fn = safe((_t, o) => {
  const s = pd(o.start), n = Math.round(num(o.amount)), u = String(o.unit || 'days'); let d: Date;
  if (u === 'days' || u === 'weeks') d = new Date(s.getTime() + n * (u === 'weeks' ? 7 : 1) * 864e5);
  else { const mo = u === 'years' ? n * 12 : n, tm = s.getUTCMonth() + mo, y = s.getUTCFullYear() + Math.floor(tm / 12), m = ((tm % 12) + 12) % 12; d = new Date(Date.UTC(y, m, Math.min(s.getUTCDate(), dim(y, m)))); }
  return [`Result: ${iso(d)}`, `Weekday: ${wd(d)}`, `Days from start: ${dayDiff(s, d)}`].join('\n');
}, true);
const countdown: Fn = safe((_t, o) => {
  const t = pd(o.target), n = todayUtc(), d = dayDiff(n, t);
  return d === 0 ? `That date is today (${wd(t)}).` : d > 0 ? [`${d} days until ${iso(t)} (${wd(t)})`, `That is ${Math.floor(d / 7)} weeks and ${d % 7} days`, `About ${fmt(d / 30.4375, 1)} months`].join('\n') : `${iso(t)} was ${-d} days ago (${wd(t)}).`;
}, true);
const workdays: Fn = safe((_t, o) => {
  let a = pd(o.from), b = pd(o.to); if (a > b) [a, b] = [b, a]; const weekend = o.weekend === 'fri-sat' ? [5, 6] : [0, 6]; let w = 0, off = 0;
  for (let t = a.getTime(); t <= b.getTime(); t += 864e5) { if (weekend.includes(new Date(t).getUTCDay())) off++; else w++; }
  return [`Working days (both ends counted): ${w}`, `Weekend days: ${off}`, `Total days: ${w + off}`, `Weekend used: ${o.weekend === 'fri-sat' ? 'Friday and Saturday' : 'Saturday and Sunday'}`, 'Public holidays are not subtracted.'].join('\n');
}, true);
const tzOffset = (tz: string, at: number) => { const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(at)); const g = (k: string) => Number(p.find((x) => x.type === k)?.value); return Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second')) - Math.floor(at / 1000) * 1000; };
const tzConvert: Fn = safe((t, o) => {
  const m = /^\s*(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})\s*$/.exec(t.split('\n')[0]); if (!m) throw new Error('Use the format YYYY-MM-DD HH:mm, like 2026-11-26 14:30.');
  const from = String(o.from || 'UTC').trim(), guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let utc: number; try { utc = guess - tzOffset(from, guess); utc = guess - tzOffset(from, utc); } catch { throw new Error(`Unknown time zone: ${from}. Use names like Africa/Cairo.`); }
  const out = [`${from}: ${t.trim()}`, ''];
  for (const z of String(o.to || 'UTC').split(',').map((x) => x.trim()).filter(Boolean)) { try { const off = tzOffset(z, utc) / 6e4, loc = new Date(utc + tzOffset(z, utc)).toISOString().slice(0, 16).replace('T', ' '); out.push(`${z}: ${loc} (UTC${off >= 0 ? '+' : '-'}${String(Math.floor(Math.abs(off) / 60)).padStart(2, '0')}:${String(Math.abs(off) % 60).padStart(2, '0')})`); } catch { out.push(`${z}: unknown time zone`); } }
  return out.join('\n');
});

// ---------- design ----------
const hexRgb = (h: string): [number, number, number] => { let x = h.trim().replace(/^#/, ''); if (x.length === 3) x = x.split('').map((c) => c + c).join(''); if (!/^[0-9a-f]{6}$/i.test(x)) throw new Error(`Not a hex color: ${h}. Use #1a2b3c or #abc.`); return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16)) as [number, number, number]; };
const toHex = (c: number[]) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const lum = (c: number[]) => { const f = c.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); }); return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; };
const contrast: Fn = safe((_t, o) => {
  const a = lum(hexRgb(o.fg)), b = lum(hexRgb(o.bg)), r = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); const ok = (x: boolean) => (x ? 'Pass' : 'Fail');
  return [`Contrast ratio: ${fmt(Math.floor(r * 100) / 100, 2)}:1`, `Normal text, AA (4.5): ${ok(r >= 4.5)}`, `Large text, AA (3): ${ok(r >= 3)}`, `Normal text, AAA (7): ${ok(r >= 7)}`, `Large text, AAA (4.5): ${ok(r >= 4.5)}`, `UI parts and icons (3): ${ok(r >= 3)}`].join('\n');
}, true);
const gradient: Fn = safe((t, o) => {
  const cs = t.split('\n').map((l) => l.trim()).filter(Boolean); if (cs.length < 2) throw new Error('Add at least two colors, one per line.'); cs.forEach(hexRgb);
  const g = o.kind === 'radial' ? `radial-gradient(circle, ${cs.join(', ')})` : `linear-gradient(${Math.round(num(o.angle, 135))}deg, ${cs.join(', ')})`;
  return `background: ${g};\n\n/* with a solid fallback */\nbackground: ${cs[0]};\nbackground: ${g};`;
});
const shades: Fn = safe((t) => {
  const c = hexRgb(t.split('\n')[0]); const mix = (w: number[], k: number) => c.map((v, i) => v + (w[i] - v) * k); const out: string[] = [];
  for (const pc of [90, 70, 50, 30, 10]) out.push(`${pc}% lighter  ${toHex(mix([255, 255, 255], pc / 100))}`);
  out.push(`base         ${toHex(c)}`); for (const pc of [10, 30, 50, 70, 90]) out.push(`${pc}% darker   ${toHex(mix([0, 0, 0], pc / 100))}`);
  return out.join('\n');
});
const pxRem: Fn = safe((t, o) => { const base = num(o.base, 16) || 16; return nums(t).map((v) => (o.mode === 'rem' ? `${fmt(v)}rem = ${fmt(v * base)}px` : `${fmt(v)}px = ${fmt(v / base)}rem`)).join('\n'); });

// ---------- privacy ----------
const rnd = (n: number) => { const lim = Math.floor(0x100000000 / n) * n; const a = new Uint32Array(1); do crypto.getRandomValues(a); while (a[0] >= lim); return a[0] % n; };
const passGen: Fn = safe((_t, o) => {
  const sets: string[] = []; if (o.lower) sets.push('abcdefghijkmnopqrstuvwxyz'); if (o.upper) sets.push('ABCDEFGHJKLMNPQRSTUVWXYZ'); if (o.digits) sets.push('23456789'); if (o.symbols) sets.push('!@#$%^&*-_=+?');
  if (!sets.length) throw new Error('Tick at least one character type.'); const len = Math.min(128, Math.max(sets.length, Math.round(num(o.length, 16)))), cnt = Math.min(20, Math.max(1, Math.round(num(o.count, 5)))), pool = sets.join('');
  const out: string[] = []; for (let i = 0; i < cnt; i++) { const ch = sets.map((s) => s[rnd(s.length)]); while (ch.length < len) ch.push(pool[rnd(pool.length)]); for (let j = ch.length - 1; j > 0; j--) { const k = rnd(j + 1); [ch[j], ch[k]] = [ch[k], ch[j]]; } out.push(ch.join('')); }
  return out.join('\n') + `\n\nStrength: about ${Math.round(len * Math.log2(pool.length))} bits. Made in your browser with secure random numbers.`;
}, true);
const COMMON = ['password', '123456', '12345678', 'qwerty', 'abc123', 'letmein', 'welcome', 'admin', 'iloveyou', 'monkey', 'dragon', 'football', 'password1', '111111', '123123', 'qwerty123'];
const strength: Fn = safe((t) => {
  const p = t.split('\n')[0]; let pool = 0; if (/[a-z]/.test(p)) pool += 26; if (/[A-Z]/.test(p)) pool += 26; if (/\d/.test(p)) pool += 10; if (/[^A-Za-z0-9]/.test(p)) pool += 32;
  let bits = p.length * Math.log2(pool || 1); const tips: string[] = []; const common = COMMON.some((c) => p.toLowerCase().includes(c));
  if (/(.)\1{2,}/.test(p)) { bits *= 0.8; tips.push('Avoid repeating the same character.'); } if (/(?:abc|bcd|cde|123|234|345|456|567|678|789|qwe|wer)/i.test(p)) { bits *= 0.85; tips.push('Avoid simple sequences like 123 or abc.'); }
  if (common) { bits = Math.min(bits, 20); tips.unshift('This contains a very common password.'); } if (p.length < 12) tips.push('Use 12 or more characters.'); if (pool < 62) tips.push('Mix upper case, lower case, digits and symbols.');
  const label = bits < 28 ? 'Very weak' : bits < 36 ? 'Weak' : bits < 60 ? 'Fair' : bits < 80 ? 'Strong' : 'Very strong';
  return [`Strength: ${label}`, `Estimated entropy: about ${Math.round(bits)} bits`, `Length: ${p.length}`, ...(tips.length ? ['', ...tips.map((x) => '- ' + x)] : []), '', 'Checked only in your browser. Still, never test a password you use for real.'].join('\n');
});
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s.replace(/\s+/g, '')), (c) => c.charCodeAt(0));
const aesKey = async (pw: string, salt: Uint8Array) => { const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']); return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); };
const textCrypt: Fn = safe(async (t, o) => {
  const pw = String(o.password ?? ''); if (!pw) throw new Error('Type a password in the Password box.');
  if (o.mode === 'decrypt') { let raw: Uint8Array; try { raw = unb64(t.trim()); } catch { throw new Error('This is not an encrypted text from this tool.'); } if (raw.length < 29) throw new Error('This is not an encrypted text from this tool.'); try { const k = await aesKey(pw, raw.slice(0, 16)); return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: raw.slice(16, 28) }, k, raw.slice(28))); } catch { throw new Error('Wrong password, or the text was changed.'); } }
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12)), k = await aesKey(pw, salt), ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, new TextEncoder().encode(t)));
  const all = new Uint8Array(28 + ct.length); all.set(salt); all.set(iv, 16); all.set(ct, 28); return b64(all);
});
const uuidGen: Fn = safe((_t, o) => { const n = Math.min(50, Math.max(1, Math.round(num(o.count, 5)))); return Array.from({ length: n }, () => { let u = crypto.randomUUID(); if (!o.dashes) u = u.replace(/-/g, ''); return o.upper ? u.toUpperCase() : u; }).join('\n'); }, true);

// ---------- SEO ----------
const ea = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const metaTags: Fn = safe((_t, o) => {
  const L: string[] = [], title = String(o.title || '').trim(), desc = String(o.desc || '').trim(), url = String(o.url || '').trim(), img = String(o.image || '').trim(), site = String(o.site || '').trim(), tw = String(o.twitter || '').trim();
  if (!title) throw new Error('Type a page title.');
  L.push('<meta charset="utf-8">', '<meta name="viewport" content="width=device-width, initial-scale=1">', `<title>${ea(title)}</title>`);
  if (desc) L.push(`<meta name="description" content="${ea(desc)}">`); if (url) L.push(`<link rel="canonical" href="${ea(url)}">`);
  L.push('', `<meta property="og:title" content="${ea(title)}">`, '<meta property="og:type" content="website">'); if (desc) L.push(`<meta property="og:description" content="${ea(desc)}">`); if (url) L.push(`<meta property="og:url" content="${ea(url)}">`); if (img) L.push(`<meta property="og:image" content="${ea(img)}">`); if (site) L.push(`<meta property="og:site_name" content="${ea(site)}">`);
  L.push('', `<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}">`, `<meta name="twitter:title" content="${ea(title)}">`); if (desc) L.push(`<meta name="twitter:description" content="${ea(desc)}">`); if (img) L.push(`<meta name="twitter:image" content="${ea(img)}">`); if (tw) L.push(`<meta name="twitter:site" content="${ea(tw.startsWith('@') ? tw : '@' + tw)}">`);
  const warn: string[] = []; if (title.length > 60) warn.push(`Title is ${title.length} characters. Search results usually show about 60.`); if (desc && (desc.length > 160)) warn.push(`Description is ${desc.length} characters. Search results usually show about 160.`); if (!desc) warn.push('Add a description for search results.');
  return L.join('\n') + (warn.length ? '\n\n<!-- ' + warn.join(' ') + ' -->' : '');
}, true);
const robots: Fn = safe((_t, o) => {
  const L = [`User-agent: ${String(o.agent || '*').trim() || '*'}`]; const dis = String(o.disallow || '').split(',').map((x) => x.trim()).filter(Boolean), al = String(o.allow || '').split(',').map((x) => x.trim()).filter(Boolean);
  al.forEach((x) => L.push(`Allow: ${x}`)); if (!dis.length && !al.length) L.push('Disallow:'); dis.forEach((x) => L.push(`Disallow: ${x}`)); if (String(o.sitemap || '').trim()) L.push('', `Sitemap: ${String(o.sitemap).trim()}`);
  return L.join('\n');
}, true);
const sitemap: Fn = safe((t, o) => {
  const urls = t.split('\n').map((l) => l.trim()).filter(Boolean); const bad = urls.find((u) => !/^https?:\/\/\S+$/i.test(u)); if (bad) throw new Error(`Not a full URL: ${bad.slice(0, 60)}`);
  const x = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); const today = new Date().toISOString().slice(0, 10), pr = Math.min(1, Math.max(0, num(o.priority, 0.5)));
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map((u) => `  <url>\n    <loc>${x(u)}</loc>\n${o.lastmod ? `    <lastmod>${today}</lastmod>\n` : ''}${o.freq && o.freq !== 'none' ? `    <changefreq>${o.freq}</changefreq>\n` : ''}    <priority>${fmt(pr, 1)}</priority>\n  </url>`).join('\n') + '\n</urlset>';
});
const utm: Fn = safe((_t, o) => {
  let u: URL; try { u = new URL(String(o.url || '').trim()); } catch { throw new Error('Type a full URL starting with https://.'); }
  const f: [string, string][] = [['utm_source', o.source], ['utm_medium', o.medium], ['utm_campaign', o.campaign], ['utm_term', o.term], ['utm_content', o.content]]; let n = 0;
  for (const [k, v] of f) if (String(v || '').trim()) { u.searchParams.set(k, String(v).trim()); n++; }
  if (!n) throw new Error('Fill at least the source, medium or campaign.'); return u.toString();
}, true);
const STOP = new Set('the a an and or but of to in on at for with as by is are was were be been it this that these those from not no do does did have has had i you he she we they my your his her our their its so if then than too very can will just'.split(' ').concat('في من على إلى عن مع هذا هذه ذلك التي الذي أن إن كان كانت هو هي ما لا لم لن قد و أو ثم كل بعد قبل'.split(' ')));
const keywords: Fn = safe((t, o) => {
  const w = (t.toLowerCase().match(/[\p{L}\p{N}']+/gu) || []).filter((x) => x.length >= 2 && !(o.stop && STOP.has(x))); if (!w.length) return 'No words found.';
  const c = new Map<string, number>(); w.forEach((x) => c.set(x, (c.get(x) || 0) + 1)); const rows = [...c].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 20);
  return `Words counted: ${w.length}, unique: ${c.size}\n\n` + rows.map(([k, v]) => `${String(v).padStart(4)}  ${fmt((v / w.length) * 100, 2).padStart(5)}%  ${k}`).join('\n');
});

export const MISC_FNS: Record<string, Fn> = { 'percentage-calculator': percentage, 'loan-calculator': loan, 'bmi-calculator': bmi, 'stats-calculator': stats, 'gcd-lcm': gcdLcm, 'compound-interest': compound, 'discount-calculator': discount, 'age-calculator': age, 'date-difference': dateDiff, 'date-add': dateAdd, 'countdown-days': countdown, 'workdays-between': workdays, 'timezone-converter': tzConvert, 'contrast-checker': contrast, 'gradient-generator': gradient, 'color-shades': shades, 'px-rem-converter': pxRem, 'password-generator': passGen, 'password-strength': strength, 'text-encrypt': textCrypt, 'uuid-generator': uuidGen, 'meta-tag-generator': metaTags, 'robots-txt-generator': robots, 'sitemap-generator': sitemap, 'utm-builder': utm, 'keyword-density': keywords };

const AR_OUT: Record<string, string> = {"weeks": "أسبوع", "Normal text, AAA (7)": "نص عادي، AAA (7)", "Normal text, AA (4.5)": "نص عادي، AA (4.5)", "Large text, AA (3)": "نص كبير، AA (3)", "Large text, AAA (4.5)": "نص كبير، AAA (4.5)", "UI parts and icons (3)": "عناصر الواجهة والأيقونات (3)", "about": "حوالي", "This contains a very common password.": "تحتوي على كلمة مرور شائعة جداً.", "Avoid repeating the same character.": "تجنب تكرار نفس الحرف.", "Avoid simple sequences like 123 or abc.": "تجنب التسلسلات البسيطة مثل 123 أو abc.", "Use 12 or more characters.": "استخدم 12 حرفاً أو أكثر.", "Mix upper case, lower case, digits and symbols.": "امزج الأحرف الكبيرة والصغيرة والأرقام والرموز.", "Checked only in your browser. Still, never test a password you use for real.": "الفحص داخل متصفحك فقط. ومع ذلك لا تختبر كلمة مرور تستخدمها فعلاً.", "Monday": "الاثنين", "Tuesday": "الثلاثاء", "Wednesday": "الأربعاء", "Thursday": "الخميس", "Friday": "الجمعة", "Saturday": "السبت", "Sunday": "الأحد", " to ": " إلى ", " kg": " كجم", "Monthly payment": "القسط الشهري", "Total paid": "إجمالي المدفوع", "Total interest": "إجمالي الفوائد", "Payments": "عدد الدفعات", "Final balance": "الرصيد النهائي", "Total you put in": "إجمالي ما أودعته", "Interest earned": "الفوائد المكتسبة", "Final price": "السعر النهائي", "You save": "توفّر", "BMI": "مؤشر كتلة الجسم", "Category (WHO adult ranges)": "التصنيف (نطاقات منظمة الصحة للبالغين)", "Underweight": "نقص وزن", "Normal weight": "وزن طبيعي", "Overweight": "زيادة وزن", "Obesity": "سمنة", "Healthy weight for this height": "الوزن الصحي لهذا الطول", "BMI is a rough screen, not medical advice.": "المؤشر تقدير تقريبي وليس نصيحة طبية.", "Count": "العدد", "Sum": "المجموع", "Mean": "المتوسط", "Median": "الوسيط", "Mode": "المنوال", "none (all values differ)": "لا يوجد (كل القيم مختلفة)", "Min": "الأصغر", "Max": "الأكبر", "Range": "المدى", "Variance (population)": "التباين (المجتمع)", "Std deviation (population)": "الانحراف المعياري (المجتمع)", "Std deviation (sample)": "الانحراف المعياري (العينة)", "GCD": "القاسم المشترك الأكبر", "LCM": "المضاعف المشترك الأصغر", "(prime)": "(أولي)", "Age": "العمر", "Total days lived": "إجمالي الأيام", "Total weeks": "إجمالي الأسابيع", "Born on a": "وُلدت يوم", "Next birthday": "عيد الميلاد القادم", "days away": "يوم متبقٍ", "years": "سنة", "months": "شهر", "days": "يوم", "Difference": "الفرق", "In weeks": "بالأسابيع", "Calendar": "بالتقويم", "Weekdays (Mon to Fri, both ends counted)": "أيام العمل (الاثنين إلى الجمعة، شامل الطرفين)", "Result": "النتيجة", "Weekday": "اليوم", "Days from start": "الأيام من البداية", "Working days (both ends counted)": "أيام العمل (شامل الطرفين)", "Weekend days": "أيام العطلة", "Total days": "إجمالي الأيام", "Weekend used": "العطلة المستخدمة", "Friday and Saturday": "الجمعة والسبت", "Saturday and Sunday": "السبت والأحد", "Public holidays are not subtracted.": "لا تُخصم الإجازات الرسمية.", "Contrast ratio": "نسبة التباين", "Pass": "ناجح", "Fail": "راسب", "Strength": "القوة", "Very weak": "ضعيفة جداً", "Weak": "ضعيفة", "Fair": "مقبولة", "Very strong": "قوية جداً", "Strong": "قوية", "Estimated entropy": "الإنتروبيا التقديرية", "Length": "الطول", "bits": "بت", "Made in your browser with secure random numbers.": "أُنشئت في متصفحك بأرقام عشوائية آمنة.", "Words counted": "الكلمات المعدودة", "unique": "فريدة", "Wrong password, or the text was changed.": "كلمة المرور خاطئة أو تم تغيير النص.", "Type a password in the Password box.": "اكتب كلمة مرور في خانة كلمة المرور."};
const AR_KEYS = Object.keys(AR_OUT).sort((a, b) => b.length - a.length);
const arOut = (s: string) => AR_KEYS.reduce((t, k) => t.split(k).join(AR_OUT[k]), s);
export const MISC_FNS_AR: Record<string, Fn> = Object.fromEntries(Object.entries(MISC_FNS).map(([k, f]) => [k, async (t: string, o: any, s?: string) => { const r = await f(t, o, s); if (!(o && o._ar && typeof r === 'string')) return r; if (k === 'text-encrypt') return AR_OUT[r.trim()] ?? r; if (k === 'keyword-density') { const i = r.indexOf('\n'); return i < 0 ? r : arOut(r.slice(0, i)) + r.slice(i); } return arOut(r); }]));
