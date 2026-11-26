# Admin Usage check, LOCAL worker only (--var ADMIN_SETUP_KEY:localkey --var ALLOW_TEST_SEED:1).
import json, sys, random
from playwright.sync_api import sync_playwright
B = 'http://localhost:8787'; ok = True; fails = []
def check(n, c, extra=''):
    global ok; ok &= bool(c); print('PASS' if c else 'FAIL', n, '' if c else extra)
    if not c: fails.append(n)
tag = random.randint(10000, 99999); PW = 'correct horse 1'; H = {'content-type': 'application/json'}
with sync_playwright() as pw:
    b = pw.chromium.launch()
    def ctx():
        c = b.new_context(viewport={'width': 1280, 'height': 900}); c.add_init_script("localStorage.setItem('mc_consent','essential')"); return c
    def api(c, path, body=None, method=None):
        r = c.request.fetch(B + '/api' + path, method=method or ('GET' if body is None else 'POST'), data=None if body is None else json.dumps(body), headers=H)
        try: j = r.json()
        except Exception: j = {}
        return r.status, j
    adm = ctx(); usr = ctx()
    api(adm, '/auth/signup', {'email': f'uadm{tag}@example.com', 'password': PW, 'name': 'A'}); api(usr, '/auth/signup', {'email': f'uusr{tag}@example.com', 'password': PW, 'name': 'U'})
    check('claim', api(adm, '/admin/claim', {'key': 'localkey'})[0] == 200)
    check('non-admin usage 403', api(usr, '/admin/usage')[0] == 403)
    s, base = api(adm, '/admin/usage?days=7')
    check('seed', api(adm, '/admin/usage/seed', {'n': 30})[0] == 200)
    s, j = api(adm, '/admin/usage?days=7'); check('jobs counted', j['cur']['jobs'] - base['cur']['jobs'] == 30, (j['cur'], base['cur']))
    check('visitors counted', j['cur']['visitors'] - base['cur']['visitors'] >= 4)
    t = {x['tool']: x for x in j['tools']}; check('per-tool rows', all(k in t and t[k]['n'] >= 7 for k in ['merge-pdf', 'compress-pdf', 'json-to-csv', 'word-counter']))
    check('perDay sums', sum(x['n'] for x in j['perDay']) == j['cur']['jobs'])
    check('perHour sums', sum(x['n'] for x in j['perHour']) == j['cur']['jobs'])
    s, j2 = api(adm, '/admin/usage?days=999'); check('bad days defaults to 30', j2['days'] == 30)
    pg = adm.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.goto(B + '/admin'); pg.wait_for_timeout(1500)
    pg.get_by_role('tab', name='Usage', exact=True).click(); pg.wait_for_timeout(1200)
    check('UI rows for all tools', pg.locator('tbody tr').count() > 60)
    pg.get_by_role('button', name='PDF tools').click(); pg.wait_for_timeout(300)
    check('UI section filter', 0 < pg.locator('tbody tr').count() < 60 and pg.locator('tbody tr').first.inner_text().startswith(('Merge', 'Compress')))
    pg.get_by_role('button', name='Last 90 days').click(); pg.wait_for_timeout(1000)
    check('UI period switch', pg.get_by_role('button', name='Last 90 days').get_attribute('aria-pressed') == 'true')
    pg.get_by_role('button', name='All', exact=True).click(); pg.get_by_label('Only tools with no use').check(); pg.wait_for_timeout(300)
    check('UI unused filter', pg.locator('tbody tr', has_text='Merge PDF').count() == 0 and pg.locator('tbody tr').count() > 10)
    pg.get_by_label('Only tools with no use').uncheck()
    with pg.expect_download() as dl: pg.get_by_role('button', name='Export CSV').click()
    check('UI CSV', dl.value.suggested_filename.startswith('usage-'))
    check('no overflow', pg.evaluate('document.documentElement.scrollWidth') <= 1280)
    pg.screenshot(path='/downloads/usage-d.png')
    check('no JS errors', not errs, errs)
    check('purge seed', api(adm, '/admin/usage/seed', {}, 'DELETE')[0] == 200 and api(adm, '/admin/usage?days=7')[1]['cur']['jobs'] == base['cur']['jobs'])
    api(usr, '/auth/login', {'email': f'uusr{tag}@example.com', 'password': PW}); check('purge user', api(usr, '/auth/delete', {'password': PW})[0] == 200)
    b.close()
print('ALL PASS' if ok else 'FAILED: ' + ', '.join(fails)); sys.exit(0 if ok else 1)
