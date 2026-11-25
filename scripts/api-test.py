import json, sys, urllib.request, urllib.error
B = sys.argv[1]; KEY = sys.argv[2] if len(sys.argv) > 2 else None
def call(path, body=None, cookie=None, method=None):
    h = {'content-type': 'application/json', 'user-agent': 'mc-test/1'}
    if cookie: h['cookie'] = cookie
    r = urllib.request.Request(B + '/api' + path, data=None if body is None else json.dumps(body).encode(), headers=h, method=method or ('GET' if body is None else 'POST'))
    try: resp = urllib.request.urlopen(r)
    except urllib.error.HTTPError as e: resp = e
    ck = resp.headers.get('set-cookie'); return resp.status, json.loads(resp.read() or b'{}'), (ck.split(';')[0] if ck else None)
ok = True
def check(name, cond):
    global ok; ok &= bool(cond); print('PASS' if cond else 'FAIL', name)
import random; tag = random.randint(10000, 99999); em = f'test{tag}@example.com'
s, j, ck = call('/auth/signup', {'email': em, 'password': 'short'}); check('weak password rejected', s == 400)
s, j, ck = call('/auth/signup', {'email': em, 'password': 'correct horse 1', 'name': 'T'}); check('signup', s == 200 and ck and j['user']['plan'] == 'free')
s, j, _ = call('/auth/signup', {'email': em, 'password': 'correct horse 1'}); check('duplicate email rejected', s == 409)
s, j, _ = call('/auth/login', {'email': em, 'password': 'wrong password'}); check('wrong password 401', s == 401)
s, j, ck2 = call('/auth/login', {'email': em, 'password': 'correct horse 1'}); check('login', s == 200 and ck2)
s, j, _ = call('/me', cookie=ck2); check('me returns user+plan', j['user']['email'] == em and j['plan']['id'] == 'free')
for i in range(10): s, j, _ = call('/usage/consume', {'tool': 'compress-pdf', 'bytes': 1000}, ck2)
check('free plan allows 10 heavy jobs', s == 200)
s, j, _ = call('/usage/consume', {'tool': 'compress-pdf', 'bytes': 1000}, ck2); check('11th heavy job blocked 429 with upgrade', s == 429 and j.get('upgrade'))
s, j, _ = call('/usage/consume', {'tool': 'merge-pdf', 'bytes': 1000}, ck2); check('basic tools unlimited', s == 200)
s, j, _ = call('/usage/consume', {'tool': 'merge-pdf', 'bytes': 80 * 1048576}, ck2); check('file size cap 413', s == 413)
s, j, _ = call('/admin/stats', cookie=ck2); check('non-admin blocked from admin', s == 403)
s, j, _ = call('/history', {'tool': 'merge-pdf', 'files': 2, 'bytes': 99, 'ms': 5}, ck2); check('history write', s == 200)
s, j, _ = call('/history', cookie=ck2); check('free plan has no history window (empty/none)', s == 200)
if KEY:
    s, j, _ = call('/admin/claim', {'key': 'nope'}, ck2); check('bad setup key rejected', s in (403, 409))
    s, j, _ = call('/admin/claim', {'key': KEY}, ck2); check('admin claim', s == 200 or s == 409)
    if s == 200:
        s, j, _ = call('/admin/stats', cookie=ck2); check('admin stats', s == 200 and j['users'] >= 1)
        s, j, _ = call('/admin/users', cookie=ck2); uid = [u for u in j['users'] if u['email'] == em][0]['id']; check('admin lists users', True)
        s, j, _ = call('/admin/user', {'id': uid, 'plan': 'pro'}, ck2); check('admin sets plan', s == 200)
        s, j, _ = call('/usage/consume', {'tool': 'compress-pdf', 'bytes': 1000}, ck2); check('pro now unblocked', s == 200)
        s, j, _ = call('/admin/flag', {'tool': 'merge-pdf', 'enabled': False}, ck2); s2, j2, _ = call('/usage/consume', {'tool': 'merge-pdf', 'bytes': 1}, ck2); check('disabled tool refused 503', s2 == 503)
        call('/admin/flag', {'tool': 'merge-pdf', 'enabled': True}, ck2)
        s, j, _ = call('/admin/user', {'id': uid, 'banned': True}, ck2); check('cannot suspend self', s == 400)
        # second user: ban flow
        em2 = f'ban{tag}@example.com'; s, j, c3 = call('/auth/signup', {'email': em2, 'password': 'correct horse 1'})
        u2 = j['user']['id']; call('/admin/user', {'id': u2, 'banned': True}, ck2)
        s, j, _ = call('/me', cookie=c3); check('banned session invalid', j.get('user') is None)
        s, j, _ = call('/auth/login', {'email': em2, 'password': 'correct horse 1'}); check('banned login refused 403', s == 403)
        s, j, _ = call('/admin/audit', cookie=ck2); check('audit log records actions', len(j['audit']) >= 4)
s, j, _ = call('/auth/signup', {'email': 'x@y.z', 'password': 'abcdefgh'}) ; 
print('ALL OK' if ok else 'SOME FAILED')
