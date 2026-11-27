# Date tool pictures. LOCAL worker.
import sys
from playwright.sync_api import sync_playwright
B='http://localhost:8787'; ok=True
def chk(n,c):
    global ok; ok&=bool(c); print('PASS' if c else 'FAIL',n)
def fld(p,l): return p.locator('label').filter(has_text=l).locator('input').first
with sync_playwright() as pw:
    b=pw.chromium.launch(); c=b.new_context(viewport={'width':1280,'height':1000}); c.add_init_script("localStorage.setItem('mc_consent','essential')")
    p=c.new_page(); errs=[]; p.on('pageerror',lambda e:errs.append(str(e)))
    p.goto(B+'/tools/age-calculator'); p.wait_for_timeout(1200)
    fld(p,'Birth date').fill('2000-01-15'); fld(p,'As of').fill('2026-11-26'); p.wait_for_timeout(500)
    chk('age ring shows 50 days', p.locator('svg[role=img]').first.get_attribute('aria-label').startswith('50 '))
    chk('age years 26', p.get_by_text('26',exact=False).count()>=1)
    p.screenshot(path='/downloads/dv2-age.png')
    p.goto(B+'/tools/countdown-days'); p.wait_for_timeout(1200); fld(p,'Target date').fill('2099-01-01'); p.wait_for_timeout(500)
    chk('countdown capped at 364 dots', p.locator('[role=img] > span').count()==364)
    fld(p,'Target date').fill('2020-01-01'); p.wait_for_timeout(400)
    chk('past date has no dots', p.locator('[role=img] > span').count()==0)
    p.goto(B+'/tools/date-difference'); p.wait_for_timeout(1200)
    fld(p,'From').first.fill('2026-11-02'); fld(p,'To').first.fill('2026-11-15'); p.wait_for_timeout(500)
    lab=p.locator('[role=img][aria-label*="weekdays"]').first.get_attribute('aria-label'); chk('2 weeks: 10 weekdays, 4 weekend days (both ends)', lab.startswith('10 ') and '4 ' in lab)
    p.screenshot(path='/downloads/dv2-diff.png')
    chk('no js errors',not errs)
    c2=b.new_context(viewport={'width':390,'height':900}); c2.add_init_script("localStorage.setItem('mc_consent','essential');localStorage.setItem('mc_lang','ar')")
    q=c2.new_page(); q.goto(B+'/ar/tools/age-calculator'); q.wait_for_timeout(1500)
    ov=q.evaluate("(w=>[...document.querySelectorAll('main *')].some(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left<-2||r.right>w+2)}))(390)")
    chk('AR no overflow either side', not ov); q.locator('input').nth(1).fill('2026-11-26'); q.wait_for_timeout(500); chk('AR age ring also shown', q.locator('svg[role=img]').count()==1 and q.locator('svg[role=img]').first.get_attribute('aria-label').startswith('50 ')); q.screenshot(path='/downloads/dv2-age-ar.png', full_page=True)
print('ALL PASS' if ok else 'FAILED'); sys.exit(0 if ok else 1)
