# Text and developer tools: type input, read the result panel.
import sys
from playwright.sync_api import sync_playwright
B = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:4173'
def sel(p, label, v): p.locator('label').filter(has=p.locator('span', has_text=label)).first.locator('select').select_option(v)
def chk(p, label, v): p.locator('label').filter(has_text=label).first.locator('input[type=checkbox]').set_checked(v)
CASES = [
 ('case-converter', 'hello wORLD foo', {'Convert to': 'upper'}, 'HELLO WORLD FOO'),
 ('case-converter', 'hello wORLD foo', {'Convert to': 'camel'}, 'helloWorldFoo'),
 ('case-converter', 'Hello World', {'Convert to': 'snake'}, 'hello_world'),
 ('word-counter', 'one two three. four five', {}, 'Words: 5'),
 ('word-counter', 'مرحبا بالعالم الجميل', {}, 'Words: 3'),
 ('find-replace', 'a.b a.b', {'Find': '.', 'Replace with': '-'}, 'a-b a-b'),
 ('find-replace', 'x1 x22', {'Find': 'x(\\d+)', 'Replace with': 'y$1', 'Use a regular expression': True}, 'y1 y22'),
 ('text-slug', 'Héllo, Wörld! 2026', {}, 'hello-world-2026'),
 ('color-converter', '#e8590c', {}, 'HSL  hsl(21, 90%, 48%)'),
 ('color-converter', 'rgb(255, 0, 0)', {}, 'HEX  #ff0000'),
 ('color-converter', 'hsl(120, 100%, 25%)', {}, 'HEX  #008000'),
 ('color-converter', 'zzz', {}, 'Cannot read'),
 ('timestamp-converter', '1700000000', {}, 'UTC    2023-11-14T22:13:20.000Z'),
 ('timestamp-converter', '2023-11-14 22:13:20', {}, 'Seconds       1700000000'),
 ('jwt-decoder', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiQW5uIiwiZXhwIjoxOTAwMDAwMDAwfQ.sig', {}, '"name": "Ann"'),
 ('jwt-decoder', 'abc', {}, 'not a JWT'),
 ('html-to-text', '<h1>Hello</h1><p>One <b>two</b> <a href="https://x.io">go</a></p><ul><li>a</li><li>b</li></ul><script>bad()</script>', {}, 'One two go (https://x.io)'),
 ('html-to-text', '<ul><li>a</li><li>b</li></ul>', {}, '- a'),
 ('text-to-html', 'a < b\n\nnext', {}, '<p>a &lt; b</p>'),
 ('html-entities', 'Tom & <b>', {}, 'Tom &amp; &lt;b&gt;'),
 ('html-entities', 'Tom &amp; &#x41;', {'Direction': 'decode'}, 'Tom & A'),
 ('json-to-csv', '[{"name":"Ann","a":{"b":1}},{"name":"S,m","a":{"b":2}}]', {}, 'name,a.b'),
 ('json-to-csv', '[{"name":"Ann","a":{"b":1}},{"name":"S,m","a":{"b":2}}]', {}, '"S,m",2'),
 ('json-to-yaml', '{"name":"app","ports":[80,443],"d":{"x":true},"v":"1.0"}', {}, 'ports:\n  - 80'),
 ('json-to-yaml', '{"name":"app","v":"1.0"}', {}, 'v: "1.0"'),
 ('yaml-to-json', 'name: app\nports:\n  - 80\n  - 443\nitems:\n  - id: 1\n    ok: true\n  - id: 2\n', {}, '"id": 2'),
 ('yaml-to-json', 'name: app\ndebug: false', {}, '"debug": false'),
 ('json-to-xml', '{"user":{"name":"Ann","tags":["a","b"]}}', {}, '<tags>b</tags>'),
 ('xml-to-json', '<user id="1"><name>Ann</name><tag>a</tag><tag>b</tag></user>', {}, '"@id": "1"'),
 ('xml-to-json', '<a><b></a>', {}, 'Invalid XML'),
 ('text-to-json', 'name: Ann\nage: 30\nactive: true', {}, '"age": 30'),
 ('markdown-to-html', '# Title\n\nSome **bold** and [link](https://e.com).\n\n- one\n- two', {}, '<h1>Title</h1>'),
 ('markdown-to-html', '[x](javascript:alert(1))', {}, '<p>x</p>'),
 ('html-formatter', '<div><p>Hello</p><img src=a.png></div>', {}, '  <p>'),
 ('html-formatter', '<div>\n  <p>\n Hello\n </p>\n</div>', {'Action': 'minify'}, '<div><p>Hello</p></div>'),
 ('number-base', '255', {}, 'Hexadecimal  ff'),
 ('number-base', '0b1010', {}, 'Decimal      10'),
 ('number-base', 'ff', {'Input is': '16'}, 'Binary       11111111'),
 ('number-base', '12', {'Input is': '2'}, 'not a base 2'),
 ('unit-converter', '5 km', {}, 'mi     3.106856'),
 ('unit-converter', '212 f', {}, 'Celsius     100'),
 ('unit-converter', '1 gb', {}, 'mb     1024'),
 ('unit-converter', '2.2 lb', {}, 'kg     0.99790'),
 ('unit-converter', '5 parsec', {}, 'Unknown unit'),
 ('clean-lines', 'b\na\nb\n\n a ', {'Sort': 'asc'}, 'a\nb'),
 ('json-formatter', '{"b":1,"a":[1,2]}', {'Layout': 'min'}, '{"b":1,"a":[1,2]}'),
 ('json-formatter', '{"b":1', {}, 'Not valid JSON'),
 ('base64-tool', 'héllo ✓', {}, 'aMOpbGxvIOKckw=='),
 ('url-encode', 'a b&c', {}, 'a%20b%26c'),
 ('csv-to-json', 'name,age\nSara,31\n"Li, Jo",5', {}, '"name": "Li, Jo"'),
 ('hash-generator', 'abc', {}, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'),
]
bad = 0
with sync_playwright() as pw:
    b = pw.chromium.launch(); c = b.new_context(viewport={'width': 1280, 'height': 900}); c.add_init_script("localStorage.setItem('mc_consent','essential')"); p = c.new_page(); errs = []
    p.on('pageerror', lambda e: errs.append(str(e)[:100]))
    for tid, text, opts, want in CASES:
        p.goto(f'{B}/tools/{tid}'); p.fill('#tt-in', text)
        for k, v in opts.items():
            if isinstance(v, bool): chk(p, k, v)
            elif k in ('Find', 'Replace with'): p.locator('label').filter(has=p.locator('span', has_text=k)).first.locator('input').fill(v)
            else: sel(p, k, v)
        p.wait_for_timeout(450)
        got = p.locator('section[aria-live] pre').inner_text() + ' ' + (p.locator('section[aria-live] [role=alert]').inner_text() if p.locator('section[aria-live] [role=alert]').count() else '')
        ok = want in got; bad += not ok; print('PASS' if ok else 'FAIL', tid, opts, '' if ok else repr(got[:120]))
    p.goto(f'{B}/tools/text-diff'); p.fill('#tt-in', 'a\nb\nc'); p.fill('#tt-in2', 'a\nc\nd'); p.wait_for_timeout(450)
    g = p.locator('section[aria-live] pre').inner_text(); ok = '1 added, 1 removed' in g and '- b' in g and '+ d' in g; bad += not ok; print('PASS' if ok else 'FAIL', 'text-diff', repr(g[:80]))
    p.goto(f'{B}/tools/lorem-ipsum'); p.wait_for_timeout(450); g = p.locator('section[aria-live] pre').inner_text(); ok = g.startswith('Lorem ipsum') and g.count('\n\n') == 2; bad += not ok; print('PASS' if ok else 'FAIL', 'lorem', repr(g[:50]))
    print('page errors', errs[:2])
    b.close()
print('failed', bad); sys.exit(1 if bad else 0)
