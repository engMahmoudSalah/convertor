# Crop preview overlay. LOCAL worker.
import sys
from playwright.sync_api import sync_playwright
B='http://localhost:8787'; ok=True
def chk(n,c):
    global ok; ok&=bool(c); print('PASS' if c else 'FAIL',n)
def frame(p):
    return p.evaluate("(()=>{const i=document.querySelector('img[alt=\"Crop preview\"],img[alt=\"معاينة القص\"]');if(!i)return null;const d=i.nextElementSibling;const r=i.getBoundingClientRect(),f=d.getBoundingClientRect();return {w:f.width/r.width,h:f.height/r.height,ratio:f.width/f.height}})()")
with sync_playwright() as pw:
    b=pw.chromium.launch(); c=b.new_context(viewport={'width':1280,'height':1000}); c.add_init_script("localStorage.setItem('mc_consent','essential')")
    p=c.new_page(); errs=[]; p.on('pageerror',lambda e:errs.append(str(e)))
    p.goto(B+'/tools/crop-image'); p.wait_for_timeout(800); p.set_input_files('input[type=file]','fixtures/grad.png'); p.wait_for_timeout(1500)
    btn=p.get_by_role('button',name='Next'); 
    if btn.count(): btn.first.click(); p.wait_for_timeout(1000)
    f=frame(p); chk('preview shown',f is not None)
    if f: chk('1:1 frame is square',abs(f['ratio']-1)<0.03)
    p.locator('select').first.select_option('16:9'); p.wait_for_timeout(300); f=frame(p); chk('16:9 frame ratio',f and abs(f['ratio']-16/9)<0.05)
    p.screenshot(path='/downloads/cp-d.png')
    p.locator('select').first.select_option('custom'); p.wait_for_timeout(300); f=frame(p); chk('custom frame shown',f is not None)
    chk('no js errors',not errs)
    c2=b.new_context(viewport={'width':390,'height':900}); c2.add_init_script("localStorage.setItem('mc_consent','essential');localStorage.setItem('mc_lang','ar');localStorage.setItem('mc_theme','dark')")
    q=c2.new_page(); q.goto(B+'/ar/tools/crop-image'); q.wait_for_timeout(800); q.set_input_files('input[type=file]','fixtures/grad.png'); q.wait_for_timeout(1500)
    b2=q.locator('button.flow-next'); 
    if b2.count(): b2.first.click(); q.wait_for_timeout(1000)
    chk('AR no overflow',q.evaluate('document.documentElement.scrollWidth')<=391); q.locator('img[alt="معاينة القص"]').scroll_into_view_if_needed(); q.screenshot(path='/downloads/cp-m-ar.png')
print('ALL PASS' if ok else 'FAILED'); sys.exit(0 if ok else 1)
