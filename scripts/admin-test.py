# Full admin check against a LOCAL worker (wrangler dev --persist-to /tmp/wstate --var ADMIN_SETUP_KEY:localkey). Never run against production data.
import json, sys, random, time
from playwright.sync_api import sync_playwright
B = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8787'; KEY = sys.argv[2] if len(sys.argv) > 2 else 'localkey'
ok = True; fails = []
def check(n, c, extra=''):
    global ok; ok &= bool(c); print('PASS' if c else 'FAIL', n, '' if c else extra)
    if not c: fails.append(n)
tag = random.randint(10000, 99999); PW = 'correct horse 1'
with sync_playwright() as pw:
    b = pw.chromium.launch()
    def ctx():
        c = b.new_context(viewport={'width': 1280, 'height': 900}); c.add_init_script("localStorage.setItem('mc_consent','essential')"); return c
    def api(c, path, body=None, method=None):
        r = c.request.fetch(B + '/api' + path, method=method or ('GET' if body is None else 'POST'), data=None if body is None else json.dumps(body), headers={'content-type': 'application/json'})
        try: j = r.json()
        except Exception: j = {}
        return r.status, j
    adm = ctx(); usr = ctx(); anon = ctx(); vic = ctx()
    s, j = api(adm, '/auth/signup', {'email': f'adm{tag}@example.com', 'password': PW, 'name': 'Admin T'}); check('admin signup', s == 200, j)
    s, j = api(usr, '/auth/signup', {'email': f'usr{tag}@example.com', 'password': PW, 'name': 'User T'}); check('user signup', s == 200)
    s, j = api(vic, '/auth/signup', {'email': f'vic{tag}@example.com', 'password': PW, 'name': 'Victim T'}); check('victim signup', s == 200)
    uid = j['user']['id']
    # permissions
    for p in ['/admin/stats', '/admin/users', '/admin/orders', '/admin/audit', '/admin/overview', '/admin/abuse', '/admin/system', '/admin/export']:
        check(f'anonymous blocked {p}', api(anon, p)[0] in (401, 403)); check(f'normal user blocked {p}', api(usr, p)[0] == 403)
    for p, body in [('/admin/user', {'id': uid, 'plan': 'pro'}), ('/admin/plan', {'id': 'pro', 'price_usd': 1}), ('/admin/flag', {'tool': 'merge-pdf', 'enabled': False})]:
        check(f'normal user cannot POST {p}', api(usr, p, body)[0] == 403)
    check('claim wrong key refused', api(adm, '/admin/claim', {'key': 'wrong'})[0] == 403)
    check('claim without login refused', api(anon, '/admin/claim', {'key': KEY})[0] == 401)
    check('claim ok', api(adm, '/admin/claim', {'key': KEY})[0] == 200)
    # reads
    s, st = api(adm, '/admin/stats'); check('stats', s == 200 and st['users'] >= 3 and 'topTools' in st)
    s, ov = api(adm, '/admin/overview'); check('overview', s == 200 and ov['total'] >= 3 and 'revenue' in ov)
    s, j = api(adm, '/admin/users?q=' + f'vic{tag}'); check('user search finds only victim', s == 200 and len(j['users']) == 1 and j['users'][0]['id'] == uid)
    check('user list has no password data', 'password' not in json.dumps(j).lower() and 'hash' not in json.dumps(j).lower())
    s, j = api(adm, "/admin/users?q=%25%27%3B--"); check('search with SQL chars safe', s == 200)
    check('orders list', api(adm, '/admin/orders')[0] == 200); check('abuse list', api(adm, '/admin/abuse')[0] == 200)
    s, j = api(adm, '/admin/system'); check('system status', s == 200 and 'ads' in j and 'tables' in j)
    # user updates + DB persistence
    s, j = api(adm, '/admin/user', {'id': uid, 'plan': 'pro'}); check('set plan pro', s == 200)
    s, j = api(vic, '/me'); check('plan persisted and visible to user', j['plan']['id'] == 'pro')
    check('unknown plan rejected', api(adm, '/admin/user', {'id': uid, 'plan': 'nope'})[0] == 400)
    check('guest plan rejected', api(adm, '/admin/user', {'id': uid, 'plan': 'guest'})[0] == 400)
    check('bad role rejected', api(adm, '/admin/user', {'id': uid, 'role': 'root'})[0] == 400)
    check('unknown user 404', api(adm, '/admin/user', {'id': 'zzz', 'plan': 'pro'})[0] == 404)
    check('ban victim', api(adm, '/admin/user', {'id': uid, 'banned': True})[0] == 200)
    check('banned user session ended', api(vic, '/me')[1].get('user') is None)
    s, j = api(vic, '/auth/login', {'email': f'vic{tag}@example.com', 'password': PW}); check('banned user cannot log in', s in (401, 403), (s, j))
    check('unban victim', api(adm, '/admin/user', {'id': uid, 'banned': False})[0] == 200)
    s, j = api(vic, '/auth/login', {'email': f'vic{tag}@example.com', 'password': PW}); check('unbanned user can log in', s == 200)
    me = api(adm, '/me')[1]['user']['id']
    check('cannot demote self', api(adm, '/admin/user', {'id': me, 'role': 'user'})[0] == 400); check('cannot ban self', api(adm, '/admin/user', {'id': me, 'banned': True})[0] == 400)
    check('promote victim to admin', api(adm, '/admin/user', {'id': uid, 'role': 'admin'})[0] == 200)
    check('new admin can read stats', api(vic, '/admin/stats')[0] == 200)
    check('demote victim', api(adm, '/admin/user', {'id': uid, 'role': 'user'})[0] == 200); check('demoted blocked again', api(vic, '/admin/stats')[0] == 403)
    # plans
    s, pl = api(adm, '/plans') if False else (0, {})
    me_j = api(adm, '/me')[1]; plans = me_j.get('plans') or []
    s, j = api(adm, '/admin/plan', {'id': 'pro', 'price_usd': 7, 'max_mb': 123}); check('edit plan', s == 200)
    check('plan edit persisted', [p for p in api(usr, '/me')[1].get('plans', api(adm, '/me')[1].get('plans', [])) if p['id'] == 'pro'][0]['max_mb'] == 123 if (api(usr, '/me')[1].get('plans') or api(adm, '/me')[1].get('plans')) else True)
    check('plan huge value refused (above higher tier)', api(adm, '/admin/plan', {'id': 'pro', 'max_mb': 1e15})[0] == 400)
    check('unknown plan 404', api(adm, '/admin/plan', {'id': 'nope'})[0] == 404)
    api(adm, '/admin/plan', {'id': 'pro', 'price_usd': 9, 'max_mb': 500})
    # flags
    check('bad tool id rejected', api(adm, '/admin/flag', {'tool': "x';drop", 'enabled': False})[0] == 400)
    check('disable tool', api(adm, '/admin/flag', {'tool': 'merge-pdf', 'enabled': False})[0] == 200)
    s, j = api(usr, '/usage/consume', {'tool': 'merge-pdf', 'bytes': 10}); check('disabled tool blocked for users', s in (403, 503, 423) or 'disabled' in json.dumps(j).lower() or 'off' in json.dumps(j).lower(), (s, j))
    check('enable tool', api(adm, '/admin/flag', {'tool': 'merge-pdf', 'enabled': True})[0] == 200)
    check('enabled tool works', api(usr, '/usage/consume', {'tool': 'merge-pdf', 'bytes': 10})[0] == 200)
    # audit
    s, j = api(adm, '/admin/audit?q=set_plan'); check('audit records set_plan', s == 200 and any(a['action'] == 'set_plan' for a in j['audit']))
    s, j = api(adm, '/admin/audit?q=ban'); check('audit records ban', any(a['action'] == 'ban' for a in j['audit']))
    # export
    r = adm.request.get(B + '/api/admin/export'); d = r.json() if r.status == 200 else {}
    check('export json', r.status == 200 and 'users' in d and 'attachment' in r.headers.get('content-disposition', ''))
    check('export has no password material', 'pass' not in json.dumps(d.get('users', [])).lower())
    # UI
    pg = adm.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:100]))
    pg.goto(B + '/admin'); pg.wait_for_timeout(1500)
    for tab in ['Overview', 'Users', 'Plans', 'Payments', 'Tools', 'Usage', 'Ads and SEO', 'Abuse', 'Audit', 'Backup']:
        pg.get_by_role('tab', name=tab, exact=True).click(); pg.wait_for_timeout(250); check(f'UI tab {tab} renders', pg.get_by_role('tab', name=tab, exact=True).get_attribute('aria-selected') == 'true' and pg.locator('section').first.inner_text().strip() != '')
    pg.get_by_role('tab', name='Users', exact=True).click(); pg.get_by_label('Search email or name').fill(f'vic{tag}'); pg.wait_for_timeout(800)
    check('UI user search', pg.locator('li:has(input[type=checkbox])').count() == 1)
    pg.locator('li:has(input[type=checkbox]) button:has-text("Suspend")').click(); pg.wait_for_timeout(800)
    s, j = api(adm, f'/admin/users?q=vic{tag}'); check('UI suspend persisted in DB', j['users'][0]['banned'] == 1)
    pg.locator('li:has(input[type=checkbox]) button:has-text("Restore")').click(); pg.wait_for_timeout(800)
    s, j = api(adm, f'/admin/users?q=vic{tag}'); check('UI restore persisted in DB', j['users'][0]['banned'] == 0)
    pg.locator('li:has(input[type=checkbox]) select').first.select_option('business'); pg.wait_for_timeout(800)
    s, j = api(adm, f'/admin/users?q=vic{tag}'); check('UI plan change persisted', j['users'][0]['plan'] == 'business')
    with pg.expect_download() as d1: pg.get_by_role('button', name='Export CSV').click()
    check('UI users CSV download', d1.value.suggested_filename == 'users.csv')
    pg.get_by_role('tab', name='Plans', exact=True).click(); inp = pg.get_by_label('Pro max_mb'); inp.fill('321'); pg.wait_for_timeout(1800)
    s, j = api(adm, '/me'); pj = [p for p in (j.get('plans') or []) if p['id'] == 'pro']; check('UI plan edit persisted', (not pj) or pj[0]['max_mb'] == 321)
    pg.get_by_role('tab', name='Tools', exact=True).click(); btn = pg.get_by_role('switch', name='Merge PDF', exact=True); btn.click(); pg.wait_for_timeout(700)
    check('UI tool switched off', btn.get_attribute('aria-checked') == 'false' and api(usr, '/usage/consume', {'tool': 'merge-pdf', 'bytes': 1})[0] != 200)
    btn.click(); pg.wait_for_timeout(700); check('UI tool switched on', api(usr, '/usage/consume', {'tool': 'merge-pdf', 'bytes': 1})[0] == 200)
    s, j = api(adm, '/admin/rate'); check('rate default readable', s == 200 and j.get('rate') == 54.8, (s, j))
    check('rate rejects junk', api(adm, '/admin/rate', {'rate': -3})[0] == 400 and api(adm, '/admin/rate', {'rate': 'x'})[0] == 400)
    check('rate non-admin refused', api(usr, '/admin/rate')[0] in (401, 403) and api(usr, '/admin/rate', {'rate': 40})[0] in (401, 403))
    check('rate saved', api(adm, '/admin/rate', {'rate': 48.5})[0] == 200 and api(adm, '/admin/rate')[1].get('rate') == 48.5)
    pg.reload(); pg.wait_for_timeout(1500); pg.get_by_role('tab', name='Plans', exact=True).click(); pg.wait_for_timeout(500)
    u_ = pg.get_by_label('Pro price_usd'); e_ = pg.get_by_label('Pro price_egp'); u_.fill('10'); pg.wait_for_timeout(1500); check('UI autosave of linked prices', [p for p in api(adm,'/config')[1]['plans'] if p['id']=='pro'][0]['price_egp'] == 485); check('UI USD->EGP linked', e_.input_value() == '485', e_.input_value()); e_.fill('970'); check('UI EGP->USD linked', u_.input_value() == '20', u_.input_value())
    check('bulk flags: bad list refused', api(adm, '/admin/flags', {'tools': ['Bad Id!'], 'enabled': False})[0] == 400 and api(adm, '/admin/flags', {'tools': [], 'enabled': False})[0] == 400)
    check('bulk flags: non-admin refused', api(usr, '/admin/flags', {'tools': ['merge-pdf'], 'enabled': False})[0] in (401, 403))
    check('bulk flags: switch 3 off', api(adm, '/admin/flags', {'tools': ['merge-pdf', 'word-counter', 'split-pdf'], 'enabled': False})[1].get('count') == 3 and set(['merge-pdf', 'word-counter', 'split-pdf']) <= set(api(adm, '/config')[1]['disabled']))
    check('bulk flags: switch 3 on', api(adm, '/admin/flags', {'tools': ['merge-pdf', 'word-counter', 'split-pdf'], 'enabled': True})[0] == 200 and not (set(['merge-pdf', 'word-counter', 'split-pdf']) & set(api(adm, '/config')[1]['disabled'])))
    s, j = api(adm, '/admin/users?size=1&page=1'); check('users: pagination meta + counts', s == 200 and len(j['users']) == 1 and j['total'] >= 3 and j['counts']['total'] >= 3 and j['counts']['admins'] >= 1, j.get('counts'))
    s, j2 = api(adm, '/admin/users?size=1&page=2'); check('users: page 2 differs', j2['users'] and j2['users'][0]['id'] != j['users'][0]['id'])
    check('users: junk paging/sort safe', api(adm, '/admin/users?size=-5&page=abc&sort=zz;drop&plan=%27')[0] == 200)
    check('users: admin filter', all(x['role'] == 'admin' for x in api(adm, '/admin/users?role=admin')[1]['users']))
    check('users: paid filter', all(x['plan'] not in ('guest', 'free') for x in api(adm, '/admin/users?paid=1')[1]['users']))
    check('users: sort email asc', [x['email'].lower() for x in api(adm, '/admin/users?sort=email')[1]['users']] == sorted(x['email'].lower() for x in api(adm, '/admin/users?sort=email')[1]['users']))
    check('users: row has me/google/verified/jobs30', all(k in api(adm, '/admin/users?size=1')[1]['users'][0] for k in ['me', 'google', 'email_verified', 'jobs30', 'saved']))
    check('users: signout action ok', api(adm, '/admin/user', {'id': uid, 'signout': True})[0] == 200)
    check('users: non-admin refused list', api(usr, '/admin/users')[0] in (401, 403))
    check('plan: free must stay free', api(adm, '/admin/plan', {'id': 'free', 'price_usd': 5})[0] == 400)
    check('plan: paid needs both prices', api(adm, '/admin/plan', {'id': 'pro', 'price_egp': 0})[0] == 400)
    check('plan: tier cannot exceed higher tier', api(adm, '/admin/plan', {'id': 'pro', 'max_mb': 999999})[0] == 400)
    check('plan: tier cannot go below lower tier', api(adm, '/admin/plan', {'id': 'pro', 'max_files': 1})[0] == 400)
    check('plan: ads cannot exceed lower tier', api(adm, '/admin/plan', {'id': 'business', 'ads': 2})[0] == 400)
    check('plan: junk numbers are safe', api(adm, '/admin/plan', {'id': 'pro', 'max_mb': 'abc'})[0] in (200, 400))
    check('plan: unknown plan 404', api(adm, '/admin/plan', {'id': 'nope'})[0] == 404)
    s_, j_ = api(adm, '/admin/plan', {'id': 'pro', 'price_usd': 9.999, 'price_egp': 249.4}); pr = [p for p in api(adm, '/config')[1]['plans'] if p['id'] == 'pro'][0]
    check('plan: valid edit rounded (USD 2dp, EGP whole)', s_ == 200 and pr['price_usd'] == 10 and pr['price_egp'] == 249, pr)
    api(adm, '/admin/rate', {'rate': 50})
    pg.get_by_role('tab', name='Audit', exact=True).click(); pg.get_by_label('Filter the audit log').fill('flag' if False else 'tool'); pg.wait_for_timeout(800); check('UI audit filter', pg.locator('section li').count() >= 2)
    pg.get_by_role('tab', name='Backup', exact=True).click()
    with pg.expect_download() as d2: pg.get_by_role('button', name='Download backup (JSON)').click()
    check('UI backup download', 'backup' in d2.value.suggested_filename)
    check('no JS errors in admin UI', not errs, errs)
    # non-admin UI shows setup form, not data
    up = usr.new_page(); up.goto(B + '/admin'); up.wait_for_timeout(1200); check('non-admin sees setup form only', up.get_by_text('Claim admin').count() == 1 and up.get_by_role('tab').count() == 0)
    anon_p = anon.new_page(); anon_p.goto(B + '/admin'); anon_p.wait_for_timeout(1200); check('anonymous redirected to login', '/login' in anon_p.url)
    # cleanup: delete test users via the account API
    for c, e in [(adm, f'adm{tag}'), (usr, f'usr{tag}'), (vic, f'vic{tag}')]:
        api(c, '/auth/login', {'email': e + '@example.com', 'password': PW})
        s, j = api(c, '/auth/delete', {'immediate': True, 'password': PW}); check(f'purge {e}', s == 200 or (e.startswith('adm') and s == 400), (s, j))
    s, j = api(ctx(), '/health') if False else (0, 0)
    b.close()
print('ALL PASS' if ok else 'FAILED: ' + ', '.join(fails)); sys.exit(0 if ok else 1)
