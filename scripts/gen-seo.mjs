// Generates src/seo/tools.json from the registry and Arabic dictionary (build-time, no runtime cost).
import fs from 'node:fs';
const reg = fs.readFileSync('src/tools/registry.ts', 'utf8');
const arSrc = fs.readFileSync('src/lib/ar.ts', 'utf8');
const body = arSrc.slice(arSrc.indexOf('{'), arSrc.lastIndexOf('}') + 1);
const AR = new Function('return (' + body + ')')();
const tools = [];
for (const line of reg.split('\n')) {
  const m = line.match(/^\s*\{ id: '([^']+)', title: '([^']+)', desc: '((?:[^'\\]|\\.)*)', category: '([^']+)'/);
  if (!m) continue;
  const [, id, title, d, cat] = m; const desc = d.replace(/\\'/g, "'");
  tools.push({ id, title, desc, cat, ar: { title: AR[title] ?? '', desc: AR[desc] ?? '' } });
}
fs.mkdirSync('src/seo', { recursive: true });
fs.writeFileSync('src/seo/tools.json', JSON.stringify(tools, null, 1));
console.log('seo tools', tools.length, 'missing ar title', tools.filter((t) => !t.ar.title).map((t) => t.id).join(','), 'missing ar desc', tools.filter((t) => !t.ar.desc).map((t) => t.id).join(','));
