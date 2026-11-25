# Sign in with Google: setup (free)

1. Open https://console.cloud.google.com and sign in with the Google account that will own the app.
2. Create a project: top bar project picker > New project > name "Magic Convertor" > Create.
3. APIs and Services > OAuth consent screen (may be called "Google Auth Platform" > Branding).
   - User type: External. App name: Magic Convertor. User support email and developer contact email: your email.
   - Authorized domain: the site's domain (workers.dev cannot be added as an authorized domain; with a custom domain, add it here).
   - Scopes: openid, email, profile (the defaults, no sensitive scopes, so no Google review is needed).
   - Publishing status: click "Publish app" (In production). In "Testing" only listed test users can sign in.
4. APIs and Services > Credentials > Create credentials > OAuth client ID.
   - Application type: Web application. Name: Magic Convertor web.
   - Authorized JavaScript origins: https://magic-convertor.mahmodsalah.workers.dev
   - Authorized redirect URIs: https://magic-convertor.mahmodsalah.workers.dev/api/auth/google/callback
   - If you later add a custom domain, add its origin and the same /api/auth/google/callback path there too.
5. Copy the Client ID and Client secret and send them through the vault link (never in chat).
6. We store them as Worker secrets GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET. The button appears automatically.
