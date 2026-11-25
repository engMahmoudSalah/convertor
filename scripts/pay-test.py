# Local payment flow test: mock Paymob intention API + signed webhook. Usage: python3 scripts/pay-test.py <base> <mock_port> <hmac_secret>
import json, sys, hmac, hashlib, urllib.request, urllib.error, random
B, HM = sys.argv[1], sys.argv[3]
def call(path, body=None, cookie=None):
    h = {'content-type': 'application/json'}
    if cookie: h['cookie'] = cookie
    r = urllib.request.Request(B + path, data=None if body is None else json.dumps(body).encode(), headers=h)
    try: resp = urllib.request.urlopen(r)
    except urllib.error.HTTPError as e: resp = e
    ck = resp.headers.get('set-cookie'); return resp.status, json.loads(resp.read() or b'{}'), (ck.split(';')[0] if ck else None)
ok = True
def check(n, c):
    global ok; ok &= bool(c); print('PASS' if c else 'FAIL', n)
KEYS = ['amount_cents','created_at','currency','error_occured','has_parent_transaction','id','integration_id','is_3d_secure','is_auth','is_capture','is_refunded','is_standalone_payment','is_voided','order.id','owner','pending','source_data.pan','source_data.sub_type','source_data.type','success']
def g(o, p):
    for k in p.split('.'): o = o[k]
    return o
def s(v): return 'true' if v is True else 'false' if v is False else str(v)
def sign(obj): return hmac.new(HM.encode(), ''.join(s(g(obj, k)) for k in KEYS).encode(), hashlib.sha512).hexdigest()
em = f'pay{random.randint(10000,99999)}@example.com'
st, j, ck = call('/api/auth/signup', {'email': em, 'password': 'correct horse 1', 'name': 'Pay Tester'})
st, j, _ = call('/api/billing/checkout', {'plan': 'pro'}); check('checkout needs login', st == 401)
st, j, _ = call('/api/billing/checkout', {'plan': 'pro'}, ck); check('checkout returns Paymob URL', st == 200 and 'eg.checkout.paymob.com' in j.get('url', ''))
st, j, _ = call('/api/billing/status', cookie=ck); o = j['orders'][0]; check('order pending', o['status'] == 'pending' and o['amount'] == 249)
def obj(oid, amount=24900, success=True):
    return {'amount_cents': amount, 'created_at': '2026-11-25T18:00:00.1', 'currency': 'EGP', 'error_occured': False, 'has_parent_transaction': False, 'id': 777001, 'integration_id': 1, 'is_3d_secure': True, 'is_auth': False, 'is_capture': False, 'is_refunded': False, 'is_standalone_payment': True, 'is_voided': False, 'order': {'id': 55, 'merchant_order_id': oid}, 'owner': 9, 'pending': False, 'source_data': {'pan': '2346', 'sub_type': 'MasterCard', 'type': 'card'}, 'success': success}
bad = obj(o['id']); st, _, _ = call('/api/webhooks/paymob?hmac=deadbeef', {'obj': bad}); check('bad signature rejected 401', st == 401)
st, _, _ = call('/api/webhooks/paymob?hmac=' + sign(bad), {'obj': obj(o['id'], 100)}); check('tampered body rejected', st == 401)
wrong = obj(o['id'], 100); st, _, _ = call('/api/webhooks/paymob?hmac=' + sign(wrong), {'obj': wrong}); st2, j2, _ = call('/api/me', cookie=ck); check('wrong amount does not upgrade', j2['user']['plan'] == 'free')
good = obj(o['id']); st, _, _ = call('/api/webhooks/paymob?hmac=' + sign(good), {'obj': good}); st2, j2, _ = call('/api/me', cookie=ck)
check('valid payment upgrades to pro with expiry', st == 200 and j2['user']['plan'] == 'pro' and j2['user']['plan_until'])
st, _, _ = call('/api/webhooks/paymob?hmac=' + sign(good), {'obj': good}); st3, j3, _ = call('/api/me', cookie=ck); check('replay is idempotent', j3['user']['plan_until'] == j2['user']['plan_until'])
st, j, _ = call('/api/billing/status', cookie=ck); check('order paid', j['orders'][0]['status'] == 'paid')
print('ALL OK' if ok else 'FAILED'); sys.exit(0 if ok else 1)
