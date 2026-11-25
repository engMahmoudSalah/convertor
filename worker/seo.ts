// Server-side SEO: per-route head tags, structured data, crawlable content, sitemap, robots and ads.txt.
import { SEO_TOOLS, SITE, PAGES, toolById, toolMeta, pageMeta, howTo, faq, related } from '../src/seo/content';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonLd = (o: unknown) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
type L = 'en' | 'ar';

export function route(pathname: string): { lang: L; path: string } {
  let lang: L = 'en'; let p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/ar' || p.startsWith('/ar/')) { lang = 'ar'; p = p.slice(3) || '/'; }
  return { lang, path: p === '/' ? '' : p.replace(/^\//, '') };
}

export function seoRoutes(): string[] {
  return [...PAGES, ...SEO_TOOLS.map((t) => 'tools/' + t.id)];
}

export function robots(origin: string) {
  return `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /account\nDisallow: /admin\nDisallow: /login\nDisallow: /signup\n\nSitemap: ${origin}/sitemap.xml\n`;
}

export function adsTxt(pub?: string) {
  const id = (pub ?? '').replace(/^ca-/, '');
  return /^pub-\d{8,}$/.test(id) ? `google.com, ${id}, DIRECT, f08c47fec0942fa0\n` : '# ads.txt: add the AdSense publisher line here after the AdSense account is approved.\n';
}

export function sitemap(origin: string) {
  const u = (p: string, l: L) => `${origin}${l === 'ar' ? '/ar' : ''}${p ? '/' + p : l === 'ar' ? '' : '/'}`;
  const items = seoRoutes().map((p) => `<url><loc>${u(p, 'en')}</loc><xhtml:link rel="alternate" hreflang="en" href="${u(p, 'en')}"/><xhtml:link rel="alternate" hreflang="ar" href="${u(p, 'ar')}"/><xhtml:link rel="alternate" hreflang="x-default" href="${u(p, 'en')}"/></url>\n<url><loc>${u(p, 'ar')}</loc><xhtml:link rel="alternate" hreflang="en" href="${u(p, 'en')}"/><xhtml:link rel="alternate" hreflang="ar" href="${u(p, 'ar')}"/></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${items.join('\n')}\n</urlset>\n`;
}

function describe(path: string, lang: L, origin: string) {
  const base = (l: L, p: string) => `${origin}${l === 'ar' ? '/ar' : ''}${p ? '/' + p : l === 'ar' ? '' : '/'}`;
  let meta: { title: string; description: string; h1: string } | null = null; let ld: string[] = []; let body = '';
  const li = (l: L) => (href: string, text: string) => `<li><a href="${base(l, href)}">${esc(text)}</a></li>`;
  const link = li(lang);
  const crumbs = (items: [string, string][]) => jsonLd({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: u })) });
  if (path.startsWith('tools/')) {
    const t = toolById(path.slice(6)); if (!t) return null;
    meta = toolMeta(t, lang); const hw = howTo(t, lang); const fq = faq(t, lang); const rel = related(t);
    ld = [
      jsonLd({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: meta.h1, description: meta.description, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (web browser)', url: base(lang, path), inLanguage: lang, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }),
      jsonLd({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: fq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }),
      jsonLd({ '@context': 'https://schema.org', '@type': 'HowTo', name: meta.h1, step: hw.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, text: s })) }),
      crumbs([[SITE, base(lang, '')], [meta.h1, base(lang, path)]]),
    ];
    body = `<h1>${esc(meta.h1)}</h1><p>${esc(meta.description)}</p><ol>${hw.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` +
      fq.map((f) => `<h2>${esc(f.q)}</h2><p>${esc(f.a)}</p>`).join('') + `<ul>${rel.map((r) => link('tools/' + r.id, lang === 'ar' && r.ar.title ? r.ar.title : r.title)).join('')}</ul>`;
  } else {
    meta = pageMeta(path, lang); if (!meta) return null;
    ld = [crumbs([[SITE, base(lang, '')], ...(path ? [[meta.h1, base(lang, path)] as [string, string]] : [])])];
    if (path === '') ld.push(jsonLd({ '@context': 'https://schema.org', '@type': 'WebSite', name: SITE, url: base(lang, ''), inLanguage: lang }));
    const list = path === '' || ['pdf', 'images', 'documents'].includes(path) ? `<ul>${SEO_TOOLS.map((t) => link('tools/' + t.id, lang === 'ar' && t.ar.title ? t.ar.title : t.title)).join('')}</ul>` : '';
    body = `<h1>${esc(meta.h1)}</h1><p>${esc(meta.description)}</p>${list}`;
  }
  const alt = `<link rel="canonical" href="${base(lang, path)}"><link rel="alternate" hreflang="en" href="${base('en', path)}"><link rel="alternate" hreflang="ar" href="${base('ar', path)}"><link rel="alternate" hreflang="x-default" href="${base('en', path)}">`;
  const social = `<meta property="og:url" content="${base(lang, path)}"><meta property="og:site_name" content="${SITE}"><meta property="og:locale" content="${lang === 'ar' ? 'ar_AR' : 'en_US'}"><meta property="og:image" content="${origin}/Magic0.png"><meta name="twitter:title" content="${esc(meta.title)}"><meta name="twitter:description" content="${esc(meta.description)}"><meta name="twitter:image" content="${origin}/Magic0.png">`;
  return { meta, head: alt + social + ld.join(''), body: `<div class="seo-static" style="max-width:760px;margin:80px auto;padding:16px;font-family:system-ui,sans-serif">${body}</div>` };
}

export async function seoPage(req: Request, env: any): Promise<Response | null> {
  const url = new URL(req.url); const { lang, path } = route(url.pathname);
  const d = describe(path, lang, url.origin); if (!d) return null;
  const res = await env.ASSETS.fetch(new Request(url.origin + '/index.html'));
  const out = new HTMLRewriter()
    .on('html', { element(e) { e.setAttribute('lang', lang); e.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr'); } })
    .on('title', { element(e) { e.setInnerContent(d.meta.title); } })
    .on('meta[name="description"]', { element(e) { e.setAttribute('content', d.meta.description); } })
    .on('meta[property="og:title"]', { element(e) { e.setAttribute('content', d.meta.title); } })
    .on('meta[property="og:description"]', { element(e) { e.setAttribute('content', d.meta.description); } })
    .on('meta[name="twitter:card"]', { element(e) { e.setAttribute('content', 'summary_large_image'); } })
    .on('head', { element(e) { e.append(d.head, { html: true }); } })
    .on('#root', { element(e) { e.setInnerContent(d.body, { html: true }); } })
    .transform(res);
  const h = new Headers(out.headers); h.set('cache-control', 'public, max-age=0, must-revalidate'); h.set('content-type', 'text/html; charset=utf-8');
  return new Response(out.body, { status: 200, headers: h });
}
