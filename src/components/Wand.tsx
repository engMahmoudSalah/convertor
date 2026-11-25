import React from 'react';
/** Own-drawn magic wand. Colours follow the active identity via --logo. */
const WAND = (c: string, band: string) => `<path d="M6 25.5 L24.5 7.5 L26 9 L9 27.2 Q6.6 28.6 5.2 27 Q4 25.6 6 25.5Z" fill="${c}"/><path d="M13.2 19.6 L16.6 22.4" stroke="${band}" stroke-width="2.4" stroke-linecap="round"/><path d="M26 2.5 L27.3 6 L30.8 7.3 L27.3 8.6 L26 12.1 L24.7 8.6 L21.2 7.3 L24.7 6Z" fill="${c}"/><path d="M12 5 L12.8 7.2 L15 8 L12.8 8.8 L12 11 L11.2 8.8 L9 8 L11.2 7.2Z" fill="${c}"/><circle cx="29" cy="17.5" r="1.1" fill="${c}"/><circle cx="19" cy="3.6" r="1" fill="${c}"/>`;
export const Wand: React.FC<{ className?: string; role?: 'img'; label?: string }> = ({ className, role, label }) => (
  <svg className={className} viewBox="0 0 32 32" {...(role ? { role, 'aria-label': label } : { 'aria-hidden': true })} dangerouslySetInnerHTML={{ __html: WAND('var(--logo)', 'var(--logo-band)') }} />);
export const wandFavicon = (c: string, band: string) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${WAND(c, band)}</svg>`);
