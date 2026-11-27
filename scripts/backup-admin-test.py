# Admin Backup check, LOCAL worker only.
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
    adm = mk(); usr = mk()
    f = lambda c, p, d=None: c.request.fetch(B + '/api' + p, method='GET' if d is None else 'POST', data=None if d is None else json.dumps(d), headers=H)
    f(adm, '/auth/signup', {'email': f'badm{tag}@example.com', 'password': PW, 'name': 'A'}); f(usr, '/auth/signup', {'email': f'busr{tag}@example.com', 'password': PW, 'name': 'U'})
    check('claim', f(adm, '/admin/claim', {'key': 'localkey'}).status == 200)
    check('non-admin export 403', f(usr, '/admin/export').status == 403)
    r = f(adm, '/admin/export'); j = r.json(); check('full export has all parts', r.status == 200 and all(k in j for k in ['users', 'plans', 'flags', 'orders', 'saved', 'history', 'audit']))
    check('no secrets in users', all('password' not in json.dumps(u).lower() and 'hash' not in json.dumps(u).lower() for u in j['users']))
    r = f(adm, '/admin/export?only=plans,orders,bogus'); j = r.json(); check('only= limits parts', set(j['parts']) == {'plans', 'orders'} and 'users' not in j and len(j['plans']) == 4)
    j = f(adm, '/admin/export?only=bogus').json(); check('unknown only= falls back to all', 'users' in j)
    pg = adm.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.goto(B + '/admin'); pg.wait_for_timeout(1500)
    pg.get_by_role('tab', name='Backup', exact=True).click(); pg.wait_for_timeout(1000)
    check('UI 7 dataset cards', pg.locator('input[type=checkbox]').count() == 7)
    pg.get_by_label('Users', exact=True).uncheck(); pg.get_by_label('Audit log').uncheck()
    with pg.expect_download() as dl: pg.get_by_role('button', name='Download backup (JSON)').click()
    path = dl.value.path(); data = json.load(open(path)); check('UI partial download honours selection', set(data['parts']) == {'plans', 'flags', 'orders', 'saved', 'history'} and 'users' not in data)
    pg.wait_for_timeout(500); check('UI verification line', pg.get_by_text('Backup checked after download').count() == 1)
    check('UI last backup shown', pg.get_by_text('No backup was downloaded').count() == 0)
    pg.get_by_role('button', name='Select all').click(); pg.get_by_role('button', name='Clear all').click(); check('UI download disabled when none selected', pg.get_by_role('button', name='Download backup (JSON)').is_disabled())
    pg.get_by_role('button', name='Select all').click()
    check('no overflow', pg.evaluate('document.documentElement.scrollWidth') <= 1280); check('no JS errors', not errs, errs)
    pg.screenshot(path='/downloads/backup-d.png')
    f(usr, '/auth/login', {'email': f'busr{tag}@example.com', 'password': PW}); f(usr, '/auth/delete', {'immediate': True, 'password': PW}); b.close()
print('ALL PASS' if ok else 'FAILED: ' + ', '.join(fails)); sys.exit(0 if ok else 1)
