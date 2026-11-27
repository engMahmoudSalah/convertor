# Time zone day strips. LOCAL worker.
import sys
from playwright.sync_api import sync_playwright
B='http://localhost:8787'; ok=True
def chk(n,c):
    global ok; ok&=bool(c); print('PASS' if c else 'FAIL',n)
with sync_playwright() as pw:
    b=pw.chromium.launch(); c=b.new_context(viewport={'width':1280,'height':1000}); c.add_init_script("localStorage.setItem('mc_consent','essential')")
    p=c.new_page(); errs=[]; p.on('pageerror',lambda e:errs.append(str(e)))
    p.goto(B+'/tools/timezone-converter'); p.wait_for_timeout(1200)
    p.locator('textarea').first.fill('2026-11-26 22:30'); p.wait_for_timeout(500)
    strips=p.locator('[role=img][aria-label*="/"], [role=img][aria-label*="UTC"]').count()
    chk('4 strips (source + 3 zones)', strips==4)
    chk('next-day badge for Tokyo', p.get_by_text('+1 day').count()>=1)
    chk('legend shown', p.get_by_text('Office hours (9 to 17)').count()==1)
    p.locator('textarea').first.fill('not a date'); p.wait_for_timeout(400)
    chk('bad input hides strips, shows error', p.locator('[role=img][aria-label*="UTC"]').count()==0 and p.get_by_text('Use the format').count()>=1)
    p.locator('textarea').first.fill('2026-11-26 14:30'); p.wait_for_timeout(400); p.screenshot(path='/downloads/tz-d.png')
    chk('no js errors',not errs)
    c2=b.new_context(viewport={'width':390,'height':900}); c2.add_init_script("localStorage.setItem('mc_consent','essential');localStorage.setItem('mc_lang','ar')")
    q=c2.new_page(); q.goto(B+'/ar/tools/timezone-converter'); q.wait_for_timeout(1500)
    q.locator('textarea').first.fill('2026-11-26 14:30'); q.wait_for_timeout(500)
    ov=q.evaluate("(w=>[...document.querySelectorAll('main *')].some(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left<-2||r.right>w+2)}))(390)")
    chk('AR no overflow either side', not ov)
    q.get_by_text('مكان الوقت من اليوم').first.scroll_into_view_if_needed(); q.screenshot(path='/downloads/tz-m-ar.png')
print('ALL PASS' if ok else 'FAILED'); sys.exit(0 if ok else 1)
