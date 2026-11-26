import TOOLS from './tools.json';
export type SeoTool = { id: string; title: string; desc: string; cat: string; ar: { title: string; desc: string } };
export const SEO_TOOLS = TOOLS as SeoTool[];
export const SITE = 'Magic Convertor';
export const PAGES = ['', 'pdf', 'images', 'documents', 'text', 'developer', 'pricing', 'about', 'contact', 'legal/terms', 'legal/privacy', 'legal/refunds'];
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
  "flatten-pdf": {
    steps: { en: ["Add your PDF with forms, comments or stamps.", "Pick the quality. Standard is a good start.", "Run it and download the flattened copy."], ar: ["أضف ملف PDF فيه حقول أو تعليقات أو أختام.", "اختر الجودة. العادي بداية جيدة.", "نفّذ ثم نزّل النسخة المسطّحة."] },
    faq: { en: [["What does flatten do?", "It turns each page into a picture, so form fields, notes and stamps are fixed and cannot be edited."], ["Will I still be able to select text?", "No. The text becomes part of the picture. Run OCR afterwards if you need selectable text."]], ar: [["ماذا يفعل التسطيح؟", "يحوّل كل صفحة إلى صورة، فتثبت الحقول والملاحظات والأختام ولا يمكن تعديلها."], ["هل أستطيع تحديد النص بعدها؟", "لا. يصبح النص جزءاً من الصورة. استخدم التعرف على النص إذا احتجت نصاً قابلاً للتحديد."]] },
  },
  "page-size": {
    steps: { en: ["Add one PDF.", "Pick the paper size, direction and margin.", "Run it and download the resized PDF."], ar: ["أضف ملف PDF واحداً.", "اختر مقاس الورق والاتجاه والهامش.", "نفّذ ثم نزّل الملف بالمقاس الجديد."] },
    faq: { en: [["Are my pages stretched?", "No. Each page is scaled to fit and centred, keeping its proportions."], ["Is the text still selectable?", "Yes. Pages are placed as they are, not turned into pictures."]], ar: [["هل تتمدد الصفحات؟", "لا. تُصغَّر الصفحة لتناسب المقاس وتتوسط مع الحفاظ على النسبة."], ["هل يبقى النص قابلاً للتحديد؟", "نعم. توضع الصفحات كما هي دون تحويلها إلى صور."]] },
  },
  "qr-code": {
    steps: { en: ["Type a link, text or contact details.", "Pick the error correction level and colours.", "Download the QR code as PNG or SVG."], ar: ["اكتب رابطاً أو نصاً أو بيانات اتصال.", "اختر مستوى تصحيح الخطأ والألوان.", "نزّل الرمز بصيغة PNG أو SVG."] },
    faq: { en: [["Which level should I pick?", "Medium suits most uses. Choose High if you will add a logo or print on rough surfaces."], ["Is my text sent anywhere?", "No. The code is made in your browser."]], ar: [["أي مستوى أختار؟", "المتوسط يناسب أغلب الاستخدامات. اختر العالي إذا ستضيف شعاراً أو تطبع على سطح خشن."], ["هل يُرسل نصي إلى أي مكان؟", "لا. يُنشأ الرمز داخل متصفحك."]] },
  },
  "json-formatter": {
    steps: { en: ["Paste your JSON.", "Pick format or minify.", "Copy the result or download it."], ar: ["الصق JSON الخاص بك.", "اختر التنسيق أو التصغير.", "انسخ النتيجة أو نزّلها."] },
    faq: { en: [["What if my JSON is invalid?", "The tool shows the error so you can fix it. Nothing is changed."], ["Is my data uploaded?", "No. It is processed in your browser."]], ar: [["ماذا لو كان JSON غير صالح؟", "تظهر رسالة الخطأ لتصلحه. لا يتغير شيء."], ["هل تُرفع بياناتي؟", "لا. تُعالج داخل متصفحك."]] },
  },
  "word-counter": {
    steps: { en: ["Paste or type your text.", "Read the counts for words, characters, sentences and reading time."], ar: ["الصق نصك أو اكتبه.", "اقرأ عدد الكلمات والأحرف والجمل ووقت القراءة."] },
    faq: { en: [["Does it count Arabic?", "Yes. Words are split on spaces, so Arabic and English both work."], ["Is my text stored?", "No. Nothing leaves your browser."]], ar: [["هل يحسب العربية؟", "نعم. تُقسّم الكلمات بالمسافات فيعمل مع العربية والإنجليزية."], ["هل يُحفظ نصي؟", "لا. لا يغادر شيء متصفحك."]] },
  },
  "hash-generator": {
    steps: { en: ["Type or paste your text.", "Pick the SHA algorithm and read the hash.", "Copy the one you need."], ar: ["اكتب نصك أو الصقه.", "اختر خوارزمية SHA واقرأ قيمة التجزئة.", "انسخ ما تحتاجه."] },
    faq: { en: [["Can a hash be reversed?", "No. A hash is one way. The same text always gives the same hash."], ["Is MD5 offered?", "No. Browsers do not include it, so only SHA algorithms are offered."]], ar: [["هل يمكن عكس التجزئة؟", "لا. التجزئة باتجاه واحد، والنص نفسه يعطي القيمة نفسها دائماً."], ["هل يوجد MD5؟", "لا. المتصفحات لا تتضمنه، لذلك تتوفر خوارزميات SHA فقط."]] },
  },
  "crop-image": {
    steps: { en: ["Add an image.", "Choose a ratio or percent crop.", "Run it and download the cropped image."], ar: ["أضف صورة.", "اختر نسبة أو قصاً بالنسبة المئوية.", "نفّذ ثم نزّل الصورة المقصوصة."] },
    faq: { en: [["Is the quality kept?", "Yes. Pixels are cut, not recompressed more than the chosen format needs."], ["Can I drag to crop?", "Not yet. Use ratio or percent values for now."]], ar: [["هل تبقى الجودة؟", "نعم. تُقص البكسلات دون ضغط إضافي إلا بقدر الصيغة المختارة."], ["هل أستطيع القص بالسحب؟", "ليس بعد. استخدم النسبة أو القيم المئوية حالياً."]] },
  },
  "case-converter": {
    steps: { en: ["Paste your text.", "Pick upper, lower, title, camel, snake or another case.", "Copy the result."], ar: ["الصق نصك.", "اختر الأحرف الكبيرة أو الصغيرة أو camel أو snake أو غيرها.", "انسخ النتيجة."] },
    faq: { en: [["Does it work on Arabic?", "Arabic has no upper or lower case, so those modes leave it unchanged. Camel and snake modes still join the words."], ["Is my text stored?", "No. It stays in your browser."]], ar: [["هل يعمل مع العربية؟", "العربية بلا أحرف كبيرة وصغيرة، فلا تتغير في هذه الأوضاع. أوضاع camel وsnake تربط الكلمات فقط."], ["هل يُحفظ نصي؟", "لا. يبقى في متصفحك."]] },
  },
  "base64-tool": {
    steps: { en: ["Paste text or a Base64 string.", "Pick encode or decode.", "Copy the result."], ar: ["الصق نصاً أو سلسلة Base64.", "اختر الترميز أو فك الترميز.", "انسخ النتيجة."] },
    faq: { en: [["Does it handle Arabic and emoji?", "Yes. Text is treated as UTF-8 both ways."], ["Is Base64 encryption?", "No. Anyone can decode it. Do not use it to hide secrets."]], ar: [["هل يدعم العربية والرموز التعبيرية؟", "نعم. يُعامل النص بترميز UTF-8 في الاتجاهين."], ["هل Base64 تشفير؟", "لا. يمكن لأي شخص فك ترميزه. لا تستخدمه لإخفاء الأسرار."]] },
  },
  "url-encode": {
    steps: { en: ["Paste a link or text.", "Pick encode or decode.", "Copy the result."], ar: ["الصق رابطاً أو نصاً.", "اختر الترميز أو فك الترميز.", "انسخ النتيجة."] },
    faq: { en: [["When do I need this?", "When a value in a link has spaces, & or non-English letters, which must be written as %-codes."], ["Is my text uploaded?", "No. It is processed in your browser."]], ar: [["متى أحتاج هذه الأداة؟", "عندما تحتوي قيمة في الرابط على مسافات أو & أو حروف غير إنجليزية، فتُكتب برموز %."], ["هل يُرفع نصي؟", "لا. يُعالج داخل متصفحك."]] },
  },
  "csv-to-json": {
    steps: { en: ["Paste CSV with a header row.", "Check the JSON on the right.", "Copy it or download the file."], ar: ["الصق CSV وفيه صف العناوين.", "راجع JSON في الجانب الآخر.", "انسخه أو نزّل الملف."] },
    faq: { en: [["Are commas inside quotes handled?", "Yes. A value in double quotes can contain commas."], ["Which row gives the keys?", "The first row. Each later row becomes one object."]], ar: [["هل تُعالج الفواصل داخل علامات الاقتباس؟", "نعم. القيمة بين علامتي اقتباس يمكن أن تحتوي فواصل."], ["أي صف يعطي أسماء المفاتيح؟", "الصف الأول. كل صف بعده يصبح كائناً."]] },
  },
  "lorem-ipsum": {
    steps: { en: ["Set the number of paragraphs and sentences per paragraph.", "Copy the placeholder text."], ar: ["حدد عدد الفقرات والجمل في كل فقرة.", "انسخ النص التجريبي."] },
    faq: { en: [["What is lorem ipsum?", "Placeholder text used to fill a layout before the real words exist."], ["Is it the same every time?", "Yes. The same settings give the same text, starting with the classic opening line."]], ar: [["ما هو lorem ipsum؟", "نص تجريبي يملأ التصميم قبل توفر النص الحقيقي."], ["هل هو نفسه كل مرة؟", "نعم. الإعدادات نفسها تعطي النص نفسه، ويبدأ بالجملة الكلاسيكية."]] },
  },
  "text-diff": {
    steps: { en: ["Paste the old text on one side and the new text on the other.", "Read the added and removed lines."], ar: ["الصق النص القديم في جهة والجديد في الأخرى.", "اقرأ الأسطر المضافة والمحذوفة."] },
    faq: { en: [["Does it compare by line?", "Yes. Each line is compared as a whole."], ["Is my text sent anywhere?", "No. The comparison runs in your browser."]], ar: [["هل تتم المقارنة بالأسطر؟", "نعم. يُقارن كل سطر كاملاً."], ["هل يُرسل نصي إلى أي مكان؟", "لا. تتم المقارنة داخل متصفحك."]] },
  },
  "clean-lines": {
    steps: { en: ["Paste one item per line.", "Choose trim, remove empty, remove duplicates and sort.", "Copy the cleaned list."], ar: ["الصق عنصراً في كل سطر.", "اختر القص وحذف الفارغ وحذف المكرر والترتيب.", "انسخ القائمة النظيفة."] },
    faq: { en: [["Are numbers sorted properly?", "Yes. 2 comes before 10."], ["Can I ignore upper and lower case when removing duplicates?", "Yes, turn on the option for it."]], ar: [["هل تُرتب الأرقام بشكل صحيح؟", "نعم. 2 تأتي قبل 10."], ["هل أتجاهل حالة الأحرف عند حذف المكرر؟", "نعم، فعّل الخيار الخاص بذلك."]] },
  },
  "find-replace": {
    steps: { en: ["Paste your text.", "Type what to find and what to put instead.", "Turn on regular expressions if you need patterns, then copy the result."], ar: ["الصق نصك.", "اكتب ما تبحث عنه وما يحل محله.", "فعّل التعبير النمطي إذا احتجت أنماطاً ثم انسخ النتيجة."] },
    faq: { en: [["How do I reuse a matched part?", "With regular expressions on, write $1, $2 and so on in the replacement."], ["What if my pattern is wrong?", "The tool shows the error and leaves your text untouched."]], ar: [["كيف أعيد استخدام جزء مطابق؟", "مع تفعيل التعبير النمطي اكتب $1 و$2 وهكذا في خانة الاستبدال."], ["ماذا لو كان النمط خاطئاً؟", "تظهر رسالة الخطأ ويبقى نصك دون تغيير."]] },
  },
  "text-slug": {
    steps: { en: ["Type or paste titles, one per line.", "Pick a dash or underscore.", "Copy the slugs."], ar: ["اكتب العناوين أو الصقها، عنواناً في كل سطر.", "اختر الشرطة أو الشرطة السفلية.", "انسخ الروابط."] },
    faq: { en: [["What happens to accents?", "They are removed, so \u00e9 becomes e."], ["Are Arabic letters kept?", "Yes. Arabic letters and digits stay, spaces and symbols become the separator."]], ar: [["ماذا يحدث للحركات والتشكيل؟", "تُزال، فيصبح é حرف e."], ["هل تبقى الحروف العربية؟", "نعم. تبقى الحروف العربية والأرقام وتتحول المسافات والرموز إلى فاصل."]] },
  },
  "extract-images": {
    steps: { en: ["Add a PDF that contains photos or scans.", "Run it.", "Download the JPG, or a ZIP when there are several."], ar: ["أضف ملف PDF فيه صور أو مسح ضوئي.", "نفّذ الأداة.", "نزّل ملف JPG، أو ZIP عند وجود عدة صور."] },
    faq: { en: [["Is the quality changed?", "No. The original JPG data is copied out as it is."], ["Why were some pictures skipped?", "Only pictures stored as JPG can be copied unchanged. For the rest, use PDF to image."]], ar: [["هل تتغير الجودة؟", "لا. تُنسخ بيانات JPG الأصلية كما هي."], ["لماذا تُجوهلت بعض الصور؟", "لا يمكن نسخ إلا الصور المخزنة بصيغة JPG دون تغيير. لغيرها استخدم PDF إلى صورة."]] },
  },
  "color-converter": {
    steps: { en: ["Type or paste colors, one per line, as #hex, rgb() or hsl().", "Read HEX, RGB and HSL for each one.", "Copy the result."], ar: ["اكتب الألوان أو الصقها، لوناً في كل سطر، بصيغة #hex أو rgb() أو hsl().", "اقرأ HEX وRGB وHSL لكل لون.", "انسخ النتيجة."] },
    faq: { en: [["Which formats can I enter?", "Three or six digit HEX with or without #, rgb(r, g, b) and hsl(h, s%, l%)."], ["Why can HSL differ by 1 from another tool?", "HSL values are rounded to whole numbers."]], ar: [["ما الصيغ المقبولة؟", "HEX من ثلاث أو ست خانات مع # أو بدونها، وrgb(r, g, b) وhsl(h, s%, l%)."], ["لماذا قد يختلف HSL بمقدار 1 عن أداة أخرى؟", "تُقرَّب قيم HSL إلى أعداد صحيحة."]] },
  },
  "timestamp-converter": {
    steps: { en: ["Paste Unix times or dates, one per line.", "Read the date in UTC and your local time, or the Unix seconds and milliseconds."], ar: ["الصق أوقات Unix أو تواريخ، واحداً في كل سطر.", "اقرأ التاريخ بتوقيت UTC وتوقيتك المحلي، أو ثواني Unix وملّي ثانيتها."] },
    faq: { en: [["How does it tell seconds from milliseconds?", "A number of 12 digits or more is read as milliseconds, shorter ones as seconds."], ["Which time zone is used for a date I type?", "UTC, unless you add a zone such as +02:00 or Z."]], ar: [["كيف يفرق بين الثواني والملّي ثانية؟", "العدد من 12 رقماً فأكثر يُقرأ ملّي ثانية، والأقصر ثواني."], ["أي منطقة زمنية تُستخدم للتاريخ الذي أكتبه؟", "UTC، إلا إذا أضفت منطقة مثل +02:00 أو Z."]] },
  },
  "number-base": {
    steps: { en: ["Type numbers, one per line.", "Pick the input base, or leave it on detect.", "Read binary, octal, decimal and hex."], ar: ["اكتب الأعداد، عدداً في كل سطر.", "اختر نظام المُدخل أو اتركه على الاكتشاف.", "اقرأ الثنائي والثماني والعشري والست عشري."] },
    faq: { en: [["Does it handle very large numbers?", "Yes. It uses exact integer maths, so there is no rounding."], ["How does detect work?", "0x means hex, 0b binary, 0o octal. Anything else is decimal."]], ar: [["هل يدعم الأعداد الكبيرة جداً؟", "نعم. يستخدم حساباً صحيحاً دقيقاً دون تقريب."], ["كيف يعمل الاكتشاف؟", "0x تعني ست عشري، و0b ثنائي، و0o ثماني. وغير ذلك عشري."]] },
  },
  "svg-to-png": {
    steps: { en: ["Add an SVG file.", "Pick the scale and background.", "Download the PNG."], ar: ["أضف ملف SVG.", "اختر المقياس والخلفية.", "نزّل ملف PNG."] },
    faq: { en: [["Will it stay sharp?", "Yes. A higher scale draws the vector larger, so the PNG stays crisp."], ["Can the background be transparent?", "Yes, if you choose the transparent background."]], ar: [["هل تبقى الصورة حادة؟", "نعم. المقياس الأعلى يرسم الصورة المتجهة أكبر فيبقى الـ PNG واضحاً."], ["هل يمكن أن تكون الخلفية شفافة؟", "نعم، إذا اخترت الخلفية الشفافة."]] },
  },
  "favicon-generator": {
    steps: { en: ["Add a square logo or picture.", "Run it.", "Download the favicon files."], ar: ["أضف شعاراً أو صورة مربعة.", "نفّذ الأداة.", "نزّل ملفات الأيقونة."] },
    faq: { en: [["What do I get?", "A favicon.ico, PNG sizes and an app icon."], ["Which image works best?", "A square image of at least 512 px."]], ar: [["ماذا أحصل عليه؟", "ملف favicon.ico ومقاسات PNG وأيقونة تطبيق."], ["أي صورة تناسب أكثر؟", "صورة مربعة بعرض 512 بكسل على الأقل."]] },
  },
  "color-palette": {
    steps: { en: ["Add a photo.", "Pick how many colors you want.", "Copy the HEX codes."], ar: ["أضف صورة.", "اختر عدد الألوان.", "انسخ رموز HEX."] },
    faq: { en: [["How are the colors chosen?", "The photo is sampled and the most common colors are grouped."], ["Is my photo uploaded?", "No. It is analysed in your browser."]], ar: [["كيف تُختار الألوان؟", "تؤخذ عينات من الصورة وتُجمّع الألوان الأكثر شيوعاً."], ["هل تُرفع صورتي؟", "لا. تُحلَّل داخل متصفحك."]] },
  },
  "nup-pdf": {
    steps: { en: ["Add a PDF.", "Pick 2, 4, 6 or 9 pages per sheet and the direction.", "Download the new PDF."], ar: ["أضف ملف PDF.", "اختر 2 أو 4 أو 6 أو 9 صفحات في الورقة والاتجاه.", "نزّل الملف الجديد."] },
    faq: { en: [["Is the text still selectable?", "Yes. Pages are placed on the sheet, not turned into pictures."], ["Can I add borders?", "Yes, turn on the thin border option."]], ar: [["هل يبقى النص قابلاً للتحديد؟", "نعم. توضع الصفحات على الورقة دون تحويلها إلى صور."], ["هل يمكن إضافة إطار؟", "نعم، فعّل خيار الإطار الرفيع."]] },
  },
  "header-footer": {
    steps: { en: ["Add a PDF.", "Type the header and footer text. You can use {n}, {total}, {date} and {file}.", "Pick alignment and size, then download."], ar: ["أضف ملف PDF.", "اكتب نص الرأس والتذييل. يمكنك استخدام {n} و{total} و{date} و{file}.", "اختر المحاذاة والحجم ثم نزّل."] },
    faq: { en: [["What do the {n} and {total} codes do?", "They become the page number and the page count on each page."], ["Can I use only a footer?", "Yes. Leave the header empty."]], ar: [["ماذا تفعل الرموز {n} و{total}؟", "تتحول إلى رقم الصفحة وعدد الصفحات في كل صفحة."], ["هل أستخدم تذييلاً فقط؟", "نعم. اترك الرأس فارغاً."]] },
  },
  "unit-converter": {
    steps: { en: ["Type values with units, one per line, like 5 km or 72 f.", "Read the same value in the other units of its family.", "Copy the result."], ar: ["اكتب قيماً مع وحداتها، قيمة في كل سطر، مثل 5 km أو 72 f.", "اقرأ القيمة نفسها بالوحدات الأخرى من نفس النوع.", "انسخ النتيجة."] },
    faq: { en: [["Which units are supported?", "Length (mm, cm, m, km, in, ft, yd, mi), weight (mg, g, kg, t, oz, lb), volume (ml, l, tsp, tbsp, cup, gal), temperature (C, F, K) and data (B, KB, MB, GB, TB)."], ["How are data sizes counted?", "In steps of 1024, so 1 GB is 1024 MB. Cups and gallons are US measures."]], ar: [["ما الوحدات المدعومة؟", "الطول (mm وcm وm وkm وin وft وyd وmi) والوزن (mg وg وkg وt وoz وlb) والحجم (ml وl وtsp وtbsp وcup وgal) والحرارة (C وF وK) والبيانات (B وKB وMB وGB وTB)."], ["كيف تُحسب أحجام البيانات؟", "بخطوات 1024، فالـ GB الواحد يساوي 1024 MB. الأكواب والغالونات بالقياس الأمريكي."]] },
  },
  "jwt-decoder": {
    steps: { en: ["Paste the token.", "Read the header and payload.", "Check the dates and expiry."], ar: ["الصق الرمز.", "اقرأ الترويسة والمحتوى.", "راجع التواريخ وانتهاء الصلاحية."] },
    faq: { en: [["Is my token sent anywhere?", "No. It is decoded in your browser."], ["Does it check the signature?", "No. It only reads the contents. Never paste a live production token into any site."]], ar: [["هل يُرسل الرمز إلى أي مكان؟", "لا. يُفك داخل متصفحك."], ["هل يتحقق من التوقيع؟", "لا. يقرأ المحتوى فقط. لا تلصق رمزاً حياً من الإنتاج في أي موقع."]] },
  },
  "html-to-text": {
    steps: { en: ["Paste your HTML.", "Choose what to keep: links, headings, image descriptions.", "Copy or download the plain text."], ar: ["الصق كود HTML.", "اختر ما تحتفظ به: الروابط والعناوين ووصف الصور.", "انسخ النص العادي أو نزّله."] },
    faq: { en: [["Are scripts and styles removed?", "Yes. Script, style and head content is dropped before the text is read."], ["Is my HTML uploaded?", "No. It is read in your browser."]], ar: [["هل تُحذف السكربتات والأنماط؟", "نعم. يُحذف محتوى script وstyle وhead قبل قراءة النص."], ["هل يُرفع الكود؟", "لا. يُقرأ داخل متصفحك."]] },
  },
  "text-to-html": {
    steps: { en: ["Paste your text.", "Blank lines become paragraphs and single line breaks become <br>.", "Copy the HTML."], ar: ["الصق نصك.", "الأسطر الفارغة تصبح فقرات والأسطر المفردة تصبح <br>.", "انسخ كود HTML."] },
    faq: { en: [["Are special characters escaped?", "Yes. <, >, & and quotes are escaped, so the text shows as written."], ["Can I keep line breaks?", "Yes. A single line break becomes a <br> tag."]], ar: [["هل تُهرَّب الرموز الخاصة؟", "نعم. تُهرَّب <, > و& وعلامات الاقتباس فيظهر النص كما كُتب."], ["هل تبقى فواصل الأسطر؟", "نعم. الفاصل المفرد يصبح وسم <br>."]] },
  },
  "html-entities": {
    steps: { en: ["Paste text or entities.", "Pick encode or decode.", "Copy the result."], ar: ["الصق النص أو الرموز.", "اختر ترميزاً أو فكّاً.", "انسخ النتيجة."] },
    faq: { en: [["What gets encoded?", "The characters & < > \" and '. You can also encode non-ASCII letters as numeric entities."], ["Does decode handle numeric entities?", "Yes. Named and numeric entities such as &amp; and &#x41; are both decoded."]], ar: [["ما الذي يُرمَّز؟", "الرموز & < > \" و'. ويمكنك أيضاً ترميز الحروف غير ASCII كأرقام."], ["هل يفك الأرقام؟", "نعم. يفك الأسماء والأرقام مثل &amp; و&#x41;."]] },
  },
  "json-to-csv": {
    steps: { en: ["Paste a JSON array of objects.", "Pick the separator.", "Copy or download the CSV."], ar: ["الصق مصفوفة JSON من الكائنات.", "اختر الفاصل.", "انسخ ملف CSV أو نزّله."] },
    faq: { en: [["What about nested objects?", "They are flattened with dots, so address.city becomes its own column."], ["What if rows have different keys?", "The columns are the union of all keys. Missing values stay empty."]], ar: [["ماذا عن الكائنات المتداخلة؟", "تُسطَّح بنقاط، فيصبح address.city عموداً مستقلاً."], ["ماذا لو اختلفت المفاتيح؟", "الأعمدة هي اتحاد كل المفاتيح، والقيم الناقصة تبقى فارغة."]] },
  },
  "json-to-yaml": {
    steps: { en: ["Paste your JSON.", "Read the YAML on the right.", "Copy or download it."], ar: ["الصق JSON.", "اقرأ YAML على اليمين.", "انسخه أو نزّله."] },
    faq: { en: [["Are strings quoted?", "Only when needed, for example when they look like numbers, booleans or contain special characters."], ["Does it keep key order?", "Yes."]], ar: [["هل تُوضع النصوص بين علامات اقتباس؟", "فقط عند الحاجة، مثل النص الذي يشبه رقماً أو قيمة منطقية أو يحوي رموزاً خاصة."], ["هل يبقى ترتيب المفاتيح؟", "نعم."]] },
  },
  "yaml-to-json": {
    steps: { en: ["Paste your YAML.", "Read the JSON on the right.", "Copy or download it."], ar: ["الصق YAML.", "اقرأ JSON على اليمين.", "انسخه أو نزّله."] },
    faq: { en: [["Which YAML is supported?", "Maps, lists, nested blocks, quoted strings, numbers, booleans, null and inline lists. Multi-line block scalars are not supported yet."], ["Are comments kept?", "No. Comments are dropped."]], ar: [["أي YAML مدعوم؟", "الكائنات والقوائم والكتل المتداخلة والنصوص المقتبسة والأرقام والقيم المنطقية وnull والقوائم المضمّنة. النصوص متعددة الأسطر غير مدعومة بعد."], ["هل تبقى التعليقات؟", "لا. تُحذف التعليقات."]] },
  },
  "json-to-xml": {
    steps: { en: ["Paste your JSON.", "Set the root tag name.", "Copy or download the XML."], ar: ["الصق JSON.", "اكتب اسم الوسم الجذر.", "انسخ XML أو نزّله."] },
    faq: { en: [["How are arrays written?", "Each item becomes a repeated tag with the key name. A top-level array uses item tags."], ["Are tag names cleaned?", "Yes. Characters that XML does not allow become underscores."]], ar: [["كيف تُكتب المصفوفات؟", "كل عنصر يصبح وسماً مكرراً باسم المفتاح. والمصفوفة العليا تستعمل وسوم item."], ["هل تُنظَّف أسماء الوسوم؟", "نعم. الرموز غير المسموحة في XML تصبح شرطة سفلية."]] },
  },
  "xml-to-json": {
    steps: { en: ["Paste your XML.", "Read the JSON on the right.", "Copy or download it."], ar: ["الصق XML.", "اقرأ JSON على اليمين.", "انسخه أو نزّله."] },
    faq: { en: [["Where do attributes go?", "They become keys that start with @."], ["What about repeated tags?", "They become an array."]], ar: [["أين تذهب الخصائص؟", "تصبح مفاتيح تبدأ بـ @."], ["وماذا عن الوسوم المتكررة؟", "تصبح مصفوفة."]] },
  },
  "text-to-json": {
    steps: { en: ["Paste lines of text.", "Choose object or array.", "Copy or download the JSON."], ar: ["الصق أسطر النص.", "اختر كائناً أو مصفوفة.", "انسخ JSON أو نزّله."] },
    faq: { en: [["Which separators work for pairs?", "A colon or an equals sign, such as name: Ann or name=Ann."], ["Can numbers stay as text?", "Yes. Turn off the detect option."]], ar: [["أي فواصل تعمل مع الأزواج؟", "النقطتان أو علامة المساواة مثل name: Ann أو name=Ann."], ["هل تبقى الأرقام نصاً؟", "نعم. أوقف خيار الاكتشاف."]] },
  },
  "markdown-to-html": {
    steps: { en: ["Paste your Markdown.", "Read the HTML on the right.", "Copy or download it."], ar: ["الصق Markdown.", "اقرأ HTML على اليمين.", "انسخه أو نزّله."] },
    faq: { en: [["Is the output safe?", "Text is escaped and javascript: links are removed."], ["Which parts of Markdown work?", "Headings, bold, italic, code, fenced code, links, images, lists, quotes and rules. Tables are not supported yet."]], ar: [["هل الناتج آمن؟", "يُهرَّب النص وتُحذف روابط javascript:."], ["ما المدعوم من Markdown؟", "العناوين والخط العريض والمائل والأكواد والروابط والصور والقوائم والاقتباسات والخطوط. الجداول غير مدعومة بعد."]] },
  },
  "html-formatter": {
    steps: { en: ["Paste your HTML.", "Pick format or minify.", "Copy or download the result."], ar: ["الصق HTML.", "اختر ترتيباً أو تصغيراً.", "انسخ النتيجة أو نزّلها."] },
    faq: { en: [["Does it change my markup?", "No. It only changes whitespace and removes comments when minifying."], ["Does it handle inline scripts?", "They are kept as they are. For full code beautifying use a dedicated formatter."]], ar: [["هل يغيّر الكود؟", "لا. يغيّر المسافات فقط ويحذف التعليقات عند التصغير."], ["وماذا عن السكربتات؟", "تبقى كما هي. لتنسيق كامل استعمل أداة تنسيق متخصصة."]] },
  },
  "json-escape": {
    steps: { en: ["Paste your text.", "Pick escape or unescape.", "Copy the result."], ar: ["الصق النص.", "اختر تهريباً أو فكاً.", "انسخ النتيجة."] },
    faq: { en: [["What gets escaped?", "Quotes, backslashes, line breaks, tabs and control characters."], ["Are the outer quotes added?", "No. You get the inside of the string only."]], ar: [["ما الذي يُهرَّب؟", "علامات الاقتباس والشرطة المعكوسة والأسطر والتبويب والرموز التحكمية."], ["هل تُضاف علامات الاقتباس الخارجية؟", "لا. تحصل على داخل النص فقط."]] },
  },
  "json-to-typescript": {
    steps: { en: ["Paste a JSON sample.", "Set the root type name.", "Copy the interfaces."], ar: ["الصق عينة JSON.", "اكتب اسم النوع الجذر.", "انسخ الواجهات."] },
    faq: { en: [["How are optional keys found?", "A key missing from some objects in an array becomes optional with ?."], ["Is it exact?", "It infers from your sample only. Check it against the real API."]], ar: [["كيف تُكتشف المفاتيح الاختيارية؟", "المفتاح الغائب من بعض الكائنات في مصفوفة يصبح اختيارياً بعلامة ?."], ["هل هو دقيق؟", "يستنتج من العينة فقط. راجعه مع الواجهة الحقيقية."]] },
  },
  "csv-to-html-table": {
    steps: { en: ["Paste your CSV.", "Leave the separator on detect or pick one.", "Copy the table code."], ar: ["الصق CSV.", "اترك الفاصل على الاكتشاف أو اختره.", "انسخ كود الجدول."] },
    faq: { en: [["Is the first row the header?", "Yes. It becomes the th cells."], ["Are cells escaped?", "Yes, so special characters show as text."]], ar: [["هل الصف الأول هو العنوان؟", "نعم. يصبح خلايا th."], ["هل تُهرَّب الخلايا؟", "نعم، فتظهر الرموز الخاصة كنص."]] },
  },
  "csv-to-markdown": {
    steps: { en: ["Paste your CSV.", "Pick the separator or leave detect.", "Copy the Markdown."], ar: ["الصق CSV.", "اختر الفاصل أو اتركه على الاكتشاف.", "انسخ Markdown."] },
    faq: { en: [["What about pipes in cells?", "They are escaped with a backslash."], ["Where do I use it?", "GitHub, docs and any Markdown editor."]], ar: [["وماذا عن رمز | داخل الخلايا؟", "يُهرَّب بشرطة معكوسة."], ["أين أستخدمه؟", "في GitHub والتوثيق وأي محرر Markdown."]] },
  },
  "html-table-to-csv": {
    steps: { en: ["Paste HTML that has a table.", "Read the CSV on the right.", "Copy or download it."], ar: ["الصق HTML فيه جدول.", "اقرأ CSV على اليمين.", "انسخه أو نزّله."] },
    faq: { en: [["What if there are several tables?", "Each table is output in turn, separated by a blank line."], ["Are merged cells handled?", "Each cell is read once. Merged cells are not expanded."]], ar: [["وماذا لو وُجدت عدة جداول؟", "يُخرج كل جدول تباعاً بينها سطر فارغ."], ["هل تُعالج الخلايا المدمجة؟", "تُقرأ كل خلية مرة. الخلايا المدمجة لا تُفرد."]] },
  },
  "query-to-json": {
    steps: { en: ["Paste a URL or a query string.", "Read the JSON on the right.", "Copy it."], ar: ["الصق رابطاً أو سلسلة استعلام.", "اقرأ JSON على اليمين.", "انسخه."] },
    faq: { en: [["What about repeated keys?", "They become an array."], ["Are values decoded?", "Yes, percent codes and plus signs are decoded."]], ar: [["وماذا عن المفاتيح المكررة؟", "تصبح مصفوفة."], ["هل تُفك القيم؟", "نعم، تُفك رموز % والعلامة +."]] },
  },
  "json-to-query": {
    steps: { en: ["Paste a JSON object.", "Read the query string.", "Copy it."], ar: ["الصق كائن JSON.", "اقرأ سلسلة الاستعلام.", "انسخها."] },
    faq: { en: [["How are arrays written?", "As repeated keys, such as tag=a&tag=b."], ["Are values encoded?", "Yes, with percent encoding."]], ar: [["كيف تُكتب المصفوفات؟", "كمفاتيح مكررة مثل tag=a&tag=b."], ["هل تُرمَّز القيم؟", "نعم، بترميز النسبة المئوية."]] },
  },
  "xml-formatter": {
    steps: { en: ["Paste your XML.", "Pick format or minify.", "Copy the result."], ar: ["الصق XML.", "اختر ترتيباً أو تصغيراً.", "انسخ النتيجة."] },
    faq: { en: [["Does it check the XML?", "Yes. Broken XML shows an error instead of output."], ["Does it keep comments?", "Format keeps them. Minify removes them."]], ar: [["هل يتحقق من XML؟", "نعم. XML المعطوب يعرض خطأ بدل الناتج."], ["هل تبقى التعليقات؟", "الترتيب يبقيها والتصغير يحذفها."]] },
  },
  "css-formatter": {
    steps: { en: ["Paste your CSS.", "Pick format or minify.", "Copy the result."], ar: ["الصق CSS.", "اختر ترتيباً أو تصغيراً.", "انسخ النتيجة."] },
    faq: { en: [["Are comments removed?", "Yes, in both modes."], ["Does it handle nested rules?", "Basic nesting and media queries are indented. Very unusual CSS may need a full tool."]], ar: [["هل تُحذف التعليقات؟", "نعم، في الوضعين."], ["هل يعالج القواعد المتداخلة؟", "يرتّب التداخل البسيط وmedia queries. وCSS غير المعتاد قد يحتاج أداة كاملة."]] },
  },
  "json-sort-keys": {
    steps: { en: ["Paste your JSON.", "Read the sorted JSON.", "Copy it."], ar: ["الصق JSON.", "اقرأ JSON المرتب.", "انسخه."] },
    faq: { en: [["Are arrays reordered?", "No. Only object keys are sorted, at every level."], ["Why sort keys?", "It makes diffs and config files easier to compare."]], ar: [["هل تُعاد ترتيب المصفوفات؟", "لا. تُرتَّب مفاتيح الكائنات فقط في كل المستويات."], ["لماذا ترتيب المفاتيح؟", "يسهّل مقارنة الاختلافات وملفات الإعداد."]] },
  },
  "regex-tester": {
    steps: { en: ["Paste the text to search.", "Type the pattern and flags.", "Read each match, its position and groups."], ar: ["الصق النص المراد البحث فيه.", "اكتب النمط والخيارات.", "اقرأ كل تطابق وموضعه ومجموعاته."] },
    faq: { en: [["Which regex flavor is it?", "The JavaScript one, run in your browser."], ["Why do I always get all matches?", "The g flag is always added so every match is listed, up to 200."]], ar: [["أي نوع من Regex هذا؟", "نوع JavaScript، ويعمل داخل متصفحك."], ["لماذا أحصل دائماً على كل التطابقات؟", "يُضاف الخيار g دائماً لعرض كل التطابقات حتى 200."]] },
  },
  "sql-formatter": {
    steps: { en: ["Paste your SQL.", "Pick format or minify.", "Copy the result."], ar: ["الصق SQL.", "اختر ترتيباً أو تصغيراً.", "انسخ النتيجة."] },
    faq: { en: [["Are strings safe?", "Text inside quotes is left exactly as it is."], ["Which SQL does it support?", "Common SELECT, INSERT, UPDATE and DELETE. Very complex queries may need a full formatter."]], ar: [["هل النصوص آمنة؟", "النص داخل علامات الاقتباس يبقى كما هو."], ["أي SQL مدعوم؟", "SELECT وINSERT وUPDATE وDELETE الشائعة. والاستعلامات المعقدة جداً قد تحتاج أداة كاملة."]] },
  },
  "env-to-json": {
    steps: { en: ["Paste your .env text.", "Read the JSON.", "Copy it."], ar: ["الصق نص env.", "اقرأ JSON.", "انسخه."] },
    faq: { en: [["Are comments ignored?", "Yes, lines starting with # are skipped, and so are trailing comments on unquoted values."], ["Should I paste real secrets?", "Better not. Use sample values."]], ar: [["هل تُتجاهل التعليقات؟", "نعم، تُتخطى الأسطر التي تبدأ بـ # وكذلك التعليقات بعد القيم غير المقتبسة."], ["هل ألصق أسراراً حقيقية؟", "الأفضل لا. استعمل قيماً تجريبية."]] },
  },
  "json-to-env": {
    steps: { en: ["Paste a JSON object.", "Read the .env lines.", "Copy or download them."], ar: ["الصق كائن JSON.", "اقرأ أسطر env.", "انسخها أو نزّلها."] },
    faq: { en: [["How are nested keys named?", "They are joined with underscores and uppercased, so db.host becomes DB_HOST."], ["What about values with spaces?", "They are wrapped in quotes."]], ar: [["كيف تُسمّى المفاتيح المتداخلة؟", "تُجمع بشرطة سفلية وتُكتب بأحرف كبيرة، فيصبح db.host هو DB_HOST."], ["وماذا عن القيم ذات المسافات؟", "توضع بين علامات اقتباس."]] },
  },
  "ini-to-json": {
    steps: { en: ["Paste your INI text.", "Read the JSON.", "Copy it."], ar: ["الصق نص INI.", "اقرأ JSON.", "انسخه."] },
    faq: { en: [["How are sections handled?", "Each [section] becomes an object."], ["Are numbers and booleans detected?", "Yes. Quoted values stay as text."]], ar: [["كيف تُعالج الأقسام؟", "كل [section] يصبح كائناً."], ["هل تُكتشف الأرقام والقيم المنطقية؟", "نعم. والقيم المقتبسة تبقى نصاً."]] },
  },
  "url-parser": {
    steps: { en: ["Paste a full URL.", "Read each part.", "Copy what you need."], ar: ["الصق رابطاً كاملاً.", "اقرأ كل جزء.", "انسخ ما تحتاجه."] },
    faq: { en: [["Does it fetch the URL?", "No. It only splits the text. Nothing is opened."], ["What if the URL has no scheme?", "Add https:// in front. A scheme is needed to split it."]], ar: [["هل يفتح الرابط؟", "لا. يقسّم النص فقط ولا يفتح شيئاً."], ["وماذا لو لم يحوِ الرابط بروتوكولاً؟", "أضف https:// في أوله. يلزم بروتوكول للتقسيم."]] },
  },
  "html-to-markdown": {
    steps: { en: ["Paste your HTML.", "Read the Markdown.", "Copy or download it."], ar: ["الصق HTML.", "اقرأ Markdown.", "انسخه أو نزّله."] },
    faq: { en: [["Which tags are handled?", "Headings, paragraphs, bold, italic, code, links, images, lists, quotes and rules. Tables are not converted yet."], ["Are scripts removed?", "Yes. Script and style content is dropped."]], ar: [["ما الوسوم المدعومة؟", "العناوين والفقرات والعريض والمائل والأكواد والروابط والصور والقوائم والاقتباسات والخطوط. الجداول لا تُحوَّل بعد."], ["هل تُحذف السكربتات؟", "نعم. يُحذف محتوى script وstyle."]] },
  },
  "csv-to-yaml": {
    steps: { en: ["Paste your CSV with a header row.", "Read the YAML.", "Copy or download it."], ar: ["الصق CSV بصف عناوين.", "اقرأ YAML.", "انسخه أو نزّله."] },
    faq: { en: [["Is the separator detected?", "Yes. Comma, semicolon and tab are detected from the first line."], ["Are numbers kept as numbers?", "Values stay as text, so nothing is changed by guessing."]], ar: [["هل يُكتشف الفاصل؟", "نعم. تُكتشف الفاصلة والمنقوطة والتبويب من السطر الأول."], ["هل تبقى الأرقام أرقاماً؟", "تبقى القيم نصاً فلا يتغير شيء بالتخمين."]] },
  },
  "csv-to-xml": {
    steps: { en: ["Paste your CSV with a header row.", "Read the XML.", "Copy or download it."], ar: ["الصق CSV بصف عناوين.", "اقرأ XML.", "انسخه أو نزّله."] },
    faq: { en: [["What are the tag names?", "Headers become tag names. Characters XML does not allow become underscores."], ["What is the root tag?", "rows, with one row tag per record."]], ar: [["ما أسماء الوسوم؟", "العناوين تصبح أسماء الوسوم، والرموز غير المسموحة في XML تصبح شرطة سفلية."], ["ما الوسم الجذر؟", "rows، مع وسم row لكل سجل."]] },
  },
  "json-to-html-table": {
    steps: { en: ["Paste a JSON array of objects.", "Read the table code.", "Copy it."], ar: ["الصق مصفوفة JSON من الكائنات.", "اقرأ كود الجدول.", "انسخه."] },
    faq: { en: [["Are nested objects handled?", "They are flattened with dots, one column each."], ["Are values escaped?", "Yes, so special characters show as text."]], ar: [["هل تُعالج الكائنات المتداخلة؟", "تُسطَّح بنقاط، عمود لكل منها."], ["هل تُهرَّب القيم؟", "نعم، فتظهر الرموز الخاصة كنص."]] },
  },
  "text-to-binary": {
    steps: { en: ["Type or paste text.", "Read the binary bytes.", "Copy it."], ar: ["اكتب النص أو الصقه.", "اقرأ البايتات الثنائية.", "انسخها."] },
    faq: { en: [["Does it support Arabic and emoji?", "Yes. Text is encoded as UTF-8, so each character may use several bytes."], ["How are bytes shown?", "As groups of 8 digits separated by spaces."]], ar: [["هل يدعم العربية والرموز التعبيرية؟", "نعم. يُرمَّز النص بـ UTF-8 فقد يأخذ الحرف عدة بايتات."], ["كيف تظهر البايتات؟", "مجموعات من 8 أرقام تفصل بينها مسافات."]] },
  },
  "binary-to-text": {
    steps: { en: ["Paste binary in groups of 8.", "Read the text.", "Copy it."], ar: ["الصق الثنائي في مجموعات من 8.", "اقرأ النص.", "انسخه."] },
    faq: { en: [["Do spaces matter?", "No. Anything other than 0 and 1 is ignored, but the total must be a multiple of 8 digits."], ["Which encoding is read?", "UTF-8."]], ar: [["هل تهم المسافات؟", "لا. يُتجاهل كل ما عدا 0 و1، لكن يجب أن يكون العدد مضاعفاً للرقم 8."], ["أي ترميز يُقرأ؟", "UTF-8."]] },
  },
  "text-to-hex": {
    steps: { en: ["Type or paste text.", "Read the hex bytes.", "Copy them."], ar: ["اكتب النص أو الصقه.", "اقرأ البايتات الست عشرية.", "انسخها."] },
    faq: { en: [["Which encoding is used?", "UTF-8, so Arabic and emoji work."], ["Can I get capital letters?", "Yes, tick the uppercase option."]], ar: [["أي ترميز يُستخدم؟", "UTF-8 فتعمل العربية والرموز التعبيرية."], ["هل يمكن الحصول على أحرف كبيرة؟", "نعم، فعّل خيار الأحرف الكبيرة."]] },
  },
  "hex-to-text": {
    steps: { en: ["Paste hex bytes.", "Read the text.", "Copy it."], ar: ["الصق البايتات الست عشرية.", "اقرأ النص.", "انسخه."] },
    faq: { en: [["Which separators work?", "Spaces, commas, colons, dashes and 0x prefixes are all accepted."], ["Which encoding is read?", "UTF-8."]], ar: [["أي فواصل تعمل؟", "تُقبل المسافات والفواصل والنقطتان والشرطات والبادئة 0x."], ["أي ترميز يُقرأ؟", "UTF-8."]] },
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
    text: { en: [`Text Tools Online Free | ${SITE}`, 'Change text case, count words, compare two texts and clean lists in your browser.', 'Text tools'], ar: [`أدوات النصوص أونلاين مجاناً | ${SITE}`, 'غيّر حالة الحروف وعُدّ الكلمات وقارن نصين ونظّف القوائم داخل متصفحك.', 'أدوات النصوص'] },
    developer: { en: [`Developer Tools Online Free | ${SITE}`, 'Format JSON, encode Base64 and URLs, convert CSV to JSON and make SHA hashes in your browser.', 'Developer tools'], ar: [`أدوات المطورين أونلاين مجاناً | ${SITE}`, 'نسّق JSON وشفّر Base64 والروابط وحوّل CSV إلى JSON وأنشئ بصمات SHA داخل متصفحك.', 'أدوات المطورين'] },
    pricing: { en: [`Pricing and Plans | ${SITE}`, 'Free, Pro and Business plans: daily limits, file size and ads per plan.', 'Pricing'], ar: [`الأسعار والخطط | ${SITE}`, 'خطط مجانية وPro وBusiness: الحدود اليومية وحجم الملف والإعلانات لكل خطة.', 'الأسعار'] },
    about: { en: [`About ${SITE}`, 'Who builds Magic Convertor, how it works and how it is funded.', 'About'], ar: [`عن ${SITE}`, 'من يبني Magic Convertor وكيف يعمل وكيف يُموَّل.', 'عن الموقع'] },
    contact: { en: [`Contact | ${SITE}`, 'How to reach the owner of Magic Convertor for support, privacy or business questions.', 'Contact'], ar: [`تواصل معنا | ${SITE}`, 'كيف تتواصل مع صاحب Magic Convertor للدعم أو الخصوصية أو الأعمال.', 'تواصل'] },
    'legal/terms': { en: [`Terms of Service | ${SITE}`, 'Terms of use for Magic Convertor.', 'Terms of Service'], ar: [`شروط الخدمة | ${SITE}`, 'شروط استخدام Magic Convertor.', 'شروط الخدمة'] },
    'legal/privacy': { en: [`Privacy Policy | ${SITE}`, 'How Magic Convertor handles your data, cookies and advertising.', 'Privacy Policy'], ar: [`سياسة الخصوصية | ${SITE}`, 'كيف يتعامل Magic Convertor مع بياناتك وملفات الارتباط والإعلانات.', 'سياسة الخصوصية'] },
    'legal/refunds': { en: [`Refund Policy | ${SITE}`, 'Refund rules for paid plans.', 'Refund Policy'], ar: [`سياسة الاسترداد | ${SITE}`, 'قواعد الاسترداد للخطط المدفوعة.', 'سياسة الاسترداد'] },
  };
  const m = M[path]; if (!m) return null; const [title, description, h1] = m[l]; return { title, description, h1 };
};
