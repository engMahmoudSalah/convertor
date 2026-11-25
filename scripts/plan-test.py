"""Plan enforcement matrix. LOCAL worker only (needs ADMIN_SETUP_KEY): plan-test.py <url> <setup-key>"""
import json, sys, urllib.request, urllib.error, random
B, KEY = sys.argv[1], sys.argv[2]
def call(path, body=None, cookie=None, method=None):
    h = {'content-type': 'application/json', 'user-agent': 'mc-test/1'}
    if cookie: h['cookie'] = cookie
    r = urllib.request.Request(B + '/api' + path, data=None if body is None else json.dumps(body).encode(), headers=h, method=method or ('GET' if body is None else 'POST'))
    try: resp = urllib.request.urlopen(r)
    except urllib.error.HTTPError as e: resp = e
    ck = resp.headers.get('set-cookie'); return resp.status, json.loads(resp.read() or b'{}'), (ck.split(';')[0] if ck else None)
res = []; rows = []
def check(name, cond): res.append(bool(cond)); print('PASS' if cond else 'FAIL', name)
t = random.randint(10000, 99999)
def mk(tag):
    s, j, ck = call('/auth/signup', {'email': f'plan{tag}{t}@example.com', 'password': 'correct horse 1'}); return j['user']['id'], ck
aid, ack = mk('admin'); s, j, _ = call('/admin/claim', {'key': KEY}, ack); check('admin claim (local)', s == 200)
plans = {p['id']: p for p in call('/config')[1]['plans']}
ids = {}; cks = {}
for pid in ['free', 'pro', 'business']:
    ids[pid], cks[pid] = mk(pid)
    if pid != 'free': s, j, _ = call('/admin/user', {'id': ids[pid], 'plan': pid}, ack); check(f'admin sets {pid}', s == 200)
cks['guest'] = None
for pid in ['guest', 'free', 'pro', 'business']:
    p = plans[pid]; ck = cks[pid]
    s, j, _ = call('/usage/consume', {'tool': 'merge-pdf', 'bytes': (p['max_mb'] + 1) * 1048576, 'files': 1}, ck); check(f'{pid}: file over {p["max_mb"]} MB refused (413)', s == 413)
    s, j, _ = call('/usage/consume', {'tool': 'merge-pdf', 'bytes': 1000, 'files': p['max_files'] + 1}, ck); check(f'{pid}: batch over {p["max_files"]} files refused (413)', s == 413)
    s, j, _ = call('/usage/consume', {'tool': 'merge-pdf', 'bytes': 1000, 'files': p['max_files']}, ck); check(f'{pid}: batch of exactly {p["max_files"]} allowed', s == 200)
    if p['heavy_daily'] < 100000 and pid != 'guest' or pid == 'guest':
        n = p['heavy_daily']; last = 200
        for i in range(n): last = call('/usage/consume', {'tool': 'compress-pdf', 'bytes': 1000, 'files': 1}, ck)[0]
        check(f'{pid}: {n} advanced jobs allowed', last == 200)
        s, j, _ = call('/usage/consume', {'tool': 'compress-pdf', 'bytes': 1000, 'files': 1}, ck); check(f'{pid}: advanced job #{n + 1} blocked (429, upgrade)', s == 429 and j.get('upgrade'))
    else:
        for i in range(30): last = call('/usage/consume', {'tool': 'compress-pdf', 'bytes': 1000, 'files': 1}, ck)[0]
        check(f'{pid}: advanced jobs unlimited (30 ok)', last == 200)
    if pid == 'guest':
        s, j, _ = call('/saved', {'tool': 'merge-pdf', 'name': 'x', 'opts': {}, 'files': [], 'summary': {}}, None); check('guest: cannot save (401)', s == 401)
    else:
        n = p['saved_max']; last = 200
        for i in range(n): last = call('/saved', {'tool': 'merge-pdf', 'name': f's{i}', 'opts': {}, 'files': [], 'summary': {}}, ck)[0]
        check(f'{pid}: {n} saved operations allowed', last == 200)
        s, j, _ = call('/saved', {'tool': 'merge-pdf', 'name': 'over', 'opts': {}, 'files': [], 'summary': {}}, ck); check(f'{pid}: saved #{n + 1} refused', s == 400 and j.get('upgrade'))
    check(f'{pid}: ads per plan = {p["ads"]} (expected {dict(guest=2, free=2, pro=1, business=0)[pid]})', p['ads'] == dict(guest=2, free=2, pro=1, business=0)[pid])
    rows.append((pid, p['heavy_daily'], p['max_mb'], p['max_files'], p['saved_max'], p['saved_mb'], p['history_days'], p['ads']))
print('\nPLAN MATRIX (plan, advanced/day, max MB, files/batch, saved ops, saved MB, history days, ads)')
for r in rows: print(r)
print(f'{sum(res)}/{len(res)} passed'); sys.exit(0 if all(res) else 1)
