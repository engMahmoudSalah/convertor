# UTM helper. LOCAL worker.
import sys
from playwright.sync_api import sync_playwright
B='http://localhost:8787'; ok=True
def chk(n,c):
    global ok; ok&=bool(c); print('PASS' if c else 'FAIL',n)
def fld(p,l): return p.locator('label').filter(has_text=l).locator('input').first
with sync_playwright() as pw:
    b=pw.chromium.launch(); c=b.new_context(viewport={'width':1280,'height':1000}); c.add_init_script("localStorage.setItem('mc_consent','essential')")
    p=c.new_page(); errs=[]; p.on('pageerror',lambda e:errs.append(str(e)))
    p.goto(B+'/tools/utm-builder'); p.wait_for_timeout(1200)
    chk('default looks good', p.get_by_text('This link looks good.').count()==1)
    p.get_by_role('button',name='google',exact=True).click(); p.wait_for_timeout(300)
    chk('source chip fills field', fld(p,'Source').input_value()=='google')
    chk('output uses it', p.get_by_text('utm_source=google').count()>=1)
    fld(p,'Campaign').fill('Spring Sale'); p.wait_for_timeout(300)
    chk('capital warning', p.get_by_text('Campaign has capital letters').count()==1)
    chk('space warning', p.get_by_text('Campaign has spaces').count()==1)
    fld(p,'Website URL').fill('example.com'); p.wait_for_timeout(300)
    chk('bad url warning', p.get_by_text('Enter a full link').count()==1)
    fld(p,'Website URL').fill('http://example.com/?utm_source=old'); p.wait_for_timeout(300)
    chk('http + existing utm warning', p.get_by_text('uses http').count()==1 and p.get_by_text('already has utm_').count()==1)
    fld(p,'Campaign').fill('spring_sale'); fld(p,'Website URL').fill('https://example.com/'); p.wait_for_timeout(300)
    p.screenshot(path='/downloads/utm-d.png')
    chk('no js errors',not errs)
    c2=b.new_context(viewport={'width':390,'height':900}); c2.add_init_script("localStorage.setItem('mc_consent','essential');localStorage.setItem('mc_lang','ar')")
    q=c2.new_page(); q.goto(B+'/ar/tools/utm-builder'); q.wait_for_timeout(1500)
    chk('AR no overflow',q.evaluate('document.documentElement.scrollWidth')<=391)
    q.get_by_text('مصادر شائعة').first.scroll_into_view_if_needed(); q.screenshot(path='/downloads/utm-m-ar.png')
print('ALL PASS' if ok else 'FAILED'); sys.exit(0 if ok else 1)
