"""Failure scenarios per tool on the preview build: corrupt file, wrong type, locked PDF. Expect a clear message or a result, never a crash."""
import sys, os, re, json
from playwright.sync_api import sync_playwright
B = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:4173'; F = os.path.expanduser('~/convertor/fixtures/')
tools = json.load(open('/tmp/tools.json'))
FAST = "(()=>{const si=window.setInterval;window.setInterval=(f,t,...a)=>si(f,Math.min(t||0,15),...a)})()"
res = []
with sync_playwright() as p:
    b = p.chromium.launch()
    for t in tools:
        tid, kind = t['id'], t['kind']
        scen = [('corrupt', F + 'broken.pdf' if kind == 'pdf' else None), ('wrongtype', F + 'note.txt' if kind in ('pdf', 'img') else F + 'logo.png'), ('locked', F + 'locked.pdf' if kind == 'pdf' else None)]
        for name, fp in scen:
            if not fp: continue
            c = b.new_context(); c.add_init_script(FAST); c.add_init_script("localStorage.setItem('mc_consent','essential')"); pg = c.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)[:80]))
            try:
                pg.goto(f'{B}/tools/{tid}'); pg.wait_for_timeout(500); pg.set_input_files('input[type=file]', fp); pg.wait_for_timeout(500)
                state = 'upload'; msg = ''
                if pg.locator('button.flow-next').count():
                    pg.locator('button.flow-next').first.click(); pg.wait_for_timeout(700)
                    run = pg.locator('button.bg-gradient-to-r').first
                    if run.count() and run.is_enabled():
                        run.click(); pg.wait_for_timeout(2500)
                        err = pg.locator('p.text-red-300')
                        done = pg.locator('.flow-bar button.flow-next:not([disabled])').count()
                        state = 'error' if err.count() else ('result' if done else 'hang')
                        msg = err.first.inner_text()[:70] if err.count() else ''
                    else: state = 'norun'
                else:
                    e = pg.locator('p.text-red-300'); state = 'rejected' if e.count() else 'silent'; msg = e.first.inner_text()[:70] if e.count() else ''
                alive = pg.locator('body').inner_text().strip() != ''
                res.append((tid, name, state, msg, errs[:1], alive))
            except Exception as ex: res.append((tid, name, 'EXC', str(ex)[:60], errs[:1], False))
            c.close()
    for r in res: print(r)
