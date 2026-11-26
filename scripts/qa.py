# Page-level QA: every tool page in EN and AR, desktop and 390px mobile. Run against vite preview.
import json, sys
from playwright.sync_api import sync_playwright
B = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:4173'
tools = json.load(open('src/seo/tools.json')); tools = tools if isinstance(tools, list) else tools['tools']
rows = []
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for lang in [x for x in ('', 'ar/') if __import__('os').environ.get('LANG_ONLY', 'all') in ('all', x or 'en')]:
        for vp, name in (({'width': 1280, 'height': 800}, 'desktop'), ({'width': 390, 'height': 800}, 'mobile')):
            c = b.new_context(viewport=vp); c.add_init_script("localStorage.setItem('mc_consent','essential')"); p = c.new_page(); errs = []
            p.on('pageerror', lambda e: errs.append(str(e)[:80]))
            for t in tools:
                errs.clear(); p.goto(f"{B}/{lang}tools/{t['id']}"); p.wait_for_timeout(350)
                h1 = p.locator('h1').count(); drop = p.locator('input[type=file], textarea, section[aria-live]').count(); ov = p.evaluate('document.documentElement.scrollWidth - window.innerWidth')
                rtl = p.evaluate('document.documentElement.dir') == ('rtl' if lang else 'ltr')
                ok = h1 >= 1 and drop >= 1 and ov <= 1 and rtl and not errs
                rows.append((t['id'], lang or 'en/', name, ok, f'h1={h1} drop={drop} overflow={ov} dir_ok={rtl} errs={errs[:1]}'))
            c.close()
    b.close()
bad = [r for r in rows if not r[3]]
print(len(rows), 'checks,', len(bad), 'failed')
for r in bad: print('FAIL', *r[:3], r[4])
