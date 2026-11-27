# Visual panels for contrast, gradient, shades. LOCAL worker.
import sys
from playwright.sync_api import sync_playwright
B='http://localhost:8787'; ok=True
def chk(n,c):
    global ok; ok&=bool(c); print('PASS' if c else 'FAIL',n)
with sync_playwright() as pw:
    b=pw.chromium.launch(); c=b.new_context(viewport={'width':1280,'height':900}); c.grant_permissions(['clipboard-read','clipboard-write'],origin=B)
    c.add_init_script("localStorage.setItem('mc_consent','essential')"); p=c.new_page(); errs=[]; p.on('pageerror',lambda e:errs.append(str(e)))
    p.goto(B+'/tools/contrast-checker'); p.wait_for_timeout(700)
    chk('contrast ratio shown', p.locator('text=/\\d+\\.\\d+:1/').count()>=1)
    before=p.locator('p.text-4xl').inner_text(); p.get_by_role('button',name='Swap colors').click(); p.wait_for_timeout(200)
    chk('swap keeps ratio', p.locator('p.text-4xl').inner_text()==before)
    p.locator('input[type=color]').first.evaluate("e=>{const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(e,'#ffffff');e.dispatchEvent(new Event('input',{bubbles:true}))}"); p.wait_for_timeout(200)
    p.screenshot(path='/downloads/dv-d-contrast.png')
    p.goto(B+'/tools/gradient-generator'); p.wait_for_timeout(600); p.get_by_role('button',name='Try an example').click(); p.wait_for_timeout(400)
    chk('gradient preview', p.get_by_role('img',name='Gradient preview').count()==1)
    p.goto(B+'/tools/color-shades'); p.wait_for_timeout(600); p.get_by_role('button',name='Try an example').click(); p.wait_for_timeout(400)
    chk('11 swatches', p.locator('[role=list] button').count()==11)
    p.locator('[role=list] button').first.click(); chk('copy hex', p.evaluate('navigator.clipboard.readText()').startswith('#'))
    p.screenshot(path='/downloads/dv-d-shades.png')
    chk('no js errors', not errs)
    c2=b.new_context(viewport={'width':390,'height':800}); c2.add_init_script("localStorage.setItem('mc_consent','essential');localStorage.setItem('mc_lang','ar');localStorage.setItem('mc_theme','dark')")
    q=c2.new_page(); q.goto(B+'/ar/tools/contrast-checker'); q.wait_for_timeout(900); q.evaluate("window.scrollTo(0,420)"); q.wait_for_timeout(200)
    chk('AR no overflow', q.evaluate('document.documentElement.scrollWidth')<=391); q.screenshot(path='/downloads/dv-m-ar-contrast.png')
    q.goto(B+'/ar/tools/gradient-generator'); q.wait_for_timeout(700); q.get_by_role('button',name='جرّب مثال').click(); q.wait_for_timeout(300); q.evaluate("window.scrollTo(0,500)"); q.screenshot(path='/downloads/dv-m-ar-grad.png')
print('ALL PASS' if ok else 'FAILED'); sys.exit(0 if ok else 1)
