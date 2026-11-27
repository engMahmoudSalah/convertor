# Admin Payments check against a LOCAL worker started with --var ADMIN_SETUP_KEY:localkey --var ALLOW_TEST_SEED:1. Never run on production.
import json, sys, random
from playwright.sync_api import sync_playwright
B = 'http://localhost:8787'; ok = True; fails = []
def check(n, c, extra=''):
    global ok; ok &= bool(c); print('PASS' if c else 'FAIL', n, '' if c else extra)
    if not c: fails.append(n)
tag = random.randint(10000, 99999); PW = 'correct horse 1'
with sync_playwright() as pw:
    b = pw.chromium.launch(); H = {'content-type': 'application/json'}
    def ctx():
        c = b.new_context(viewport={'width': 1280, 'height': 900}); c.add_init_script("localStorage.setItem('mc_consent','essential')"); return c
    def api(c, path, body=None, method=None):
        r = c.request.fetch(B + '/api' + path, method=method or ('GET' if body is None else 'POST'), data=None if body is None else json.dumps(body), headers=H)
        try: j = r.json()
        except Exception: j = {}
        return r.status, j
    adm = ctx(); usr = ctx()
    api(adm, '/auth/signup', {'email': f'padm{tag}@example.com', 'password': PW, 'name': 'A'}); api(usr, '/auth/signup', {'email': f'pusr{tag}@example.com', 'password': PW, 'name': 'U'})
    check('claim', api(adm, '/admin/claim', {'key': 'localkey'})[0] == 200)
    check('non-admin orders 403', api(usr, '/admin/orders')[0] == 403)
    check('non-admin seed 403', api(usr, '/admin/orders/seed', {'n': 5})[0] == 403)
    s, j = api(adm, '/admin/orders/seed', {'n': 30}); check('seed 30', s == 200 and len(j['ids']) == 30, (s, j))
    s, j = api(adm, '/admin/orders?size=10&page=2'); check('paging', len(j['orders']) == 10 and j['total'] >= 30 and j['page'] == 2)
    s, j = api(adm, '/admin/orders?status=paid&size=100'); check('status filter', j['orders'] and all(o['status'] == 'paid' for o in j['orders']))
    s, j = api(adm, '/admin/orders?currency=USD&size=100'); check('currency filter', j['orders'] and all(o['currency'] == 'USD' for o in j['orders']))
    s, j = api(adm, f'/admin/orders?q=padm{tag}&size=100'); check('email search', j['total'] >= 30)
    s, j = api(adm, "/admin/orders?q=%27%20OR%201%3D1%20--"); check('sql-ish query is inert', s == 200 and j['total'] == 0)
    s, j = api(adm, '/admin/orders?status=bogus&size=100'); check('bad status ignored, no crash', s == 200)
    s, j = api(adm, '/admin/orders?status=paid&currency=EGP&size=100'); sm = sum(o['amount'] for o in j['orders']); tt = sum(x['amt'] for x in j['totals'] if x['status'] == 'paid' and x['currency'] == 'EGP'); check('totals match rows', abs(sm - tt) < 0.01 and tt > 0, (sm, tt))
    s, j = api(adm, '/admin/orders'); check('byDay has paid data', len(j['byDay']) > 0)
    pg = adm.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.goto(B + '/admin'); pg.wait_for_timeout(1500)
    pg.get_by_role('tab', name='Payments', exact=True).click(); pg.wait_for_timeout(1000)
    check('UI rows shown', pg.locator('tbody tr').count() >= 20)
    pg.get_by_role('button', name='failed').first.click(); pg.wait_for_timeout(900)
    check('UI status segment filters', pg.locator('tbody tr').count() > 0 and pg.locator('tbody tr', has_text='paid').count() == 0)
    pg.get_by_role('button', name='All', exact=True).click(); pg.wait_for_timeout(700)
    pg.get_by_label('Search orders').fill('nomatch-zzz'); pg.wait_for_timeout(1000); check('UI empty state', pg.get_by_text('No orders match these filters.').count() == 1)
    pg.get_by_label('Search orders').fill(''); pg.wait_for_timeout(1000)
    pg.get_by_role('button', name='Details').first.click(); check('UI detail row', pg.get_by_text('provider: paymob').count() >= 1)
    with pg.expect_download() as dl: pg.get_by_role('button', name='Export CSV').click()
    check('UI CSV download', dl.value.suggested_filename == 'orders.csv')
    check('no horizontal overflow', pg.evaluate('document.documentElement.scrollWidth') <= 1280)
    pg.screenshot(path='/downloads/pay-d.png', full_page=False)
    check('no JS errors', not errs, errs)
    check('seed purge', api(adm, '/admin/orders/seed', {}, method='DELETE')[0] == 200 and api(adm, '/admin/orders')[1]['total'] == 0)
    for c, e in [(usr, f'pusr{tag}')]:
        api(c, '/auth/login', {'email': e + '@example.com', 'password': PW}); check('purge user', api(c, '/auth/delete', {'immediate': True, 'password': PW})[0] == 200)
    b.close()
print('ALL PASS' if ok else 'FAILED: ' + ', '.join(fails)); sys.exit(0 if ok else 1)
