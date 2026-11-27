"""Security/authz tests. Usage: security-test.py <base-url>. Creates throwaway users and deletes them at the end."""
import sys, json, urllib.request, urllib.error, uuid
B = sys.argv[1].rstrip('/')
res = []
def call(method, path, body=None, cookie=None, origin=None, ctype='application/json', raw=False):
    h = {'user-agent': 'Mozilla/5.0 security-test'}
    if cookie: h['cookie'] = cookie
    if origin: h['origin'] = origin
    data = None
    if body is not None:
        data = json.dumps(body).encode() if not raw else body.encode(); h['content-type'] = ctype
    elif method == 'POST': h['content-type'] = ctype
    r = urllib.request.Request(B + path, data=data if data is not None else (b'{}' if method == 'POST' else None), headers=h, method=method)
    try:
        x = urllib.request.urlopen(r); code, hd, txt = x.status, x.headers, x.read().decode()
    except urllib.error.HTTPError as e:
        code, hd, txt = e.code, e.headers, e.read().decode()
    try: j = json.loads(txt)
    except Exception: j = {}
    return code, j, hd
def check(name, ok, info=''):
    res.append(ok); print(('PASS ' if ok else 'FAIL ') + name + ('' if ok else '  ' + str(info)))
def signup(tag):
    em = f'sec-{tag}-{uuid.uuid4().hex[:6]}@example.com'
    c, j, h = call('POST', '/api/auth/signup', {'email': em, 'password': 'Passw0rd!long', 'name': tag})
    ck = h.get('set-cookie', '').split(';')[0]
    return em, ck, j
emA, ckA, _ = signup('a'); emB, ckB, _ = signup('b')
# headers
c, j, h = call('GET', '/api/config')
for k in ['strict-transport-security', 'x-content-type-options', 'x-frame-options', 'content-security-policy', 'referrer-policy']:
    check('header ' + k, bool(h.get(k)))
c, j, h = call('POST', '/api/auth/login', {'email': emA, 'password': 'Passw0rd!long'})
sc = h.get('set-cookie', '')
check('session cookie HttpOnly+Secure+SameSite', all(x in sc for x in ['HttpOnly', 'Secure', 'SameSite']), sc)
# anonymous and normal user cannot reach admin
for m, p in [('GET', '/api/admin/stats'), ('GET', '/api/admin/users'), ('GET', '/api/admin/orders'), ('GET', '/api/admin/audit'), ('POST', '/api/admin/user'), ('POST', '/api/admin/plan'), ('POST', '/api/admin/flag')]:
    c, _, _ = call(m, p); check(f'anon blocked {m} {p}', c in (401, 403), c)
    c, _, _ = call(m, p, cookie=ckA); check(f'user blocked {m} {p}', c == 403, c)
c, _, _ = call('POST', '/api/admin/claim', {'key': 'guess'}, cookie=ckA); check('admin claim wrong key refused', c in (403, 409), c)
# anonymous private routes
for m, p in [('GET', '/api/saved'), ('POST', '/api/saved'), ('POST', '/api/saved/delete'), ('GET', '/api/history'), ('POST', '/api/auth/delete'), ('POST', '/api/auth/logout-all'), ('POST', '/api/auth/password')]:
    c, _, _ = call(m, p); check(f'anon blocked {m} {p}', c in (401, 403), c)
# IDOR on saved operations
c, j, _ = call('POST', '/api/saved', {'tool': 'merge-pdf', 'name': 'x', 'opts': {}, 'files': 1, 'summary': 's'}, cookie=ckA)
sid = j.get('id') or j.get('saved', {}).get('id') if isinstance(j, dict) else None
check('user A can save an operation', c == 200 and bool(sid), (c, j))
if sid:
    c, j, _ = call('GET', '/api/saved', cookie=ckB); check('user B list does not show A item', sid not in json.dumps(j), j)
    c, _, _ = call('GET', f'/api/saved/file?id={sid}&idx=0', cookie=ckB); check('user B cannot download A file', c in (403, 404), c)
    c, _, _ = call('POST', '/api/saved/delete', {'id': sid}, cookie=ckB); check('user B cannot delete A item', c in (403, 404), c)
    c, j, _ = call('GET', '/api/saved', cookie=ckA); check('A item survives B delete attempt', sid in json.dumps(j))
    c, _, _ = call('POST', '/api/saved/delete', {'id': sid}, cookie=ckA); check('user A can delete own item', c == 200, c)
# CSRF / content-type
c, _, _ = call('POST', '/api/auth/logout', {}, cookie=ckA, origin='https://evil.example'); check('cross-origin POST refused', c == 403, c)
c, _, _ = call('POST', '/api/auth/logout', 'a=b', cookie=ckA, ctype='application/x-www-form-urlencoded', raw=True); check('form-encoded POST refused', c == 415, c)
# injection-ish inputs
c, j, _ = call('POST', '/api/auth/login', {'email': "' OR 1=1 --", 'password': 'x'}); check('SQL-ish login refused', c in (400, 401, 429), c)
c, j, _ = call('POST', '/api/auth/signup', {'email': 'a@b.co', 'password': 'short'}); check('short password refused', c == 400, c)
c, _, _ = call('POST', '/api/auth/signup', {'email': 'x' * 300 + '@b.co', 'password': 'Passw0rd!long'}); check('oversized email refused', c in (400, 429), c)
c, _, _ = call('POST', '/api/auth/signup', 'not json', raw=True); check('bad JSON refused', c == 400, c)
# change password revokes other sessions; logout-all
c, j, h = call('POST', '/api/auth/login', {'email': emA, 'password': 'Passw0rd!long'}); ck2 = h.get('set-cookie', '').split(';')[0]
c, _, h2 = call('POST', '/api/auth/password', {'password': 'Passw0rd!long', 'newPassword': 'N3wPassw0rd!x'}, cookie=ckA); ckN = h2.get('set-cookie', '').split(';')[0]
check('change password works', c == 200, c)
c, j, _ = call('GET', '/api/me', cookie=ck2); check('old session revoked after password change', not j.get('user'), j)
c, _, _ = call('POST', '/api/auth/password', {'password': 'wrong', 'newPassword': 'N3wPassw0rd!y'}, cookie=ckN); check('wrong current password refused', c == 401, c)
c, _, _ = call('POST', '/api/auth/logout-all', {}, cookie=ckN); check('logout everywhere ok', c == 200, c)
c, j, _ = call('GET', '/api/me', cookie=ckN); check('session dead after logout-all', not j.get('user'), j)
# lockout
em = 'lock-' + uuid.uuid4().hex[:6] + '@example.com'; codes = []
for i in range(10): codes.append(call('POST', '/api/auth/login', {'email': em, 'password': 'bad' + str(i)})[0])
check('login lockout after repeated failures (429)', 429 in codes, codes)
# purge test users
for em_, pw in [(emA, 'N3wPassw0rd!x'), (emB, 'Passw0rd!long')]:
    c, j, h = call('POST', '/api/auth/login', {'email': em_, 'password': pw}); ck = h.get('set-cookie', '').split(';')[0]
    c, _, _ = call('POST', '/api/auth/delete', {'immediate': True, 'password': pw}, cookie=ck); check('purge test user', c == 200, (c, j))
print(f'{sum(res)}/{len(res)} passed'); sys.exit(0 if all(res) else 1)
