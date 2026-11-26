# Admin Overview check, LOCAL worker only (ALLOW_TEST_SEED=1).
import json, sys, random
from playwright.sync_api import sync_playwright
B = 'http://localhost:8787'; ok = True; fails = []
def check(n, c, extra=''):
    global ok; ok &= bool(c); print('PASS' if c else 'FAIL', n, '' if c else extra)
    if not c: fails.append(n)
tag = random.randint(10000, 99999); PW = 'correct horse 1'; H = {'content-type': 'application/json'}
with sync_playwright() as pw:
    b = pw.chromium.launch(); c = b.new_context(viewport={'width': 1280, 'height': 900}); c.add_init_script("localStorage.setItem('mc_consent','essential')")
    f = lambda p, d=None, m=None: c.request.fetch(B + '/api' + p, method=m or ('GET' if d is None else 'POST'), data=None if d is None else json.dumps(d), headers=H)
    f('/auth/signup', {'email': f'oadm{tag}@example.com', 'password': PW, 'name': 'A'}); check('claim', f('/admin/claim', {'key': 'localkey'}).status == 200)
    f('/admin/orders/seed', {'n': 10}); f('/admin/audit/seed', {}); f('/admin/usage/seed', {'n': 20})
    pg = c.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.goto(B + '/admin'); pg.wait_for_timeout(2000)
    check('needs-attention panel lists items', pg.get_by_text('Needs attention').count() >= 1 and pg.locator('section[aria-label="Needs attention"] li').count() >= 3)
    check('pending orders alert', pg.get_by_text('orders waiting for payment').count() >= 1)
    check('three KPI groups', all(pg.get_by_role('heading', name=h).count() == 1 for h in ['People', 'Activity', 'Money']))
    check('top tools use real names', pg.get_by_text('Merge PDF').count() >= 1)
    pg.screenshot(path='/downloads/ov-d.png')
    pg.get_by_role('button', name='Revenue').first.click(); pg.wait_for_timeout(800); check('KPI opens Payments', pg.get_by_text('Export CSV').count() >= 1 and pg.get_by_label('Search orders').count() == 1)
    pg.get_by_role('tab', name='Overview', exact=True).click(); pg.wait_for_timeout(500)
    pg.locator('section[aria-label="Needs attention"] button', has_text='Users').first.click(); pg.wait_for_timeout(800); check('alert button opens Users tab', pg.get_by_role('tab', name='Users', exact=True).get_attribute('aria-selected') == 'true')
    check('no overflow', pg.evaluate('document.documentElement.scrollWidth') <= 1280); check('no JS errors', not errs, errs)
    f('/admin/orders/seed', {}, 'DELETE'); f('/admin/audit/seed', {}, 'DELETE'); f('/admin/usage/seed', {}, 'DELETE')
    f('/auth/delete', {'password': PW}); b.close()
print('ALL PASS' if ok else 'FAILED: ' + ', '.join(fails)); sys.exit(0 if ok else 1)
