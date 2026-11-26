# Section search box check on every section page, EN and AR. LOCAL worker.
import sys, re
from playwright.sync_api import sync_playwright
B = 'http://localhost:8787'; ok = True; fails = []
def check(n, c, extra=''):
    global ok; ok &= bool(c); 
    if not c: print('FAIL', n, extra); fails.append(n)
SECS = ['pdf', 'images', 'text', 'developer', 'calculators', 'datetime', 'design', 'privacy', 'seo', 'documents']
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for lang in ['en', 'ar']:
        c = b.new_context(viewport={'width': 1280, 'height': 900}); c.add_init_script(f"localStorage.setItem('mc_consent','essential');localStorage.setItem('mc_lang','{lang}')")
        for sec in SECS:
            pg = c.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.goto(f'{B}/ar/{sec}' if lang == 'ar' else f'{B}/{sec}'); pg.wait_for_timeout(700)
            box = pg.get_by_role('searchbox'); check(f'{lang}/{sec} box exists', box.count() == 1)
            total = pg.locator('a[href*="/tools/"]').count(); check(f'{lang}/{sec} has tools', total > 0)
            first = pg.locator('a[href*="/tools/"] h3').first.inner_text(); word = re.split(r'\s+', first.strip())[0]
            box.fill(word); pg.wait_for_timeout(200); n = pg.locator('a[href*="/tools/"]').count()
            check(f'{lang}/{sec} filter finds "{word}"', 0 < n <= total and pg.locator('a[href*="/tools/"] h3', has_text=first).count() >= 1, (n, total))
            box.fill('zzqxj'); pg.wait_for_timeout(200); check(f'{lang}/{sec} empty state', pg.locator('a[href*="/tools/"]').count() == 0 and pg.get_by_role('button', name=re.compile('Clear search|مسح البحث')).count() >= 1)
            pg.get_by_role('button', name=re.compile('Clear search|مسح البحث')).first.click(); pg.wait_for_timeout(200); check(f'{lang}/{sec} clear restores', pg.locator('a[href*="/tools/"]').count() == total and box.input_value() == '')
            check(f'{lang}/{sec} no overflow/errors', pg.evaluate('document.documentElement.scrollWidth') <= 1280 and not errs, errs)
            pg.close()
        c.close()
    # Arabic query against Arabic names on the PDF section
    c = b.new_context(viewport={'width': 1280, 'height': 900}); c.add_init_script("localStorage.setItem('mc_consent','essential');localStorage.setItem('mc_lang','ar')")
    pg = c.new_page(); pg.goto(f'{B}/ar/pdf'); pg.wait_for_timeout(700); pg.get_by_role('searchbox').fill('دمج'); pg.wait_for_timeout(200)
    check('AR query "دمج" finds merge', pg.locator('a[href$="/tools/merge-pdf"]').count() == 1)
    pg.get_by_role('searchbox').fill('merge'); pg.wait_for_timeout(200); check('EN query works on AR page', pg.locator('a[href$="/tools/merge-pdf"]').count() == 1)
    pg.get_by_role('searchbox').fill('merge pdf'); pg.keyboard.press('Escape'); pg.wait_for_timeout(200); check('Escape clears', pg.get_by_role('searchbox').input_value() == '')
    b.close()
print('ALL PASS' if ok else 'FAILED: ' + ', '.join(fails)); sys.exit(0 if ok else 1)
