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
    p.locator('button.bg-gradient-to-r').first.click()
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
     ('protect-pdf',[F('three.pdf')],{'Password':'pw12345'},lambda o:__import__('pypdf').PdfReader(o[0]).is_encrypted and __import__('pypdf').PdfReader(o[0]).decrypt('pw12345')>0),
     ('unlock-pdf',[F('locked.pdf')],{'Password (if':'secret123'},lambda o:not __import__('pypdf').PdfReader(o[0]).is_encrypted and pages(o[0])==3),
     ('sign-pdf',[F('three.pdf')],{'Your name':'Mahmoud Salah'},lambda o:'Mahmoud Salah' in __import__('pypdf').PdfReader(o[0]).pages[0].extract_text()),
     ('redact-pdf',[F('three.pdf')],{'Words to remove':'page 2'},lambda o:'page 2' not in __import__('pypdf').PdfReader(o[0]).pages[1].extract_text() and pages(o[0])==3),
     ('compare-pdf',[F('five.pdf'),F('three.pdf')],{},lambda o:'five page 4' in open(o[0]).read()),
     ('repair-pdf',[F('broken.pdf')],{},lambda o:pages(o[0])==3),
     ('crop-pdf',[F('three.pdf')],{},lambda o:float(__import__('pypdf').PdfReader(o[0]).pages[0].cropbox.width)==360.0),
     ('pdf-to-markdown',[F('three.pdf')],{},lambda o:'three page 1' in open(o[0]).read()),
     ('pdf-to-excel',[F('three.pdf')],{},lambda o:open(o[0],'rb').read(2)==b'PK'),
     ('pdf-to-powerpoint',[F('three.pdf')],{},lambda o:open(o[0],'rb').read(2)==b'PK'),
     ('excel-to-pdf',[F('stock.xlsx')],{},lambda o:'Apple' in __import__('pypdf').PdfReader(o[0]).pages[0].extract_text()),
     ('powerpoint-to-pdf',[F('deck.pptx')],{},lambda o:pages(o[0])==2 and 'Launch Plan' in __import__('pypdf').PdfReader(o[0]).pages[0].extract_text()),
     ('image-background',[F('logo.png')],{'Mode':'remove'},lambda o:(lambda im:im.mode=='RGBA' and im.getpixel((2,2))[3]==0 and im.getpixel((60,60))[3]==255)(__import__('PIL.Image',fromlist=['x']).open(o[0]))),
     ('image-background',[F('logo.png')],{'Mode':'color','Output':'png'},lambda o:(lambda im:im.convert('RGBA').getpixel((60,60))[:3]==(220,30,30))(__import__('PIL.Image',fromlist=['x']).open(o[0]))),
     ('ocr-image',[F('ocr.png')],{},lambda o:'Invoice' in open(o[0]).read()),
     ('ocr-pdf',[F('three.pdf')],{},lambda o:any(x.endswith('.txt') and 'three' in open(x).read() for x in o) and any(x.endswith('.pdf') for x in o)),
     ('edit-pdf',[F('three.pdf')],{'Text (new':'HELLO EDIT','Shape at':'fill'},lambda o:'HELLO EDIT' in __import__('pypdf').PdfReader(o[0]).pages[0].extract_text() and 'HELLO EDIT' in __import__('pypdf').PdfReader(o[0]).pages[2].extract_text()),
     ('html-to-pdf',[F('page.html')],{},lambda o:pages(o[0])>=1 and __import__('PIL.Image',fromlist=['x']) is not None),
     ('html-to-pdf',[F('page.html')],{'Output':'text'},lambda o:'Hello HTML' in __import__('pypdf').PdfReader(o[0]).pages[0].extract_text()),
     ('add-form-fields',[F('three.pdf')],{'Field names':'Name, Email'},lambda o:len(__import__('pypdf').PdfReader(o[0]).get_fields() or {})==2),
     ('fill-pdf-form',[F('form.pdf')],{'Values':'Name=Mahmoud;Email=a@b.co'},lambda o:(__import__('pypdf').PdfReader(o[0]).get_fields()['Name'].get('/V')=='Mahmoud')),
     ('text-to-pdf',[F('arabic.txt')],{},lambda o:pages(o[0])>=1 and __import__('subprocess').run(['pdfimages','-list',o[0]],capture_output=True,text=True).stdout.count('image')>=1),
     ('scan-to-pdf',[F('logo.png'),F('grad.png')],{},lambda o:pages(o[0])==2),
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
