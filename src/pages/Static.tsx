import React from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../lib/i18n';
const Wrap: React.FC<{ kicker: string; title: string; children: React.ReactNode }> = ({ kicker, title, children }) => (
  <div className="pt-28 pb-12 max-w-3xl mx-auto px-4"><p className="ed-kicker mb-4">{kicker}</p><h1 className="ed-h1 !text-5xl mb-8 pb-6 border-b-2 border-current">{title}</h1><div className="space-y-4 leading-relaxed">{children}</div></div>);
export const About: React.FC = () => { const { lang } = useT(); const ar = lang === 'ar'; return (
  <Wrap kicker={ar ? 'عن الموقع' : 'About'} title={ar ? 'عن Magic Convertor' : 'About Magic Convertor'}>
    {ar ? <>
      <p>Magic Convertor مجموعة أدوات ملفات على الإنترنت: دمج وتقسيم وضغط وتحويل PDF، وأدوات للصور والمستندات والتعرف على النصوص.</p>
      <p>يبنيه ويديره محمود صلاح، مهندس برمجيات. معظم الأدوات تعمل داخل متصفحك، لذلك ملفاتك لا تُرفع إلى خوادمنا.</p>
      <p>الموقع مجاني للاستخدام الأساسي. يُموَّل بإعلانات في الخطة المجانية وبالاشتراكات المدفوعة التي تقلل الإعلانات أو تلغيها وتزيد الحدود اليومية. راجع <Link className="underline" to="/pricing">الأسعار</Link> و<Link className="underline" to="/legal/privacy">سياسة الخصوصية</Link>.</p></> : <>
      <p>Magic Convertor is a set of online file tools: merge, split, compress and convert PDFs, plus tools for images, documents and OCR.</p>
      <p>It is built and run by Mahmoud Salah, a software engineer. Most tools run inside your browser, so your files are not uploaded to our servers.</p>
      <p>Basic use is free. The site is funded by ads on the free plan and by paid plans that show fewer ads or none and raise the daily limits. See <Link className="underline" to="/pricing">Pricing</Link> and the <Link className="underline" to="/legal/privacy">Privacy Policy</Link>.</p></>}
  </Wrap>); };
export const Contact: React.FC = () => { const { lang } = useT(); const ar = lang === 'ar'; return (
  <Wrap kicker={ar ? 'تواصل' : 'Contact'} title={ar ? 'تواصل معنا' : 'Contact'}>
    <p>{ar ? 'للدعم أو الخصوصية أو حذف حسابك أو الأعمال، تواصل مع محمود صلاح عبر:' : 'For support, privacy requests, account deletion or business questions, reach Mahmoud Salah through:'}</p>
    <ul className="list-disc ps-6"><li><a className="underline" rel="noopener noreferrer" target="_blank" href="https://www.linkedin.com/in/mahmod-salah">LinkedIn</a></li><li><a className="underline" rel="noopener noreferrer" target="_blank" href="https://github.com/engMahmoudSalah">GitHub</a></li><li><a className="underline" rel="noopener noreferrer" target="_blank" href="https://md.mahmodsalah.workers.dev/">{ar ? 'الموقع الشخصي' : 'Portfolio'}</a></li></ul>
    <p>{ar ? 'يمكنك أيضاً حذف حسابك بنفسك من صفحة الحساب.' : 'You can also delete your account yourself from the Account page.'}</p>
  </Wrap>); };
