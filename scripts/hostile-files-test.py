import subprocess, sys, os, time, json
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv)>1 else 'http://localhost:8787'
os.makedirs('/tmp/out', exist_ok=True)
F=lambda n: os.path.abspath('fixtures/'+n)
results=[]
def pass_gate(p):
    sel = '[role=region] .flow-next'
    for _ in range(4):
        if p.locator('[role=region][aria-label="Your file is ready"]').count() == 0:
            return
        p.wait_for_function("() => { const x = document.querySelector('[role=region] .flow-next'); return x && !x.disabled }", timeout=9000)
        p.locator(sel).click(); p.wait_for_timeout(150)

import time, subprocess
def restart():
    subprocess.run("pkill -f wrangler; rm -rf /tmp/wstate; cd ~/convertor; (setsid nohup npx wrangler dev --port 8787 --persist-to /tmp/wstate --var ADMIN_SETUP_KEY:localkey --var ALLOW_TEST_SEED:1 >/tmp/wd.log 2>&1 < /dev/null &); sleep 22", shell=True)
H=lambda n:'/tmp/hostile/'+n
def run(p,tid,f):
    p.goto(f'{BASE}/tools/{tid}'); p.set_input_files('input[type=file]', f); p.wait_for_timeout(600)
    nxt=p.locator('button.flow-next').first
    if p.locator('p.text-red-300,[role=alert]').count() and not nxt.count(): return 'error-at-upload'
    if not nxt.count(): return 'rejected'
    try: nxt.click(timeout=4000)
    except Exception: return 'ui-blocked'
    p.wait_for_timeout(500)
    btn=p.locator('button.bg-gradient-to-r').first
    if not btn.count(): return 'no-run-button'
    try: btn.click(timeout=4000)
    except Exception: return 'ui-blocked'
    try: p.wait_for_selector('.flow-bar button.flow-next:not([disabled]), p.text-red-300, :text("used today")', timeout=30000)
    except Exception: return 'HANG'
    if p.locator(':text("used today")').count(): return 'LIMIT'
    return 'error-shown' if p.locator('p.text-red-300').count() else 'output'
PDFT=['merge-pdf','split-pdf','compress-pdf','rotate-pdf','pdf-to-text','pdf-to-images','flatten-pdf','watermark-pdf']
IMGT=['resize-image','compress-image','crop-image','convert-image','rotate-image','filter-image']
cases=[(t,f) for t in (PDFT if not os.environ.get('SKIPMERGE') else PDFT[2:]) for f in ['empty.pdf','random.pdf','trunc.pdf','fake.pdf']]+[(t,f) for t in IMGT for f in ['empty.png','random.png','bomb.png']]+[('svg-to-png','script.svg')]
bad=0; n=0
with sync_playwright() as pw:
    b=pw.chromium.launch(); c=b.new_context(); c.add_init_script("localStorage.setItem('mc_consent','essential')")
    for t,f in cases:
        c.set_extra_http_headers({'cf-connecting-ip': f'10.9.{n//250}.{n%250+1}'}); n+=1
        p=c.new_page(); errs=[]; p.on('pageerror',lambda e:errs.append(str(e)[:80]))
        t0=time.time()
        try: r=run(p,t,H(f))
        except Exception as e: r='EXC '+str(e)[:60]
        if r=='LIMIT':
            restart(); p.close(); p=c.new_page(); errs=[]; p.on('pageerror',lambda e:errs.append(str(e)[:80])); r=run(p,t,H(f))
        pwn=p.evaluate('window.__pwn')
        flag = r=='HANG' or r.startswith('EXC') or errs or pwn
        bad+=bool(flag); print(('BAD ' if flag else 'ok  ')+f'{t:16} {f:12} {r:16} {time.time()-t0:4.1f}s', errs[:1], 'PWN' if pwn else '', flush=True)
        p.close()
print('DONE bad=',bad, flush=True)
