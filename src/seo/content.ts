import TOOLS from './tools.json';
export type SeoTool = { id: string; title: string; desc: string; cat: string; ar: { title: string; desc: string } };
export const SEO_TOOLS = TOOLS as SeoTool[];
export const SITE = 'Magic Convertor';
export const PAGES = ['', 'pdf', 'images', 'documents', 'pricing', 'about', 'contact', 'legal/terms', 'legal/privacy', 'legal/refunds'];
export const toolById = (id: string) => SEO_TOOLS.find((t) => t.id === id);

type L = 'en' | 'ar';
const T = (t: SeoTool, l: L) => (l === 'ar' && t.ar.title ? t.ar.title : t.title);
const D = (t: SeoTool, l: L) => (l === 'ar' && t.ar.desc ? t.ar.desc : t.desc);

const EXTRA: Record<string, { en: string; ar: string }> = {
  'merge-pdf': { en: 'merge PDF files online free, combine PDFs into one', ar: 'دمج ملفات PDF مجاناً، جمع عدة ملفات PDF في ملف واحد' },
  'split-pdf': { en: 'split PDF online free, separate PDF pages', ar: 'تقسيم ملف PDF مجاناً، فصل صفحات PDF' },
  'compress-pdf': { en: 'compress PDF online free, reduce PDF file size', ar: 'ضغط ملف PDF مجاناً، تصغير حجم PDF' },
  'pdf-to-word': { en: 'convert PDF to Word online free', ar: 'تحويل PDF إلى Word مجاناً' },
  'word-to-pdf': { en: 'convert Word to PDF online free', ar: 'تحويل Word إلى PDF مجاناً' },
  'pdf-to-images': { en: 'convert PDF to JPG or PNG online free', ar: 'تحويل PDF إلى صور JPG أو PNG مجاناً' },
  'images-to-pdf': { en: 'convert JPG or PNG to PDF online free', ar: 'تحويل الصور إلى PDF مجاناً' },
  'rotate-pdf': { en: 'rotate PDF pages online free', ar: 'تدوير صفحات PDF مجاناً' },
  'unlock-pdf': { en: 'remove PDF password online', ar: 'إزالة كلمة سر PDF' },
  'protect-pdf': { en: 'password protect a PDF online', ar: 'حماية ملف PDF بكلمة سر' },
};
export const keywordsFor = (t: SeoTool, l: L) => EXTRA[t.id]?.[l] ?? (l === 'ar' ? `${T(t, l)} مجاناً أونلاين` : `${t.title.toLowerCase()} online free`);

export function toolMeta(t: SeoTool, l: L) {
  const kw = keywordsFor(t, l);
  return l === 'ar'
    ? { title: `${T(t, l)} مجاناً أونلاين | ${SITE}`, description: `${D(t, l)}. ${kw}. يعمل داخل متصفحك، ملفاتك لا تُرفع، بدون تسجيل.` , h1: T(t, l) }
    : { title: `${t.title} Online Free | ${SITE}`, description: `${t.desc}. ${kw[0].toUpperCase() + kw.slice(1)}. Runs in your browser, your files are not uploaded, no sign-up needed.`, h1: t.title };
}
export function howTo(t: SeoTool, l: L): string[] {
  return l === 'ar'
    ? [`ارفع ملفك من جهازك أو اسحبه إلى المنطقة المخصصة.`, `اضبط خيارات ${T(t, l)} على لوحة العمل وشاهد المعاينة.`, `اضغط الزر لتنفيذ العملية داخل متصفحك، ثم نزّل النتيجة أو احفظها في حسابك.`]
    : [`Add your file by choosing it or dragging it onto the drop area.`, `Set the ${t.title} options on the work board and check the preview.`, `Run it in your browser, then download the result or save it to your profile.`];
}
export function faq(t: SeoTool, l: L): { q: string; a: string }[] {
  const n = T(t, l);
  return l === 'ar'
    ? [
        { q: `هل ${n} مجاني؟`, a: 'نعم، الاستخدام الأساسي مجاني. الخطط المدفوعة تزيد الحدود اليومية وتقلل الإعلانات.' },
        { q: 'هل ملفاتي آمنة؟', a: 'معظم الأدوات تعمل داخل متصفحك، فلا تُرفع ملفاتك إلى خوادمنا.' },
        { q: 'هل أحتاج لتسجيل حساب؟', a: 'لا. الحساب اختياري ويفيد في حفظ نتائجك وزيادة الحدود.' },
      ]
    : [
        { q: `Is ${t.title} free?`, a: 'Yes, basic use is free. Paid plans raise the daily limits and show fewer ads.' },
        { q: 'Are my files safe?', a: 'Most tools run inside your browser, so your files are not uploaded to our servers.' },
        { q: 'Do I need an account?', a: 'No. An account is optional and lets you save results and get higher limits.' },
      ];
}
export const related = (t: SeoTool, n = 6) => SEO_TOOLS.filter((x) => x.cat === t.cat && x.id !== t.id).concat(SEO_TOOLS.filter((x) => x.cat !== t.cat)).slice(0, n);

export const pageMeta = (path: string, l: L) => {
  const M: Record<string, { en: [string, string, string]; ar: [string, string, string] }> = {
    '': { en: [`${SITE}: free online PDF, image and document tools`, 'Merge, split, compress and convert PDFs, resize images, OCR and more. Runs in your browser, files stay on your device.', 'Free PDF and file tools in your browser'], ar: [`${SITE}: أدوات PDF والصور والمستندات مجاناً`, 'دمج وتقسيم وضغط وتحويل ملفات PDF وتغيير حجم الصور والتعرف على النصوص وأكثر. يعمل داخل متصفحك وملفاتك تبقى على جهازك.', 'أدوات PDF وملفات مجانية داخل متصفحك'] },
    pdf: { en: [`PDF Tools Online Free | ${SITE}`, 'Merge, split, compress, rotate, protect, unlock and convert PDF files online for free.', 'PDF tools'], ar: [`أدوات PDF أونلاين مجاناً | ${SITE}`, 'دمج وتقسيم وضغط وتدوير وحماية وفتح وتحويل ملفات PDF مجاناً.', 'أدوات PDF'] },
    images: { en: [`Image Tools Online Free | ${SITE}`, 'Convert, resize, compress and remove backgrounds from images in PNG, JPG and WebP.', 'Image tools'], ar: [`أدوات الصور أونلاين مجاناً | ${SITE}`, 'تحويل وتغيير حجم وضغط الصور وإزالة الخلفية بصيغ PNG وJPG وWebP.', 'أدوات الصور'] },
    documents: { en: [`Document Converters Online Free | ${SITE}`, 'Convert Word, Excel, PowerPoint, text and scans to and from PDF.', 'Document tools'], ar: [`محولات المستندات أونلاين مجاناً | ${SITE}`, 'حوّل Word وExcel وPowerPoint والنصوص والمسح الضوئي من وإلى PDF.', 'أدوات المستندات'] },
    pricing: { en: [`Pricing and Plans | ${SITE}`, 'Free, Pro and Business plans: daily limits, file size and ads per plan.', 'Pricing'], ar: [`الأسعار والخطط | ${SITE}`, 'خطط مجانية وPro وBusiness: الحدود اليومية وحجم الملف والإعلانات لكل خطة.', 'الأسعار'] },
    about: { en: [`About ${SITE}`, 'Who builds Magic Convertor, how it works and how it is funded.', 'About'], ar: [`عن ${SITE}`, 'من يبني Magic Convertor وكيف يعمل وكيف يُموَّل.', 'عن الموقع'] },
    contact: { en: [`Contact | ${SITE}`, 'How to reach the owner of Magic Convertor for support, privacy or business questions.', 'Contact'], ar: [`تواصل معنا | ${SITE}`, 'كيف تتواصل مع صاحب Magic Convertor للدعم أو الخصوصية أو الأعمال.', 'تواصل'] },
    'legal/terms': { en: [`Terms of Service | ${SITE}`, 'Terms of use for Magic Convertor.', 'Terms of Service'], ar: [`شروط الخدمة | ${SITE}`, 'شروط استخدام Magic Convertor.', 'شروط الخدمة'] },
    'legal/privacy': { en: [`Privacy Policy | ${SITE}`, 'How Magic Convertor handles your data, cookies and advertising.', 'Privacy Policy'], ar: [`سياسة الخصوصية | ${SITE}`, 'كيف يتعامل Magic Convertor مع بياناتك وملفات الارتباط والإعلانات.', 'سياسة الخصوصية'] },
    'legal/refunds': { en: [`Refund Policy | ${SITE}`, 'Refund rules for paid plans.', 'Refund Policy'], ar: [`سياسة الاسترداد | ${SITE}`, 'قواعد الاسترداد للخطط المدفوعة.', 'سياسة الاسترداد'] },
  };
  const m = M[path]; if (!m) return null; const [title, description, h1] = m[l]; return { title, description, h1 };
};
