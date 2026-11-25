import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup } from 'pdf-lib';
import { baseName, canvasBlob } from '../lib/util';
import { textToPdfBlob } from './docTools';
import type { Out, Ctx } from './types';

const W = 794; // A4 at 96dpi
async function renderHtml(html: string, c: Ctx): Promise<Blob> {
  const doc = new DOMParser().parseFromString(html, 'text/html'); doc.querySelectorAll('script,iframe,object,embed,link[rel=stylesheet]').forEach((e) => e.remove());
  const host = document.createElement('div'); host.style.cssText = `position:fixed;left:-99999px;top:0;width:${W}px;background:#fff;color:#000;padding:0`; document.body.appendChild(host);
  host.innerHTML = `<div style="padding:40px;box-sizing:border-box;width:${W}px;font-family:Arial,sans-serif">${doc.body.innerHTML}</div>`;
  const styles = [...doc.querySelectorAll('style')].map((s) => s.textContent).join('\n');
  const total = Math.max(host.scrollHeight, 100); const pages = Math.ceil(total / 1123);
  const inner = host.innerHTML; document.body.removeChild(host);
  const out = await PDFDocument.create();
  for (let p = 0; p < pages; p++) {
    c.progress(p, pages, `Page ${p + 1}/${pages}`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="1123"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${W}px;height:1123px;overflow:hidden;background:#fff"><style>${styles}</style><div style="transform:translateY(${-p * 1123}px)">${inner.replace(/<br>/g, '<br/>').replace(/<img([^>]*[^/])>/g, '<img$1/>').replace(/<hr([^>]*[^/])?>/g, '<hr/>')}</div></div></foreignObject></svg>`;
    const img = new Image(); await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('This HTML could not be rendered (check that tags are closed)')); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
    const cv = document.createElement('canvas'); cv.width = W * 2; cv.height = 1123 * 2; const g = cv.getContext('2d')!; g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, 0, 0, cv.width, cv.height);
    const emb = await out.embedJpg(await (await canvasBlob(cv, 'image/jpeg', 0.9)).arrayBuffer()); out.addPage([595.28, 841.89]).drawImage(emb, { x: 0, y: 0, width: 595.28, height: 841.89 });
  }
  return new Blob([await out.save()], { type: 'application/pdf' });
}
export async function htmlToPdf(files: File[], o: any, c: Ctx): Promise<Out[]> {
  const outs: Out[] = [];
  for (const f of files) {
    const html = await f.text();
    if (o.mode === 'text') {
      const doc = new DOMParser().parseFromString(html, 'text/html'); const paras: any[] = [];
      doc.body.querySelectorAll('h1,h2,h3,h4,p,li,td,pre').forEach((e) => { const tag = e.tagName; const h = /^H[1-4]$/.test(tag); paras.push({ t: (tag === 'LI' ? '- ' : '') + (e.textContent ?? '').trim(), bold: h, size: h ? ({ H1: 22, H2: 18, H3: 15, H4: 13 } as any)[tag] : undefined }); });
      outs.push({ name: `${baseName(f.name)}.pdf`, blob: await textToPdfBlob(paras, 11), note: 'Selectable text, simple layout (Latin characters)' });
    } else outs.push({ name: `${baseName(f.name)}.pdf`, blob: await renderHtml(html, c), note: 'Looks like the page (pages are images, text is not selectable). Inline styles and <style> blocks only; external files are not loaded.' });
  }
  return outs;
}
export async function fillForm(files: File[], o: any): Promise<Out[]> {
  const d = await PDFDocument.load(await files[0].arrayBuffer()); const form = d.getForm(); const fields = form.getFields();
  if (!fields.length) throw new Error('This PDF has no fillable form fields');
  const list = fields.map((f) => `${f.getName()} [${f.constructor.name.replace('PDF', '')}]`);
  const lines = String(o.values ?? '').split(/[;\n]/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [{ name: `${baseName(files[0].name)}-fields.txt`, blob: new Blob([list.join('\n')], { type: 'text/plain' }), note: `${fields.length} field(s) found. Type values as name=value (separate with ;) and run again.` }];
  let n = 0; const miss: string[] = [];
  for (const l of lines) {
    const i = l.indexOf('='); if (i < 1) continue; const k = l.slice(0, i).trim(), v = l.slice(i + 1).trim();
    const f = fields.find((x) => x.getName().toLowerCase() === k.toLowerCase()); if (!f) { miss.push(k); continue; }
    try {
      if (f instanceof PDFTextField) f.setText(v);
      else if (f instanceof PDFCheckBox) /^(1|true|yes|on|x)$/i.test(v) ? f.check() : f.uncheck();
      else if (f instanceof PDFDropdown || f instanceof PDFRadioGroup) f.select(v);
      n++;
    } catch { miss.push(k); }
  }
  if (o.flatten) form.flatten();
  return [{ name: `${baseName(files[0].name)}-filled.pdf`, blob: new Blob([await d.save()], { type: 'application/pdf' }), note: `${n} field(s) filled${miss.length ? `, not found or invalid: ${miss.join(', ')}` : ''}${o.flatten ? '. Form flattened.' : ''}` }];
}
export async function makeForm(files: File[], o: any): Promise<Out[]> {
  const d = await PDFDocument.load(await files[0].arrayBuffer()); const form = d.getForm(); const p = d.getPages()[Math.max(0, Math.min(d.getPageCount() - 1, +o.page - 1))]; const { width: W, height: H } = p.getSize();
  const names = String(o.names ?? '').split(/[,\n]/).map((s) => s.trim()).filter(Boolean); if (!names.length) throw new Error('List the field names to add (comma separated)');
  names.forEach((n, i) => { const y = H - (+o.top / 100) * H - (i + 1) * 28; const t = form.createTextField(n.replace(/\s+/g, '_')); t.addToPage(p, { x: (+o.left / 100) * W, y, width: (+o.w / 100) * W, height: 20 }); });
  return [{ name: `${baseName(files[0].name)}-form.pdf`, blob: new Blob([await d.save()], { type: 'application/pdf' }), note: `${names.length} fillable text field(s) added on page ${o.page}` }];
}
