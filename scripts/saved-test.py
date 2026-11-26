"""Live test: save operation flow (logged out prompt, logged in persistence, download/open/edit/delete) then purge the test account."""
import sys, time, os
from playwright.sync_api import sync_playwright
B = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:4173'; F = os.path.expanduser('~/convertor/fixtures/')
EM = f'saved-test-{int(time.time())}@example.test'; PW = 'correct horse 1'; ok = True
def check(n, c):
    global ok; print(('PASS ' if c else 'FAIL ') + n); ok = ok and bool(c)
def gate(p):
    sel = '[role=region] .flow-next'
    for _ in range(4):
        if p.locator('[role=region][aria-label="Your file is ready"]').count() == 0:
            return
        p.wait_for_function("() => { const x = document.querySelector('[role=region] .flow-next'); return x && !x.disabled }", timeout=9000)
        p.locator(sel).click(); p.wait_for_timeout(150)

def flow(pg, tid, files, seg=None):
    pg.goto(f'{B}/tools/{tid}'); pg.wait_for_timeout(1000); pg.set_input_files('input[type=file]', files)
    pg.locator('button.flow-next').first.click(); pg.wait_for_timeout(1200)
    if seg is not None: pg.locator('.seg button').nth(seg).click()
    pg.locator('button.bg-gradient-to-r').first.click(); pg.wait_for_selector('.flow-bar button.flow-next:not([disabled])', timeout=30000)
    pg.locator('.flow-bar button.flow-next').click(); pg.wait_for_selector('h2:has-text("Done")'); gate(pg)
with sync_playwright() as p:
    b = p.chromium.launch()
    c0 = b.new_context(); c0.add_init_script("(()=>{const si=window.setInterval;window.setInterval=(f,t,...a)=>si(f,Math.min(t||0,15),...a)})()"); g = c0.new_page(); flow(g, 'compress-pdf', [F + 'five.pdf'])
    g.get_by_role('button', name='Save to my profile').click(); g.wait_for_selector('text=Sign in to keep this operation')
    check('logged-out prompt shown', g.locator('a[href="/login"]').count() > 0 and g.locator('a[href="/signup"]').count() > 0)
    pend = g.evaluate("localStorage.getItem('mc_pending_save')"); check('pending state kept on device', bool(pend) and 'compress-pdf' in pend); c0.close()
    c = b.new_context(accept_downloads=True); c.add_init_script("(()=>{const si=window.setInterval;window.setInterval=(f,t,...a)=>si(f,Math.min(t||0,15),...a)})()"); pg = c.new_page(); pg.goto(B + '/')
    s = pg.evaluate("(a)=>fetch('/api/auth/signup',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:a[0],password:a[1],name:'Saved Test'})}).then(r=>r.status)", [EM, PW]); check('signup', s == 200)
    pg.evaluate("(p)=>localStorage.setItem('mc_pending_save',p)", pend)
    flow(pg, 'merge-pdf', [F + 'five.pdf', F + 'three.pdf']); pg.get_by_role('button', name='Save to my profile').click(); pg.wait_for_selector('text=Saved. Find it in', timeout=20000)
    flow(pg, 'compress-image', [F + 'grad.png'], 0); pg.get_by_role('button', name='Save to my profile').click(); pg.wait_for_selector('text=Saved. Find it in', timeout=20000)
    pg.goto(B + '/account?tab=saved'); pg.wait_for_selector('li.flow-panel'); pg.wait_for_timeout(1500)
    cards = pg.locator('li.flow-panel'); check('3 cards (2 saved + 1 pending carried over after login)', cards.count() == 3)
    txt = pg.locator('li.flow-panel', has_text='Compress image').inner_text(); check('card has names/sizes/options/date', all(k in txt for k in ['grad.png', 'grad-small.jpg', 'Completed', 'JPG', 'Result stored']))
    with pg.expect_download() as d: pg.locator('li.flow-panel', has_text='Compress image').get_by_role('button', name='Download').click()
    check('download returns stored file', d.value.suggested_filename == 'grad-small.jpg' and os.path.getsize(d.value.path()) > 100)
    pg.locator('li.flow-panel', has_text='Merge PDF').get_by_role('button', name='Edit again').click(); pg.wait_for_url('**/tools/merge-pdf'); pg.wait_for_selector('.flow-bar'); check('edit again lands on Work board with stored result', 'merged.pdf' in pg.locator('#root').first.inner_text())
    check('no Open button on cards', pg.get_by_role('button', name='Open').count() == 0)
    pg.goto(B + '/account?tab=saved'); pg.wait_for_selector('li.flow-panel'); n0 = pg.locator('li.flow-panel').count()
    pg.locator('li.flow-panel').first.get_by_role('button', name='Delete').click(); pg.locator('li.flow-panel').first.get_by_role('button', name='Confirm delete').click(); pg.wait_for_timeout(1500)
    check('delete removes card', pg.locator('li.flow-panel').count() == n0 - 1)
    pg.get_by_role('tab', name='Security').click(); pg.locator('input[type=password]').last.fill(PW); pg.get_by_role('button', name='Delete my account').last.click(); pg.wait_for_timeout(2000)
    r = pg.evaluate("(a)=>fetch('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:a[0],password:a[1]})}).then(r=>r.status)", [EM, PW]); check('test account purged (login now fails)', r == 401)
print('ALL OK' if ok else 'SOME FAILED'); sys.exit(0 if ok else 1)
