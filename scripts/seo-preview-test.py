# Meta tag generator live preview. LOCAL worker.
import sys
from playwright.sync_api import sync_playwright
B='http://localhost:8787'; ok=True
def chk(n,c):
    global ok; ok&=bool(c); print('PASS' if ok and c else ('PASS' if c else 'FAIL'),n)
with sync_playwright() as pw:
    b=pw.chromium.launch(); c=b.new_context(viewport={'width':1280,'height':1000}); c.add_init_script("localStorage.setItem('mc_consent','essential')")
    p=c.new_page(); errs=[]; p.on('pageerror',lambda e:errs.append(str(e)))
    p.goto(B+'/tools/meta-tag-generator'); p.wait_for_timeout(1200)
    chk('search result card', p.get_by_text('Search result',exact=True).count()==1)
    chk('title shown in card', p.get_by_text('Magic Convertor').count()>=1)
    lab=p.locator('label').filter(has_text='Page title').locator('input').first
    lab.fill('A'*80); p.wait_for_timeout(300)
    chk('long title is cut with ellipsis', p.get_by_text('…').count()>=1 and p.get_by_text('May be cut off').count()>=1)
    lab.fill('Free online PDF tools that run in your browser'); p.wait_for_timeout(300)
    chk('good length shown', p.get_by_text('Good length').count()>=1)
    p.locator('label').filter(has_text='Share image URL').locator('input').first.fill('javascript:alert(1)'); p.wait_for_timeout(200)
    chk('non-https image is not loaded', p.locator('img[src^="javascript"]').count()==0)
    p.locator('label').filter(has_text='Page URL').locator('input').first.fill('https://www.example.com/tools/pdf'); p.wait_for_timeout(200)
    chk('breadcrumb', p.get_by_text('example.com › tools › pdf').count()==1)
    p.screenshot(path='/downloads/seo-d.png')
    chk('no js errors',not errs)
    c2=b.new_context(viewport={'width':390,'height':900}); c2.add_init_script("localStorage.setItem('mc_consent','essential');localStorage.setItem('mc_lang','ar')")
    q=c2.new_page(); q.goto(B+'/ar/tools/meta-tag-generator'); q.wait_for_timeout(1500)
    chk('AR no overflow',q.evaluate('document.documentElement.scrollWidth')<=391)
    q.get_by_text('نتيجة البحث').first.scroll_into_view_if_needed(); q.screenshot(path='/downloads/seo-m-ar.png')
print('ALL PASS' if ok else 'FAILED'); sys.exit(0 if ok else 1)
