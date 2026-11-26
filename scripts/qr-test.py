# QR tool: generate in the page, download PNG after the ad gate, decode it with OpenCV.
import sys, re, cv2
from playwright.sync_api import sync_playwright
B = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:4173'
URL = 'https://magic-convertor.mahmodsalah.workers.dev/ar/?q=مرحبا&x=1'
with sync_playwright() as pw:
    b = pw.chromium.launch(); c = b.new_context(viewport={'width': 1280, 'height': 900}, accept_downloads=True); c.add_init_script("localStorage.setItem('mc_consent','essential')"); p = c.new_page()
    p.goto(B + '/tools/qr-code'); p.fill('#tt-in', URL); p.wait_for_timeout(500)
    p.locator('button', has_text=re.compile(r'^\s*PNG')).click()
    for k in range(2):
        p.wait_for_function("() => { const x = document.querySelector('[role=region] .flow-next'); return x && !x.disabled }", timeout=9000)
        if k == 1:
            with p.expect_download() as d: p.locator('[role=region] .flow-next').click()
        else: p.locator('[role=region] .flow-next').click(); p.wait_for_timeout(300)
    d.value.save_as('/tmp/qr-out.png'); img = cv2.imread('/tmp/qr-out.png'); val, _, _ = cv2.QRCodeDetector().detectAndDecode(img)
    ok = val == URL; print('PASS' if ok else 'FAIL', 'png decodes to the typed text', img.shape, repr(val)[:60])
    p.screenshot(path='/downloads/qr-page.png'); sys.exit(0 if ok else 1)
