# Loan and compound charts. LOCAL worker.
import sys
from playwright.sync_api import sync_playwright
B='http://localhost:8787'; ok=True
def chk(n,c):
    global ok; ok&=bool(c); print('PASS' if c else 'FAIL',n)
with sync_playwright() as pw:
    b=pw.chromium.launch(); c=b.new_context(viewport={'width':1280,'height':900}); c.add_init_script("localStorage.setItem('mc_consent','essential')")
    p=c.new_page(); errs=[]; p.on('pageerror',lambda e:errs.append(str(e)))
    for tid,bars in [('loan-calculator',5),('compound-interest',10)]:
        p.goto(f'{B}/tools/{tid}'); p.wait_for_timeout(900)
        chk(tid+' bars', p.locator('svg[role=img] g').count()==bars)
        chk(tid+' table rows', p.locator('table tbody tr').count()==bars)
        p.screenshot(path=f'/downloads/cc-d-{tid}.png')
    # invalid input: no chart, no crash
    p.goto(B+'/tools/loan-calculator'); p.wait_for_timeout(600); p.locator('input[type=number]').nth(2).fill('0'); p.wait_for_timeout(400)
    chk('zero term: no chart', p.locator('svg[role=img]').count()==0)
    chk('no js errors', not errs)
    c2=b.new_context(viewport={'width':390,'height':800}); c2.add_init_script("localStorage.setItem('mc_consent','essential');localStorage.setItem('mc_lang','ar');localStorage.setItem('mc_theme','dark')")
    q=c2.new_page(); q.goto(B+'/ar/tools/compound-interest'); q.wait_for_timeout(900); chk('AR no overflow', q.evaluate('document.documentElement.scrollWidth')<=391)
    q.evaluate("document.querySelector('svg[role=img]').scrollIntoView()"); q.wait_for_timeout(200); q.screenshot(path='/downloads/cc-m-ar.png')
print('ALL PASS' if ok else 'FAILED'); sys.exit(0 if ok else 1)
