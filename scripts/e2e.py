import subprocess, sys, os, time, json
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv)>1 else 'http://localhost:4173'
os.makedirs('/tmp/out', exist_ok=True)
F=lambda n: os.path.abspath('fixtures/'+n)
results=[]
def tool(p, tid, files, opts=None, label=None):
    p.goto(f'{BASE}/tools/{tid}'); p.set_input_files('input[type=file]', files)
    for k,v in (opts or {}).items():
        el = p.locator('label').filter(has=p.locator('span', has_text=k)).first.locator('select, input')
        if el.evaluate('e=>e.tagName')=='SELECT': el.select_option(v)
        else: el.fill(str(v))
    p.locator('button.bg-gradient-to-r').click()
    p.wait_for_selector('h2:has-text("Done"), p.text-red-300', timeout=25000)
    if p.locator('p.text-red-300').count(): return None, p.locator('p.text-red-300').inner_text()
    outs=[]
    for i in range(p.locator('button.bg-emerald-500\\/30').count()):
        with p.expect_download() as d: p.locator('button.bg-emerald-500\\/30').nth(i).click()
        path=f'/tmp/out/{tid}-{i}-{d.value.suggested_filename}'; d.value.save_as(path); outs.append(path)
    return outs, None
def pages(path):
    from pypdf import PdfReader; return len(PdfReader(path).pages)
with sync_playwright() as pw:
    b=pw.chromium.launch(); p=b.new_page()
    p.on('pageerror', lambda e: print('PAGEERR', e))
    cases=[
     ('merge-pdf',[F('five.pdf'),F('three.pdf')],{},lambda o:pages(o[0])==8),
     ('split-pdf',[F('five.pdf')],{'Split mode':'each'},lambda o:len(o)==5 and all(pages(x)==1 for x in o)),
     ('split-pdf',[F('five.pdf')],{'Split mode':'ranges','Ranges, one':'1-2,3-5'},lambda o:[pages(x) for x in o]==[2,3]),
     ('remove-pages',[F('five.pdf')],{'Pages to remove':'2,4'},lambda o:pages(o[0])==3),
     ('extract-pages',[F('five.pdf')],{'Pages to keep':'1-2'},lambda o:pages(o[0])==2),
     ('reorder-pdf',[F('five.pdf')],{},lambda o:pages(o[0])==5),
     ('rotate-pdf',[F('five.pdf')],{},lambda o:pages(o[0])==5),
     ('page-numbers',[F('five.pdf')],{},lambda o:'Page 3 of 5' in __import__('pypdf').PdfReader(o[0]).pages[2].extract_text()),
     ('watermark-pdf',[F('five.pdf')],{},lambda o:'CONFIDENTIAL' in __import__('pypdf').PdfReader(o[0]).pages[0].extract_text()),
     ('pdf-metadata',[F('five.pdf')],{'Title':'Hello'},lambda o:__import__('pypdf').PdfReader(o[0]).metadata.title=='Hello'),
     ('compress-pdf',[F('five.pdf')],{},lambda o:os.path.getsize(o[0])>0),
     ('images-to-pdf',[F('grad.png'),F('grad.png')],{},lambda o:pages(o[0])==2),
     ('pdf-to-images',[F('three.pdf')],{'Format':'png'},lambda o:len(o)==3 and open(o[0],'rb').read(4)==b'\x89PNG'),
     ('pdf-to-text',[F('three.pdf')],{},lambda o:'three page 2' in open(o[0]).read()),
     ('convert-image',[F('grad.png')],{'Convert to':'jpg'},lambda o:open(o[0],'rb').read(2)==b'\xff\xd8'),
     ('convert-image',[F('grad.png')],{'Convert to':'bmp'},lambda o:open(o[0],'rb').read(2)==b'BM'),
     ('convert-image',[F('grad.png')],{'Convert to':'webp'},lambda o:open(o[0],'rb').read(4)==b'RIFF'),
     ('resize-image',[F('grad.png')],{'Mode':'percent','Percent':'50'},lambda o:o[0].endswith('32x32.png')),
     ('text-to-pdf',[F('note.txt')],{},lambda o:'Line two' in __import__('pypdf').PdfReader(o[0]).pages[0].extract_text()),
     ('word-to-pdf',[F('sample.docx')],{},lambda o:'Quarterly Report' in __import__('pypdf').PdfReader(o[0]).pages[0].extract_text()),
     ('word-to-text',[F('sample.docx')],{},lambda o:'Second paragraph' in open(o[0]).read()),
     ('word-to-html',[F('sample.docx')],{},lambda o:'<h1>' in open(o[0]).read()),
     ('pdf-to-word',[F('three.pdf')],{},lambda o:open(o[0],'rb').read(2)==b'PK'),
     ('compress-image',[F('grad.png')],{},lambda o:len(o)==1),
    ]
    for tid,files,opts,chk in cases:
        try:
            o,e=tool(p,tid,files,opts); ok = (o is not None) and bool(chk(o))
            print(('PASS' if ok else 'FAIL'),tid,opts,e or '')
        except Exception as ex: print('FAIL',tid,opts,str(ex)[:150])
    p.goto(BASE); p.set_viewport_size({'width':1280,'height':900}); p.screenshot(path='/tmp/out/home.png')
    p.goto(BASE+'/tools/merge-pdf'); p.set_input_files('input[type=file]',[F('five.pdf'),F('three.pdf')]); p.wait_for_timeout(300); p.screenshot(path='/tmp/out/merge.png')
    b.close()
