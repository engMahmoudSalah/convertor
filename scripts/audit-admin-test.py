# Admin Abuse + Audit check, LOCAL worker only (ALLOW_TEST_SEED=1).
import json, sys, random
from playwright.sync_api import sync_playwright
B = 'http://localhost:8787'; ok = True; fails = []
def check(n, c, extra=''):
    global ok; ok &= bool(c); print('PASS' if c else 'FAIL', n, '' if c else extra)
    if not c: fails.append(n)
tag = random.randint(10000, 99999); PW = 'correct horse 1'; H = {'content-type': 'application/json'}
with sync_playwright() as pw:
    b = pw.chromium.launch()
    def mk():
        c = b.new_context(viewport={'width': 1280, 'height': 900}); c.add_init_script("localStorage.setItem('mc_consent','essential')"); return c
    def api(c, p, d=None, m=None):
        r = c.request.fetch(B + '/api' + p, method=m or ('GET' if d is None else 'POST'), data=None if d is None else json.dumps(d), headers=H)
        try: j = r.json()
        except Exception: j = {}
        return r.status, j
    adm = mk(); usr = mk()
    api(adm, '/auth/signup', {'email': f'aadm{tag}@example.com', 'password': PW, 'name': 'A'}); api(usr, '/auth/signup', {'email': f'ausr{tag}@example.com', 'password': PW, 'name': 'U'})
    check('claim', api(adm, '/admin/claim', {'key': 'localkey'})[0] == 200)
    check('non-admin audit/abuse 403', api(usr, '/admin/audit')[0] == 403 and api(usr, '/admin/abuse')[0] == 403 and api(usr, '/admin/audit/seed', {})[0] == 403)
    s, base = api(adm, '/admin/audit?q=seedtest&size=100'); b0 = base['total']
    check('seed', api(adm, '/admin/audit/seed', {})[0] == 200)
    s, j = api(adm, '/admin/audit?q=seedtest&size=100'); check('search by actor', j['total'] - b0 == 30)
    s, j = api(adm, '/admin/audit?q=seedtest&action=ban&size=100'); check('action filter', j['total'] == 5 and all(a['action'] == 'ban' for a in j['audit']))
    s, j = api(adm, '/admin/audit?q=seedtest&group=abuse&size=100'); check('abuse group only', j['total'] == 20 and all(a['action'] in ('rate_limited', 'ban', 'mail_failed') for a in j['audit']), j['total'])
    s, j = api(adm, '/admin/audit?q=seedtest&size=10&page=3'); check('paging', len(j['audit']) == 10 and j['page'] == 3)
    s, j = api(adm, '/admin/audit?q=seedtest&days=1&size=100'); check('days filter narrows', 0 < j['total'] < 30, j['total'])
    s, j = api(adm, "/admin/audit?q=%27%20OR%201%3D1%20--"); check('sql-ish inert', s == 200 and j['total'] == 0)
    s, j = api(adm, '/admin/audit?action=bad%20action'); check('bad action ignored', s == 200)
    s, j = api(adm, '/admin/abuse?days=7'); check('abuse summary', j['limited'] >= 10 and j['bans'] >= 5 and j['mailFailed'] >= 5 and any(k['k'] == 'li' for k in j['byKind']) and sum(x['n'] for x in j['perDay']) == j['limited'], j)
    s, j = api(adm, '/admin/abuse?days=999'); check('bad days default 7', j['days'] == 7)
    pg = adm.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.goto(B + '/admin'); pg.wait_for_timeout(1500)
    pg.get_by_role('tab', name='Abuse', exact=True).click(); pg.wait_for_timeout(1200)
    check('UI abuse cards', pg.get_by_text('Blocked by rate limit').count() == 1 and pg.locator('li', has_text='rate_limited').count() > 0)
    pg.screenshot(path='/downloads/abuse-d.png')
    pg.get_by_role('tab', name='Audit', exact=True).click(); pg.wait_for_timeout(1000)
    n0 = pg.locator('ul.divide-y li').count(); pg.get_by_label('Filter the audit log').first.fill('seedtest'); pg.wait_for_timeout(1000); check('UI audit filter', pg.locator('ul.divide-y li').count() == 25 and n0 >= 25)
    pg.get_by_label('Action').select_option('plan_changed'); pg.wait_for_timeout(800); check('UI action select', pg.locator('ul.divide-y li').count() == 5)
    with pg.expect_download() as dl: pg.get_by_role('button', name='Export CSV').click()
    check('UI CSV', dl.value.suggested_filename == 'audit.csv')
    check('no overflow', pg.evaluate('document.documentElement.scrollWidth') <= 1280); check('no JS errors', not errs, errs)
    pg.screenshot(path='/downloads/audit-d.png')
    check('purge', api(adm, '/admin/audit/seed', {}, 'DELETE')[0] == 200 and api(adm, '/admin/audit?q=seedtest')[1]['total'] == 0)
    api(usr, '/auth/login', {'email': f'ausr{tag}@example.com', 'password': PW}); api(usr, '/auth/delete', {'immediate': True, 'password': PW})
    b.close()
print('ALL PASS' if ok else 'FAILED: ' + ', '.join(fails)); sys.exit(0 if ok else 1)
