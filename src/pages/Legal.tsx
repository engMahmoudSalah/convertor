import React from 'react';
import { useParams, Link } from 'react-router-dom';
const DOCS: Record<string, { title: string; body: string[] }> = {
  terms: { title: 'Terms of Service', body: [
    'Magic Convertor is a set of online file tools provided by Mahmoud Salah ("we"). By using the site you agree to these terms.',
    'You may use the tools for lawful purposes and only with files you own or have the right to process. You must not misuse the service, attempt to break its limits, or use it to process unlawful content.',
    'Most tools run inside your browser, so your files stay on your device. Accounts, plans and usage limits are handled by our servers. We may change limits, plans and prices; paid plans renew until cancelled.',
    'The service is provided as is, without warranty. Always keep a copy of your original files. To the extent allowed by law, we are not liable for loss caused by use of the tools.',
    'Questions: contact the site owner through the links in the footer.'] },
  privacy: { title: 'Privacy Policy', body: [
    'Files you process with client-side tools are not uploaded to our servers.',
    'If you create an account we store your email, name, a salted password hash, your plan, daily usage counters and, on paid plans, a history of the tools you used (tool name, file count and size, never file contents).',
    'We use a session cookie to keep you signed in. We do not sell personal data. Payment details are handled by our payment provider and never stored by us.',
    'Advertising: free and guest plans may show ads served by Google AdSense (when enabled). Google and its partners may use cookies to serve ads. Unless you choose "Accept all" in the cookie banner, ads are non-personalised. You can change your choice by clearing this site\'s local storage, or opt out of personalised ads at adssettings.google.com. Paid Business plans show no ads.',
    'Cookies and local storage: a session cookie (sign-in), and local settings for language, theme and your cookie choice. We do not use other tracking cookies.',
    'You can ask us to delete your account and data at any time.'] },
  refunds: { title: 'Refund Policy', body: [
    'Paid plans can be cancelled at any time; access continues until the end of the paid period.',
    'If you are unhappy with a new subscription, ask for a refund within 14 days of the first payment and we will refund it. Renewals are refundable within 7 days if the service was not used.',
    'Refunds go back to the original payment method through our payment provider.'] },
};
export const Legal: React.FC = () => { const { doc } = useParams(); const d = DOCS[doc ?? ''];
  if (!d) return <div className="pt-28 text-center">Page not found. <Link className="text-violet-300" to="/">Home</Link></div>;
  return (<div className="pt-28 pb-12 max-w-3xl mx-auto px-4"><p className="ed-kicker mb-4">Legal</p><h1 className="ed-h1 !text-5xl mb-8 pb-6 border-b-2 border-current">{d.title}</h1>{d.body.map((p, i) => <div key={i} className="grid grid-cols-[3rem_1fr] gap-3 mb-6"><span className="font-display italic text-3xl text-[color:var(--ac)] leading-none pt-1">{i + 1}.</span><p className="text-gray-300 leading-relaxed text-[17px]">{p}</p></div>)}
    <p className="text-xs text-gray-500 mt-8">Last updated: 25 November 2026 · <Link className="text-violet-300" to="/legal/terms">Terms</Link> · <Link className="text-violet-300" to="/legal/privacy">Privacy</Link> · <Link className="text-violet-300" to="/legal/refunds">Refunds</Link></p></div>); };
