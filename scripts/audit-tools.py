# Phase 0 audit: open every tool page in EN+AR, desktop+mobile. LOCAL worker.
import re, json, sys
from playwright.sync_api import sync_playwright
B='http://localhost:8787'
ids=re.findall(r"/tools/([a-z0-9-]+)", open('/tmp/ids.txt').read()); ids=sorted(set(ids))
rows=[]
with sync_playwright() as pw:
    b=pw.chromium.launch()
    for lang in ['en','ar']:
        for w in ([390] if len(sys.argv)>1 and sys.argv[1]=='mobile' else [1280,390]):
            c=b.new_context(viewport={'width':w,'height':800}); c.add_init_script(f"localStorage.setItem('mc_consent','essential')")
            for i in ids:
                p=c.new_page(); errs=[]; p.on('pageerror',lambda e:errs.append(str(e)[:80]))
                try:
                    p.goto(f"{B}{'/ar' if lang=='ar' else ''}/tools/{i}",wait_until='domcontentloaded'); p.wait_for_timeout(350)
                    ov=p.evaluate("document.documentElement.scrollWidth")>w+1 or p.evaluate("(w=>{const ok=e=>{for(let a=e.parentElement;a;a=a.parentElement){const o=getComputedStyle(a).overflowX;if(o==='auto'||o==='scroll'||o==='hidden'||o==='clip')return true}return false};return [...document.querySelectorAll('main *, #root *')].some(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left<-2||r.right>w+2)&&getComputedStyle(e).position!=='fixed'&&!ok(e)})})(%d)"%w)
                    latin=p.evaluate("[...document.querySelectorAll('h1,h2,label,button')].filter(e=>/[A-Za-z]{4,}/.test(e.innerText)&&!/PDF|JSON|CSV|HTML|URL|Base64|SEO|QR|EXIF|JWT|UUID|OCR|XML|YAML|Excel|Word|PowerPoint|Magic Convertor|Markdown|SQL/i.test(e.innerText)).length") if lang=='ar' else 0
                    h1=p.locator('h1').count()
                    rows.append(dict(id=i,lang=lang,w=w,overflow=ov,errs=errs,latin=latin,h1=h1))
                except Exception as e: rows.append(dict(id=i,lang=lang,w=w,fail=str(e)[:60]))
                p.close()
            c.close()
json.dump(rows,open('/tmp/audit.json','w'))
bad=[r for r in rows if r.get('fail') or r.get('overflow') or r.get('errs') or r.get('latin',0)>3 or r.get('h1')!=1]
print(len(rows),'checks',len(bad),'flagged')
for r in bad[:40]: print(r)
