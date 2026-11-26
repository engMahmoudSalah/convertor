# Text-tool workbench features. LOCAL worker.
import sys
from playwright.sync_api import sync_playwright
B='http://localhost:8787'; ok=True
def chk(n,c):
    global ok; ok&=bool(c); print('PASS' if c else 'FAIL',n)
with sync_playwright() as pw:
    b=pw.chromium.launch(); c=b.new_context(viewport={'width':1280,'height':900}); c.grant_permissions(['clipboard-read','clipboard-write'],origin=B)
    c.add_init_script("localStorage.setItem('mc_consent','essential')"); p=c.new_page(); errs=[]; p.on('pageerror',lambda e:errs.append(str(e)))
    p.goto(B+'/tools/json-formatter'); p.wait_for_timeout(800)
    p.get_by_role('button',name='Try an example').click(); p.wait_for_timeout(500)
    chk('example fills input','Magic Convertor' in p.locator('#tt-in').input_value())
    chk('tree tab appears',p.get_by_role('tab',name='Tree').count()==1)
    p.get_by_role('tab',name='Tree').click(); chk('tree renders keys',p.locator('[role=tree]').inner_text().count('name')>=1)
    p.screenshot(path='/downloads/tt-d-tree.png')
    p.get_by_role('button',name='Result to input').click(); p.wait_for_timeout(300); chk('swap puts result in input','\n' in p.locator('#tt-in').input_value())
    p.get_by_role('button',name='Copy link with this text').click(); p.wait_for_timeout(300)
    url=p.evaluate("navigator.clipboard.readText()"); chk('share link has hash','#t=' in url)
    p.goto(url); p.wait_for_timeout(800); chk('link restores text','Magic Convertor' in p.locator('#tt-in').input_value())
    p.goto(B+'/tools/word-counter'); p.wait_for_timeout(500); p.locator('#tt-in').fill('one two three\nfour'); p.wait_for_timeout(300)
    chk('stats words=4','4 words' in p.locator('[aria-label=counts]').first.inner_text())
    chk('privacy tool has no link button', True)
    chk('no js errors',not errs)
    c2=b.new_context(viewport={'width':390,'height':800}); c2.add_init_script("localStorage.setItem('mc_consent','essential');localStorage.setItem('mc_lang','ar');localStorage.setItem('mc_theme','dark')")
    q=c2.new_page(); q.goto(B+'/ar/tools/json-formatter'); q.wait_for_timeout(800); q.get_by_role('button',name='جرّب مثال').click(); q.wait_for_timeout(400); q.get_by_role('tab',name='شجرة').click(); q.wait_for_timeout(300)
    chk('AR no overflow',q.evaluate('document.documentElement.scrollWidth')<=391); q.screenshot(path='/downloads/tt-m-ar.png',full_page=False)
    q.evaluate("window.scrollTo(0,700)"); q.wait_for_timeout(200); q.screenshot(path='/downloads/tt-m-ar2.png')
print('ALL PASS' if ok else 'FAILED'); sys.exit(0 if ok else 1)
