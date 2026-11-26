"""Saved-file 'Edit again' across tools: does each card reopen the tool on the work board (or explain why not)?"""
import sys, time, os
from playwright.sync_api import sync_playwright
B = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8799'; F = os.path.expanduser('~/convertor/fixtures/')
EM = f'edit-test-{int(time.time())}@example.test'; PW = 'correct horse 1'
CASES = [('rotate-pdf', ['five.pdf']), ('compress-pdf', ['five.pdf']), ('protect-pdf', ['five.pdf']), ('merge-pdf', ['five.pdf', 'three.pdf']), ('compress-image', ['grad.png']), ('convert-image', ['grad.png']), ('resize-image', ['grad.png']), ('images-to-pdf', ['grad.png']), ('pdf-to-text', ['five.pdf']), ('word-to-pdf', ['sample.docx']), ('split-pdf', ['five.pdf'])]
FAST = "(()=>{const si=window.setInterval;window.setInterval=(f,t,...a)=>si(f,Math.min(t||0,15),...a)})()"
def gate(p):
    for _ in range(4):
        if p.locator('[role=region][aria-label="Your file is ready"]').count() == 0: return
        p.wait_for_function("() => { const x = document.querySelector('[role=region] .flow-next'); return x && !x.disabled }", timeout=9000)
        p.locator('[role=region] .flow-next').click(); p.wait_for_timeout(150)
with sync_playwright() as p:
    b = p.chromium.launch(); c = b.new_context(); c.add_init_script(FAST); pg = c.new_page(); pg.goto(B + '/')
    s = pg.evaluate("(a)=>fetch('/api/auth/signup',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:a[0],password:a[1],name:'Edit Test'})}).then(r=>r.status)", [EM, PW]); print('signup', s)
    done = []
    for tid, fs in CASES:
        try:
            pg.goto(f'{B}/tools/{tid}'); pg.wait_for_timeout(900); pg.set_input_files('input[type=file]', [F + f for f in fs])
            pg.locator('button.flow-next').first.click(); pg.wait_for_timeout(1000)
            pg.locator('button.bg-gradient-to-r').first.click(); pg.wait_for_selector('.flow-bar button.flow-next:not([disabled])', timeout=40000)
            pg.locator('.flow-bar button.flow-next').click(); pg.wait_for_selector('h2:has-text("Done")'); gate(pg)
            pg.get_by_role('button', name='Save to my profile').click(); pg.wait_for_selector('text=Saved. Find it in', timeout=20000); done.append(tid)
        except Exception as e: print('SETUP FAIL', tid, str(e)[:80])
    for tid in done:
        pg.goto(B + '/account?tab=saved'); pg.wait_for_selector('li.flow-panel'); pg.wait_for_timeout(800)
        card = pg.locator('li.flow-panel').filter(has=pg.locator('h3')).all()
        # find the card by tool title via href-less match: use the tool registry title
        title = pg.evaluate("(id)=>id", tid)
        import re
        names = {'rotate-pdf':'Rotate PDF','compress-pdf':'Compress PDF','protect-pdf':'Protect PDF','merge-pdf':'Merge PDF','compress-image':'Compress image','convert-image':'Convert image','resize-image':'Resize image','images-to-pdf':'Images to PDF','pdf-to-text':'PDF to text','word-to-pdf':'Word to PDF','split-pdf':'Split PDF'}
        cd = pg.locator('li.flow-panel').filter(has=pg.get_by_role('heading', name=names[tid], exact=True)).first
        if cd.count() == 0: print('NO CARD', tid); continue
        cd.get_by_role('button', name='Edit again').click(); pg.wait_for_url(f'**/tools/{tid}'); pg.wait_for_timeout(1200)
        board = pg.locator('.flow-bar').count() > 0; note = pg.locator('[data-restored]').count() > 0
        print(('BOARD ' if board else 'UPLOAD ') + tid + (' +note' if note else ''))
    pg.goto(B + '/account?tab=saved'); pg.get_by_role('tab', name='Security').click(); pg.locator('input[type=password]').last.fill(PW); pg.get_by_role('button', name='Delete my account').last.click(); pg.wait_for_timeout(2000)
    print('purged login status', pg.evaluate("(a)=>fetch('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:a[0],password:a[1]})}).then(r=>r.status)", [EM, PW]))
