import json,base64,urllib.request,urllib.parse,urllib.error,re
B='http://localhost:8799'
class NoRedir(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*a,**k): return None
class C:
    def __init__(s): s.sess=''
    def req(s,path,data=None,cookie=''):
        ck='; '.join(x for x in (s.sess,cookie) if x)
        r=urllib.request.Request(B+path,data=json.dumps(data).encode() if data is not None else None,headers={'content-type':'application/json','cookie':ck})
        try: x=urllib.request.build_opener(NoRedir).open(r)
        except urllib.error.HTTPError as e: x=e
        for c in x.headers.get_all('Set-Cookie') or []:
            m=re.match(r'mc_session=([^;]*)',c)
            if m: s.sess='mc_session='+m.group(1) if m.group(1) else ''
        return x.code,x.headers,x.read().decode()
    def cb(s,claims=None,state=None):
        c,h,_=s.req('/api/auth/google/start'); loc=h['Location']; assert 'code_challenge' in loc
        oc=h.get_all('Set-Cookie')[0].split(';')[0]; st=urllib.parse.parse_qs(urllib.parse.urlparse(loc).query)['state'][0]
        code='X'+base64.urlsafe_b64encode(json.dumps(claims or {}).encode()).decode().rstrip('=')
        c,h,_=s.req('/api/auth/google/callback?code='+code+'&state='+(state or st),cookie=oc); return h['Location']
res=[]
def ck(n,ok): res.append(bool(ok)); print('PASS' if ok else 'FAIL',n)
a=C(); l=a.cb(); ck('new google user -> /account',l=='/account')
u=json.loads(a.req('/api/me')[2])['user']; ck('session, verified, no password',u and u['email']=='gnew@example.com' and u['email_verified'] and u['has_password'] is False and u['google'])
ck('bad state rejected','google_state' in C().cb(state='00'*16))
ck('wrong aud rejected','google_claims' in C().cb({'aud':'other'}))
ck('unverified google email rejected','google_claims' in C().cb({'email_verified':False,'email':'x@example.com','sub':'g-9'}))
ck('wrong iss rejected','google_claims' in C().cb({'iss':'https://evil.example'}))
ck('expired rejected','google_claims' in C().cb({'exp':1}))
v=C(); v.req('/api/auth/signup',{'email':'victim@example.com','password':'attackerpw1'}); old=v.sess
w=C(); ck('link existing unverified account',w.cb({'email':'victim@example.com','sub':'g-2'})=='/account')
ck('old password no longer works',C().req('/api/auth/login',{'email':'victim@example.com','password':'attackerpw1'})[0]==401)
x=C(); x.sess=old; ck('old session revoked',json.loads(x.req('/api/me')[2])['user'] is None)
ck('password login for google-only = 401',C().req('/api/auth/login',{'email':'gnew@example.com','password':'whatever12'})[0]==401)
ck('delete wrong confirm rejected',a.req('/api/auth/delete',{'immediate': True, 'password':'nope@x.com'})[0]==401)
ck('delete with email confirm',a.req('/api/auth/delete',{'immediate': True, 'password':'gnew@example.com'})[0]==200)
w.req('/api/auth/delete',{'immediate': True, 'password':'victim@example.com'})
ck('config google true',json.loads(C().req('/api/config')[2])['google'] is True)
print(sum(res),'/',len(res))
