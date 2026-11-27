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

def tool(p, tid, files, opts=None, label=None):
    p.goto(f'{BASE}/tools/{tid}'); p.set_input_files('input[type=file]', files)
    p.locator('button.flow-next').first.click()
    for k,v in (opts or {}).items():
        el = p.locator('label').filter(has=p.locator('span', has_text=k)).first.locator('select, input:not([type=range])')
        if el.evaluate('e=>e.tagName')=='SELECT': el.select_option(v)
        elif isinstance(v,bool): el.set_checked(v)
        else: el.fill(str(v))
    p.locator('button.bg-gradient-to-r').first.click()
    p.wait_for_selector('.flow-bar button.flow-next:not([disabled]), p.text-red-300', timeout=25000)
    if p.locator('p.text-red-300').count(): return None, p.locator('p.text-red-300').inner_text()
    p.locator('.flow-bar button.flow-next').click(); p.wait_for_selector('h2:has-text("Done")', timeout=5000); pass_gate(p)
    outs=[]
    if p.locator('button[aria-label^="Download "]').count():
        for i in range(p.locator('button[aria-label^="Download "]').count()):
            with p.expect_download() as d: p.locator('button[aria-label^="Download "]').nth(i).click()
            path=f'/tmp/out/{tid}-{i}-{d.value.suggested_filename}'; d.value.save_as(path); outs.append(path)
    else:
        with p.expect_download() as d: p.locator('button.flow-next:has-text("Download")').click()
        path=f'/tmp/out/{tid}-0-{d.value.suggested_filename}'; d.value.save_as(path); outs.append(path)
    return outs, None
from PIL import Image
ok=True
def chk(n,c):
    global ok; ok&=bool(c); print('PASS' if c else 'FAIL',n)
with sync_playwright() as pw:
    b=pw.chromium.launch(); p=b.new_context(); p.add_init_script("localStorage.setItem('mc_consent','essential')"); p=p.new_page()
    p.add_init_script("(()=>{const si=window.setInterval;window.setInterval=(f,t,...a)=>si(f,Math.min(t||0,15),...a)})()")
    for fit,exp in (('Fit inside',None),('Fill and crop',(200,100)),('Pad the edges',(200,100))):
        o,e=tool(p,'resize-image',F('grad.png'),{'Mode':'Pixels','Width px':200,'Height px':100,'When width':fit})
        im=Image.open(o[0]) if o else None
        if exp: chk(fit+' exact box', im and im.size==exp)
        else: chk(fit+' stays inside', im and im.size==(100,100))
        if fit=='Fill and crop' and im: chk('fill has no padding (corner not white)', im.convert('RGB').getpixel((0,0))!=(255,255,255))
        if fit=='Pad the edges' and im: chk('pad edge is blank', im.convert('RGBA').getpixel((0,50))[3]==0 or im.convert('RGB').getpixel((0,50))==(255,255,255))
print('ALL PASS' if ok else 'FAILED')
