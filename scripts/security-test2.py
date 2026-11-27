"""Extra probes: admin authz, big bodies, traversal, odd methods, reflected input. LOCAL worker. Creates and deletes one user."""
import sys, json, urllib.request, urllib.error, uuid
B = sys.argv[1].rstrip('/'); res = []
def call(method, path, body=None, cookie=None, raw=None, ctype='application/json', origin=None):
    h = {'user-agent': 'Mozilla/5.0 sec2'}
    if cookie: h['cookie'] = cookie
    if origin: h['origin'] = origin
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else (b'{}' if method in ('POST', 'PUT') else None))
    if data is not None: h['content-type'] = ctype
    r = urllib.request.Request(B + path, data=data, headers=h, method=method)
    try: x = urllib.request.urlopen(r); code, hd, txt = x.status, x.headers, x.read().decode('utf8', 'replace')
    except urllib.error.HTTPError as e: code, hd, txt = e.code, e.headers, e.read().decode('utf8', 'replace')
    except Exception as e: code, hd, txt = -1, {}, str(e)
    return code, txt, hd
def t(name, ok): res.append(ok); print('PASS' if ok else 'FAIL', name)
ADMIN_GET = ['/api/admin/users', '/api/admin/stats', '/api/admin/overview', '/api/admin/audit', '/api/admin/orders', '/api/admin/usage', '/api/admin/abuse', '/api/admin/system', '/api/admin/flags', '/api/admin/export']
for p in ADMIN_GET:
    c, _, _ = call('GET', p); t(f'anon denied {p}', c in (401, 403))
email = f'sec2_{uuid.uuid4().hex[:8]}@example.com'
c, txt, hd = call('POST', '/api/auth/signup', {'email': email, 'password': 'Passw0rd!xyz9', 'name': 'Sec Two'}, origin=B)
ck = (hd.get('set-cookie') or '').split(';')[0]; t('signup ok with cookie', c < 300 and '=' in ck)
for p in ADMIN_GET:
    c, _, _ = call('GET', p, cookie=ck); t(f'non-admin denied {p}', c in (401, 403))
for p, b in [('/api/admin/plan', {'id': 'pro', 'price_usd': 0}), ('/api/admin/user', {'email': email, 'role': 'admin'}), ('/api/admin/rate', {'rate': 1}), ('/api/admin/flag', {'k': 'x'})]:
    c, _, _ = call('POST', p, b, cookie=ck, origin=B); t(f'non-admin cannot POST {p}', c in (401, 403))
c, txt, _ = call('POST', '/api/admin/claim', {'key': 'wrong'}, cookie=ck, origin=B); t('claim with wrong key refused', c in (401, 403, 404, 400))
c, txt, _ = call('GET', '/api/me', cookie=ck); t('role is not admin after attempts', '"role":"admin"' not in txt.replace(' ', ''))
big = ('{"email":"' + 'a' * 2_000_000 + '"}').encode()
c, _, _ = call('POST', '/api/auth/login', raw=big, origin=B); t('2MB body refused or rejected (not 500)', c in (400, 401, 413, 422, 429))
c, _, _ = call('POST', '/api/usage/consume', {'tool': 'x' * 5000, 'bytes': -5, 'files': 99999999}, cookie=ck, origin=B); t('weird usage payload not 500', c < 500)
c, _, _ = call('POST', '/api/usage/consume', {'tool': {'$ne': 1}, 'bytes': 'NaN'}, cookie=ck, origin=B); t('object-typed fields not 500', c < 500)
for path in ['/assets/../worker/index.ts', '/..%2f..%2fwrangler.jsonc', '/%2e%2e/package.json', '/.env', '/.git/config', '/wrangler.jsonc', '/worker/index.ts']:
    c, txt, hd = call('GET', path); leaked = ('compatibility_date' in txt) or ('[core]' in txt) or ('export default' in txt and 'fetch' in txt) or ('"dependencies"' in txt)
    t(f'no leak {path}', not leaked)
for m in ['TRACE', 'PUT', 'DELETE', 'PATCH']:
    c, _, _ = call(m, '/api/me', raw=b'{}' if m != 'TRACE' else None); t(f'{m} /api/me not 5xx', c < 500)
c, txt, hd = call('GET', '/api/me?x=<script>alert(1)</script>'); t('query not reflected raw', '<script>alert(1)</script>' not in txt)
c, txt, hd = call('GET', '/nonexistent-' + uuid.uuid4().hex[:6]); t('unknown path 200 SPA or 404, not 5xx', c < 500)
c, txt, hd = call('GET', '/api/auth/google/callback?code=x&state=y'); t('google callback with junk state not 5xx and no session', c < 500 and 'set-cookie' not in {k.lower() for k in hd.keys()})
c, _, hd = call('POST', '/api/auth/login', {'email': email, 'password': 'x'}, origin='https://evil.example'); t('login from foreign origin refused', c in (400, 401, 403))
call('POST', '/api/auth/delete', {'password': 'Passw0rd!xyz9'}, cookie=ck, origin=B)
c, _, _ = call('GET', '/api/me', cookie=ck); t('purged: session gone', c in (401, 403))
print(f'{sum(res)}/{len(res)} passed'); sys.exit(0 if all(res) else 1)
