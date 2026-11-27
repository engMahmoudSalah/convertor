# Resize presets. LOCAL worker.
import sys
from playwright.sync_api import sync_playwright
B='http://localhost:8787'; ok=True
def chk(n,c):
    global ok; ok&=bool(c); print('PASS' if c else 'FAIL',n)
with sync_playwright() as pw:
    b=pw.chromium.launch(); c=b.new_context(viewport={'width':1280,'height':1000}); c.add_init_script("localStorage.setItem('mc_consent','essential')")
    p=c.new_page(); errs=[]; p.on('pageerror',lambda e:errs.append(str(e)))
    p.goto(B+'/tools/resize-image'); p.wait_for_timeout(800); p.set_input_files('input[type=file]','fixtures/grad.png'); p.wait_for_timeout(1500)
    btn=p.locator('button.flow-next'); 
    if btn.count() and btn.first.inner_text().strip().startswith('Next'): btn.first.click(); p.wait_for_timeout(1000)
    chk('presets shown', p.get_by_text('Size presets').count()==1)
    p.get_by_role('button',name='YouTube thumbnail').click(); p.wait_for_timeout(300)
    chk('chip pressed', p.get_by_role('button',name='YouTube thumbnail').get_attribute('aria-pressed')=='true')
    vals=p.evaluate("[...document.querySelectorAll('input[type=number]')].map(i=>i.value)"); chk('width/height set', '1280' in vals and '720' in vals)
    p.get_by_role('button',name='Avatar').click(); p.wait_for_timeout(200)
    vals=p.evaluate("[...document.querySelectorAll('input[type=number]')].map(i=>i.value)"); chk('switch preset', '400' in vals)
    p.screenshot(path='/downloads/rp-d.png', full_page=False)
    chk('no js errors',not errs)
    c2=b.new_context(viewport={'width':390,'height':900}); c2.add_init_script("localStorage.setItem('mc_consent','essential');localStorage.setItem('mc_lang','ar')")
    q=c2.new_page(); q.goto(B+'/ar/tools/resize-image'); q.wait_for_timeout(800); q.set_input_files('input[type=file]','fixtures/grad.png'); q.wait_for_timeout(1500)
    b2=q.locator('button.flow-next')
    if b2.count(): b2.first.click(); q.wait_for_timeout(1000)
    chk('AR no overflow',q.evaluate('document.documentElement.scrollWidth')<=391); q.get_by_text('أحجام جاهزة').scroll_into_view_if_needed(); q.screenshot(path='/downloads/rp-m-ar.png')
    chk('AR has no english preset text', q.get_by_text('Instagram').count()==0)
print('ALL PASS' if ok else 'FAILED'); sys.exit(0 if ok else 1)
