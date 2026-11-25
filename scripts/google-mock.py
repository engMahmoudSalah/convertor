import http.server, json, base64, time, urllib.parse
CLAIMS={'iss':'https://accounts.google.com','aud':'cid123','sub':'g-1','email':'gnew@example.com','email_verified':True,'name':'G New'}
def b(x): return base64.urlsafe_b64encode(json.dumps(x).encode()).decode().rstrip('=')
class H(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        n=int(self.headers['content-length']); q=urllib.parse.parse_qs(self.rfile.read(n).decode())
        if q['client_secret'][0]!='sec' or q['code_verifier'][0]=='' : self.send_response(400); self.end_headers(); return
        c=dict(CLAIMS); c['exp']=int(time.time())+300
        code=q['code'][0]
        if code.startswith('X'): c.update(json.loads(base64.urlsafe_b64decode(code[1:]+'==')))
        self.send_response(200); self.send_header('content-type','application/json'); self.end_headers()
        self.wfile.write(json.dumps({'id_token':'h.'+b(c)+'.s'}).encode())
    def log_message(self,*a): pass
http.server.HTTPServer(('127.0.0.1',9911),H).serve_forever()
