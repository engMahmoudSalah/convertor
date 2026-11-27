"""7-day deletion grace: schedule, still signed in, restore, re-schedule, immediate purge (test flag, LOCAL only)."""
import sys, json, urllib.request, urllib.error, uuid, time
B = sys.argv[1].rstrip('/'); res = []
def call(m, p, b=None, ck=None):
    h = {'user-agent': 'Mozilla/5.0 g', 'origin': B, 'content-type': 'application/json'}
    if ck: h['cookie'] = ck
    r = urllib.request.Request(B + p, data=json.dumps(b if b is not None else {}).encode() if m == 'POST' else None, headers=h, method=m)
    try: x = urllib.request.urlopen(r); return x.status, json.loads(x.read() or b'{}'), x.headers
    except urllib.error.HTTPError as e:
        try: j = json.loads(e.read())
        except Exception: j = {}
        return e.code, j, e.headers
def t(n, ok): res.append(ok); print('PASS' if ok else 'FAIL', n)
PW = 'Passw0rd!xyz9'; em = f'grace_{uuid.uuid4().hex[:8]}@example.com'
c, j, h = call('POST', '/api/auth/signup', {'email': em, 'password': PW, 'name': 'G'}); ck = h['set-cookie'].split(';')[0]
c, j, _ = call('POST', '/api/auth/delete', {'password': 'wrong'}, ck); t('wrong password rejected', c == 401)
c, j, _ = call('POST', '/api/auth/delete', {'password': PW}, ck); at = j.get('delete_at') or 0
t('delete schedules 7 days', c == 200 and abs((at - time.time() * 1000) - 7 * 86400e3) < 60e3)
c, j, _ = call('GET', '/api/me', ck=ck); t('still signed in, flag shown', j['user']['delete_at'] == at)
c, j, h2 = call('POST', '/api/auth/login', {'email': em, 'password': PW}); t('can log in during grace, flag shown', c == 200 and j['user']['delete_at'] == at)
c, j, _ = call('POST', '/api/auth/signup', {'email': em, 'password': PW, 'name': 'G'}); t('email still reserved', c == 409)
c, j, _ = call('POST', '/api/auth/restore', {}, ck); t('restore ok', c == 200)
c, j, _ = call('GET', '/api/me', ck=ck); t('flag cleared', j['user']['delete_at'] is None)
c, j, _ = call('POST', '/api/auth/restore', {}); t('restore needs sign-in', c == 401)
call('POST', '/api/auth/delete', {'password': PW}, ck)
c, j, _ = call('POST', '/api/auth/delete', {'password': PW, 'immediate': True}, ck); t('purge (test flag)', c == 200)
c, j, _ = call('POST', '/api/auth/login', {'email': em, 'password': PW}); t('gone after purge', c == 401)
print('ALL PASS' if all(res) else 'SOME FAIL')
