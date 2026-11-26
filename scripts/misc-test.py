import sys
from playwright.sync_api import sync_playwright
B = 'http://localhost:4173'
CASES = [
 ('percentage-calculator', '15 200', {}, '15% of 200 = 30'),
 ('percentage-calculator', '50 75', {'What to find': 'change'}, '50% increase' if False else '50 to 75: 50% increase'),
 ('loan-calculator', '', {}, 'Monthly payment: 2,224.44'),
 ('compound-interest', '', {'Monthly deposit': '0', 'Years': '1', 'Yearly interest rate (%)': '12', 'Starting amount': '1000'}, 'Final balance: 1,126.83'),
 ('discount-calculator', '', {}, 'Final price: 400.00'),
 ('bmi-calculator', '', {}, 'BMI: 22.86'),
 ('stats-calculator', '2 4 4 4 5 5 7 9', {}, 'Std deviation (population): 2'),
 ('gcd-lcm', '12 18', {}, 'GCD: 6\nLCM: 36'),
 ('age-calculator', '', {'Birth date (YYYY-MM-DD)': '2000-02-29', 'As of (empty for today)': '2026-03-01'}, 'Age: 26 years, 0 months, 0 days'),
 ('date-difference', '', {'From (YYYY-MM-DD)': '2026-01-01', 'To (YYYY-MM-DD)': '2026-12-31'}, 'Difference: 364 days'),
 ('date-add', '', {'Start date (YYYY-MM-DD)': '2026-01-31', 'Amount (negative to subtract)': '1', 'Unit': 'months'}, 'Result: 2026-02-28'),
 ('workdays-between', '', {'From (YYYY-MM-DD)': '2026-11-23', 'To (YYYY-MM-DD)': '2026-11-29', 'Weekend': 'fri-sat'}, 'Working days (both ends counted): 5'),
 ('countdown-days', '', {'Target date (YYYY-MM-DD)': '2001-01-01'}, 'days ago'),
 ('timezone-converter', '2026-07-01 12:00', {'From time zone': 'UTC', 'To time zones (comma separated)': 'Asia/Tokyo'}, 'Asia/Tokyo: 2026-07-01 21:00 (UTC+09:00)'),
 ('contrast-checker', '', {'Text color': '#000000', 'Background color': '#ffffff'}, 'Contrast ratio: 21:1'),
 ('gradient-generator', '#ff0000\n#0000ff', {}, 'linear-gradient(135deg, #ff0000, #0000ff)'),
 ('color-shades', '#808080', {}, 'darker'),
 ('px-rem-converter', '24', {}, '24px = 1.5rem'),
 ('password-generator', '', {'Length': '20'}, 'Strength: about'),
 ('password-strength', 'password123', {}, 'common password'),
 ('uuid-generator', '', {'Keep dashes': False, 'How many': '1'}, 'Made' if False else ''),
 ('meta-tag-generator', '', {}, '<meta property="og:title" content="Magic Convertor">'),
 ('robots-txt-generator', '', {}, 'Disallow: /admin'),
 ('sitemap-generator', 'https://e.com/a?x=1&y=2', {}, '<loc>https://e.com/a?x=1&amp;y=2</loc>'),
 ('utm-builder', '', {}, 'utm_source=newsletter'),
 ('keyword-density', 'apple banana apple the the cherry', {}, '2     50%  apple'),
]
bad = 0
with sync_playwright() as pw:
    b = pw.chromium.launch(); c = b.new_context(viewport={'width': 1280, 'height': 900}); c.add_init_script("localStorage.setItem('mc_consent','essential')"); p = c.new_page(); errs = []
    p.on('pageerror', lambda e: errs.append(str(e)[:100]))
    def run(tid, text, opts):
        p.goto(f'{B}/tools/{tid}')
        if p.locator('#tt-in').count(): p.fill('#tt-in', text)
        for k, v in opts.items():
            lab = p.locator('label').filter(has=p.locator('span', has_text=k)).first
            if isinstance(v, bool): lab.locator('input').set_checked(v)
            elif lab.locator('select').count(): lab.locator('select').select_option(v)
            else: lab.locator('input').fill(v)
        p.wait_for_timeout(500)
        return ' '.join(p.locator('section[aria-live] pre').all_inner_texts()) + ' ' + (p.locator('section[aria-live] [role=alert]').inner_text() if p.locator('section[aria-live] [role=alert]').count() else '')
    for tid, text, opts, want in CASES:
        got = run(tid, text, opts); ok = want.replace('\n', ' ') in got.replace('\n', ' ') if want else len(got.strip()) == 32; bad += not ok; print('PASS' if ok else 'FAIL', tid, '' if ok else repr(got[:160]))
    # encrypt then decrypt round trip
    enc = run('text-encrypt', 'héllo ✓', {'Password': 'pw1'}).strip()
    dec = run('text-encrypt', enc, {'Action': 'decrypt', 'Password': 'pw1'}).strip()
    bw = run('text-encrypt', enc, {'Action': 'decrypt', 'Password': 'nope'})
    ok = dec == 'héllo ✓' and 'Wrong password' in bw; bad += not ok; print('PASS' if ok else 'FAIL', 'text-encrypt roundtrip', repr(dec[:40]), repr(bw[:60]))
    print('page errors', errs[:3]); b.close()
print('failed', bad); sys.exit(1 if bad else 0)
