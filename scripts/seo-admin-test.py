# Admin Ads and SEO check, LOCAL worker only.
import json, sys, random
from playwright.sync_api import sync_playwright
B = 'http://localhost:8787'; ok = True; fails = []
def check(n, c, extra=''):
    global ok; ok &= bool(c); print('PASS' if c else 'FAIL', n, '' if c else extra)
    if not c: fails.append(n)
tag = random.randint(10000, 99999); PW = 'correct horse 1'; H = {'content-type': 'application/json'}
with sync_playwright() as pw:
    b = pw.chromium.launch(); c = b.new_context(viewport={'width': 1280, 'height': 900}); c.add_init_script("localStorage.setItem('mc_consent','essential')")
    f = lambda p, d, m='POST': c.request.fetch(B + '/api' + p, method=m, data=json.dumps(d), headers=H)
    f('/auth/signup', {'email': f'sadm{tag}@example.com', 'password': PW, 'name': 'A'}); check('claim', f('/admin/claim', {'key': 'localkey'}).status == 200)
    pg = c.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.goto(B + '/admin'); pg.wait_for_timeout(1500)
    pg.get_by_role('tab', name='Ads and SEO', exact=True).click(); pg.wait_for_timeout(600)
    check('ads checklist shown', pg.get_by_text('Go-live checklist').count() == 1 and pg.get_by_text('Reduced ads').count() >= 1)
    pg.screenshot(path='/downloads/seo-ads-d.png')
    pg.get_by_role('button', name='SEO', exact=True).click(); pg.wait_for_timeout(2500)
    check('seo audit ran', pg.get_by_text('Crawl files').count() == 1 and pg.get_by_text('sitemap.xml:').count() == 1)
    check('every tool in sitemap', pg.get_by_text('Every tool is in the sitemap in EN and AR').locator('xpath=ancestor::li//*[@aria-label="ok"]').count() == 1)
    check('robots ok', pg.get_by_text('robots.txt keeps admin and API out of search').locator('xpath=ancestor::li//*[@aria-label="ok"]').count() == 1)
    check('descriptions all in range', pg.get_by_text('Descriptions are 30 to 160 characters').locator('xpath=ancestor::li//*[@aria-label="ok"]').count() == 1)
    pg.get_by_role('button', name='Run SEO check').click(); pg.wait_for_timeout(1500); check('rerun works', pg.get_by_text('Crawl files').count() == 1)
    pg.screenshot(path='/downloads/seo-seo-d.png')
    pg.get_by_role('button', name='Integrations').click(); check('integrations shown', pg.get_by_text('Google sign-in').count() == 1)
    check('no overflow', pg.evaluate('document.documentElement.scrollWidth') <= 1280); check('no JS errors', not errs, errs)
    f('/auth/delete', {'immediate': True, 'password': PW}); b.close()
print('ALL PASS' if ok else 'FAILED: ' + ', '.join(fails)); sys.exit(0 if ok else 1)
