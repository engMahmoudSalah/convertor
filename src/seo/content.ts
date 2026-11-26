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

type Copy = { steps: { en: string[]; ar: string[] }; faq: { en: [string, string][]; ar: [string, string][] } };
/** Hand-written guidance for the most used tools. Others fall back to the generic text below. */
const COPY: Record<string, Copy> = {
  'merge-pdf': {
    steps: { en: ['Add two or more PDFs. Drag the cards on the work board to set the order.', 'Press merge, then download one PDF with all pages in your order.'], ar: ['أضف ملفين PDF أو أكثر ورتّبهم بسحب البطاقات على لوحة العمل.', 'اضغط دمج ثم نزّل ملفاً واحداً بكل الصفحات بالترتيب الذي اخترته.'] },
    faq: { en: [['Can I change the order before merging?', 'Yes. Drag the files on the work board. The result follows that order.'], ['Is there a limit on how many files I can merge?', 'The limit is per batch and depends on your plan. It is shown on the Pricing page.'], ['Are my PDFs uploaded?', 'No. Merging happens in your browser, so the files stay on your device.']], ar: [['هل أقدر أغيّر الترتيب قبل الدمج؟', 'نعم. اسحب الملفات على لوحة العمل والنتيجة تتبع هذا الترتيب.'], ['هل في حد لعدد الملفات؟', 'الحد لكل دفعة ويعتمد على خطتك، وهو مكتوب في صفحة الأسعار.'], ['هل ملفاتي بتتحمّل على سيرفر؟', 'لا. الدمج يتم داخل متصفحك وملفاتك تبقى على جهازك.']] },
  },
  'split-pdf': {
    steps: { en: ['Add one PDF. Its pages appear on the work board.', 'Pick the split mode, or click the scissors between pages to cut there.', 'Run it and download the parts.'], ar: ['أضف ملف PDF واحد وستظهر صفحاته على لوحة العمل.', 'اختر وضع التقسيم أو اضغط المقص بين الصفحات للقص عندها.', 'نفّذ ثم نزّل الأجزاء.'] },
    faq: { en: [['How do I cut at an exact page?', 'Click the scissors between two pages on the work board. The cut follows your split mode.'], ['Does splitting change the quality?', 'No. Pages are copied as they are, so text and images are not recompressed.'], ['Are my PDFs uploaded?', 'No. Splitting runs in your browser.']], ar: [['إزاي أقص عند صفحة معينة؟', 'اضغط المقص بين صفحتين على لوحة العمل، والقص يتبع وضع التقسيم.'], ['هل التقسيم يقلل الجودة؟', 'لا. الصفحات تُنسخ كما هي دون إعادة ضغط.'], ['هل ملفاتي بتتحمّل على سيرفر؟', 'لا. التقسيم يتم داخل متصفحك.']] },
  },
  'compress-pdf': {
    steps: { en: ['Add your PDF. Scanned or image-heavy files shrink the most.', 'Pick Light, Balanced or Strong. The board shows the estimated size from page 1 at each level.', 'Run it and download the smaller file. If the original is already small, you are told there is no gain.'], ar: ['أضف ملف PDF. الملفات الممسوحة أو الكثيفة بالصور تتقلص أكثر.', 'اختر خفيف أو متوازن أو قوي، وتظهر تقديرات الحجم من الصفحة 1 لكل مستوى.', 'نفّذ ونزّل الملف الأصغر. وإذا كان الأصلي صغيراً أصلاً ستعرف أنه لا يوجد توفير.'] },
    faq: { en: [['Why did my PDF not get smaller?', 'Text-only PDFs are already compact. Compression mainly helps scans and images, and the tool says so when there is no gain.'], ['Which level should I pick?', 'Balanced is a good start. Strong makes the smallest file but lowers image quality more.']], ar: [['ليه الملف ما صغرش؟', 'ملفات النص فقط صغيرة أصلاً. الضغط يفيد الصور والمسح الضوئي، والأداة تخبرك لو لا يوجد توفير.'], ['أي مستوى أختار؟', 'المتوازن بداية جيدة. القوي يعطي أصغر حجم لكنه يخفض جودة الصور أكثر.']] },
  },
  'pdf-to-word': {
    steps: { en: ['Add a PDF that has selectable text.', 'Run the conversion in your browser.', 'Download the DOCX and edit it in Word or any compatible editor.'], ar: ['أضف ملف PDF يحتوي على نص قابل للتحديد.', 'نفّذ التحويل داخل متصفحك.', 'نزّل ملف DOCX وعدّله في Word أو أي محرر متوافق.'] },
    faq: { en: [['Will the layout match exactly?', 'Text is extracted into an editable document. Complex layouts, tables and columns can look different, so check the result.'], ['What about scanned PDFs?', 'A scan is a picture, not text. Run OCR first if you need to edit it.']], ar: [['هل التنسيق يطابق الأصل تماماً؟', 'يُستخرج النص إلى مستند قابل للتعديل. التخطيطات المعقدة والجداول والأعمدة قد تختلف، فراجع النتيجة.'], ['وماذا عن الملفات الممسوحة؟', 'الملف الممسوح صورة وليس نصاً. استخدم OCR أولاً إذا أردت تعديله.']] },
  },
  'images-to-pdf': {
    steps: { en: ['Add your JPG or PNG images and drag them into the order you want.', 'Check each page in the preview.', 'Run it and download one PDF.'], ar: ['أضف صور JPG أو PNG ورتّبها بالسحب.', 'راجع كل صفحة في المعاينة.', 'نفّذ ونزّل ملف PDF واحد.'] },
    faq: { en: [['Which image types work?', 'JPG and PNG are the common ones. See the drop area for the exact list.'], ['Can I reorder the pages?', 'Yes, drag the images on the work board.'], ['Are my images uploaded?', 'No. The PDF is built in your browser.']], ar: [['ما أنواع الصور المدعومة؟', 'JPG وPNG هما الأشهر. القائمة الدقيقة مكتوبة في منطقة الرفع.'], ['هل أقدر أرتب الصفحات؟', 'نعم، اسحب الصور على لوحة العمل.'], ['هل صوري بتتحمّل على سيرفر؟', 'لا. ملف PDF يُبنى داخل متصفحك.']] },
  },
  'rotate-pdf': {
    steps: { en: ['Add your PDF and see its pages on the work board.', 'Choose to rotate all pages or only some of them.', 'Run it and download the PDF with the new orientation.'], ar: ['أضف ملف PDF وستظهر صفحاته على لوحة العمل.', 'اختر تدوير كل الصفحات أو بعضها فقط.', 'نفّذ ونزّل الملف بالاتجاه الجديد.'] },
    faq: { en: [['Can I rotate only some pages?', 'Yes. The tool rotates all or some pages, and the rest stay as they are.'], ['Does rotating reduce quality?', 'No. Only the page orientation changes. Content is not recompressed.'], ['Are my PDFs uploaded?', 'No. Rotation runs in your browser.']], ar: [['هل أقدر أدوّر صفحات معينة فقط؟', 'نعم. تدوّر الأداة كل الصفحات أو بعضها، والباقي يبقى كما هو.'], ['هل التدوير يقلل الجودة؟', 'لا. يتغير اتجاه الصفحة فقط ولا يُعاد ضغط المحتوى.'], ['هل ملفاتي بتتحمّل على سيرفر؟', 'لا. التدوير يتم داخل متصفحك.']] },
  },
  'pdf-to-images': {
    steps: { en: ['Add your PDF.', 'Choose JPG, PNG or WebP and the resolution in DPI (72 to 300).', 'Run it and download the images.'], ar: ['أضف ملف PDF.', 'اختر JPG أو PNG أو WebP والدقة بوحدة DPI (من 72 إلى 300).', 'نفّذ ونزّل الصور.'] },
    faq: { en: [['Which formats can I get?', 'JPG, PNG and WebP. You also choose the resolution, from 72 to 300 DPI.'], ['Do I get one image per page?', 'Yes, each page becomes its own image.'], ['Are my PDFs uploaded?', 'No. Pages are drawn in your browser.']], ar: [['ما الصيغ المتاحة؟', 'JPG وPNG وWebP، وتختار أيضاً الدقة من 72 إلى 300 DPI.'], ['هل أحصل على صورة لكل صفحة؟', 'نعم، كل صفحة تصبح صورة مستقلة.'], ['هل ملفاتي بتتحمّل على سيرفر؟', 'لا. الصفحات تُرسم داخل متصفحك.']] },
  },
  'word-to-pdf': {
    steps: { en: ['Add your DOCX file.', 'Run the conversion in your browser.', 'Download the PDF and check the layout.'], ar: ['أضف ملف DOCX.', 'نفّذ التحويل داخل متصفحك.', 'نزّل ملف PDF وراجع التنسيق.'] },
    faq: { en: [['Will fonts and layout match Word exactly?', 'Not always. Complex layouts, special fonts and tables can look a little different, so check the PDF before you send it.'], ['Are my documents uploaded?', 'No. The conversion runs in your browser.']], ar: [['هل الخطوط والتنسيق يطابقان Word تماماً؟', 'ليس دائماً. التخطيطات المعقدة والخطوط الخاصة والجداول قد تختلف قليلاً، فراجع الملف قبل إرساله.'], ['هل مستنداتي بتتحمّل على سيرفر؟', 'لا. التحويل يتم داخل متصفحك.']] },
  },
  'protect-pdf': {
    steps: { en: ['Add your PDF.', 'Type the password you want and keep it somewhere safe.', 'Run it and download the protected PDF.'], ar: ['أضف ملف PDF.', 'اكتب كلمة السر التي تريدها واحتفظ بها في مكان آمن.', 'نفّذ ونزّل الملف المحمي.'] },
    faq: { en: [['What if I forget the password?', 'We cannot recover it. Keep a copy of the password, and keep the original file too.'], ['Is the password sent anywhere?', 'No. The file is protected in your browser.']], ar: [['لو نسيت كلمة السر؟', 'لا نستطيع استرجاعها. احتفظ بنسخة من كلمة السر ومن الملف الأصلي.'], ['هل كلمة السر بتتبعت لأي مكان؟', 'لا. الحماية تتم داخل متصفحك.']] },
  },
  'unlock-pdf': {
    steps: { en: ['Add a PDF that you own and know the password for.', 'Enter the password.', 'Run it and download a copy without the password.'], ar: ['أضف ملف PDF تملكه وتعرف كلمة سره.', 'أدخل كلمة السر.', 'نفّذ ونزّل نسخة بدون كلمة سر.'] },
    faq: { en: [['Can this crack a password I do not know?', 'No. You need the correct password. The tool only removes it from your own copy.'], ['Are my files uploaded?', 'No. It runs in your browser.']], ar: [['هل تكسر كلمة سر لا أعرفها؟', 'لا. تحتاج كلمة السر الصحيحة، والأداة تزيلها من نسختك فقط.'], ['هل ملفاتي بتتحمّل على سيرفر؟', 'لا. تعمل داخل متصفحك.']] },
  },
  'convert-image': {
    steps: { en: ['Add one or more images.', 'Pick the format you want, such as JPG, PNG or WebP.', 'Run it and download the converted files.'], ar: ['أضف صورة أو أكثر.', 'اختر الصيغة المطلوبة مثل JPG أو PNG أو WebP.', 'نفّذ ونزّل الملفات المحوّلة.'] },
    faq: { en: [['Which format should I pick?', 'JPG for photos, PNG for graphics that need sharp edges or transparency, WebP for small files on the web.'], ['Are my images uploaded?', 'No. Conversion runs in your browser.']], ar: [['أي صيغة أختار؟', 'JPG للصور، وPNG للرسومات التي تحتاج حواف حادة أو شفافية، وWebP للملفات الصغيرة على الويب.'], ['هل صوري بتتحمّل على سيرفر؟', 'لا. التحويل يتم داخل متصفحك.']] },
  },
  'ocr-image': {
    steps: { en: ['Add a clear photo or scan of the text.', 'Pick the language of the text if asked.', 'Run it and copy or download the recognised text.'], ar: ['أضف صورة واضحة أو مسحاً ضوئياً للنص.', 'اختر لغة النص إن طُلب منك ذلك.', 'نفّذ ثم انسخ النص المستخرج أو نزّله.'] },
    faq: { en: [['How accurate is the text?', 'It depends on the image. Sharp, well lit, straight text works best. Always read the result before you rely on it.'], ['Are my images uploaded?', 'No. Recognition runs in your browser.']], ar: [['ما مدى دقة النص المستخرج؟', 'يعتمد على الصورة. النص الواضح والمضاء جيداً والمستقيم يعطي أفضل نتيجة. اقرأ الناتج دائماً قبل الاعتماد عليه.'], ['هل صوري بتتحمّل على سيرفر؟', 'لا. التعرف على النص يتم داخل متصفحك.']] },
  },
  'watermark-pdf': {
    steps: { en: ['Add your PDF.', 'Type the watermark text and set its size, colour and position.', 'Run it and download the watermarked PDF.'], ar: ['أضف ملف PDF.', 'اكتب نص العلامة المائية وحدد حجمها ولونها وموضعها.', 'نفّذ ونزّل الملف بالعلامة المائية.'] },
    faq: { en: [['Can the watermark be removed later?', 'Treat it as a visible mark, not as protection. Keep your original file.'], ['Are my PDFs uploaded?', 'No. The watermark is added in your browser.']], ar: [['هل يمكن إزالة العلامة المائية لاحقاً؟', 'اعتبرها علامة ظاهرة وليست حماية. احتفظ بملفك الأصلي.'], ['هل ملفاتي بتتحمّل على سيرفر؟', 'لا. تُضاف العلامة داخل متصفحك.']] },
  },
  'pdf-to-text': {
    steps: { en: ['Add a PDF that has selectable text.', 'Run it to extract the text.', 'Copy it or download it as a text file.'], ar: ['أضف ملف PDF يحتوي على نص قابل للتحديد.', 'نفّذ لاستخراج النص.', 'انسخه أو نزّله كملف نصي.'] },
    faq: { en: [['Why is the text empty?', 'The PDF is probably a scan, which is a picture of text. Use OCR PDF for that.'], ['Are my PDFs uploaded?', 'No. Extraction runs in your browser.']], ar: [['ليه النص فاضي؟', 'غالباً الملف ممسوح ضوئياً أي صورة للنص. استخدم أداة OCR لملف PDF.'], ['هل ملفاتي بتتحمّل على سيرفر؟', 'لا. الاستخراج يتم داخل متصفحك.']] },
  },
};
export const keywordsFor = (t: SeoTool, l: L) => EXTRA[t.id]?.[l] ?? (l === 'ar' ? `${T(t, l)} مجاناً أونلاين` : `${t.title.toLowerCase()} online free`);

export function toolMeta(t: SeoTool, l: L) {
  const kw = keywordsFor(t, l);
  return l === 'ar'
    ? { title: `${T(t, l)} مجاناً أونلاين | ${SITE}`, description: `${D(t, l)}. ${kw}. يعمل داخل متصفحك، ملفاتك لا تُرفع، بدون تسجيل.` , h1: T(t, l) }
    : { title: `${t.title} Online Free | ${SITE}`, description: `${t.desc}. ${kw[0].toUpperCase() + kw.slice(1)}. Runs in your browser, your files are not uploaded, no sign-up needed.`, h1: t.title };
}
export function howTo(t: SeoTool, l: L): string[] {
  if (COPY[t.id]) return COPY[t.id].steps[l];
  return l === 'ar'
    ? [`ارفع ملفك من جهازك أو اسحبه إلى المنطقة المخصصة.`, `اضبط خيارات ${T(t, l)} على لوحة العمل وشاهد المعاينة.`, `اضغط الزر لتنفيذ العملية داخل متصفحك، ثم نزّل النتيجة أو احفظها في حسابك.`]
    : [`Add your file by choosing it or dragging it onto the drop area.`, `Set the ${t.title} options on the work board and check the preview.`, `Run it in your browser, then download the result or save it to your profile.`];
}
export function faq(t: SeoTool, l: L): { q: string; a: string }[] {
  const n = T(t, l);
  if (COPY[t.id]) return COPY[t.id].faq[l].map(([q, a]) => ({ q, a }));
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
