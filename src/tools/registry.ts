import { Combine, Scissors, FileX, FilePlus2, RotateCw, ListOrdered, Stamp, Minimize2, Images, FileImage, FileText, ArrowUpDown, Tags, Repeat, Maximize, ImageDown } from 'lucide-react';
import type { Tool } from './types';
import { Lock, Unlock, Wrench, Crop, PenLine, EyeOff, GitCompare, FileCode2, Sheet, Presentation, FileSpreadsheet } from 'lucide-react';
import { FileType, FileCode, FileOutput, FileType2 } from 'lucide-react';

const loaders: Record<string, () => Promise<any>> = { P: () => import('./pdfTools'), I: () => import('./imageTools'), D: () => import('./docTools'), O: () => import('./ocrTools'), M: () => import('./moreTools') };
const L = (m: string, fn: string) => async (...a: any[]) => (await loaders[m]())[fn](...a);
const IMG = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml'];
const PDF = ['application/pdf'];
export const pagesOpt = (label = 'Pages', def = 'all') => ({ key: 'pages', label: `${label} (e.g. 1-3,5,8-)`, type: 'text' as const, default: def });

export const TOOLS: Tool[] = [
  { id: 'merge-pdf', title: 'Merge PDF', desc: 'Combine several PDFs into one, in the order you choose', category: 'organize', icon: Combine, accept: PDF, multiple: true, minFiles: 2, run: L('P', 'merge') },
  { id: 'split-pdf', title: 'Split PDF', desc: 'Cut a PDF by page ranges, every N pages or one file per page', category: 'organize', icon: Scissors, accept: PDF, multiple: false, run: L('P', 'split'),
    options: [
      { key: 'mode', label: 'Split mode', type: 'select', default: 'ranges', options: [{ v: 'ranges', l: 'By ranges' }, { v: 'every', l: 'Every N pages' }, { v: 'each', l: 'Each page' }] },
      { key: 'ranges', label: 'Ranges, one file each (e.g. 1-3,4-6,7)', type: 'text', default: '1-1' },
      { key: 'every', label: 'N (for every N pages)', type: 'number', default: 2, min: 1 }] },
  { id: 'remove-pages', title: 'Remove pages', desc: 'Delete the pages you do not want', category: 'organize', icon: FileX, accept: PDF, multiple: false, run: L('P', 'removePages'), options: [pagesOpt('Pages to remove', '1')] },
  { id: 'extract-pages', title: 'Extract pages', desc: 'Pull selected pages into a new PDF', category: 'organize', icon: FilePlus2, accept: PDF, multiple: false, run: L('P', 'extractPages'), options: [pagesOpt('Pages to keep', '1')] },
  { id: 'reorder-pdf', title: 'Reorder pages', desc: 'Rearrange pages or reverse the document', category: 'organize', icon: ArrowUpDown, accept: PDF, multiple: false, run: L('P', 'reorder'), options: [{ key: 'order', label: 'New order (e.g. 3,1,2 or "reverse")', type: 'text', default: 'reverse' }] },
  { id: 'rotate-pdf', title: 'Rotate PDF', desc: 'Rotate all or some pages', category: 'edit', icon: RotateCw, accept: PDF, multiple: false, run: L('P', 'rotate'),
    options: [{ key: 'angle', label: 'Rotation', type: 'select', default: '90', options: [{ v: '90', l: '90° right' }, { v: '180', l: '180°' }, { v: '270', l: '90° left' }] }, pagesOpt('Pages')] },
  { id: 'page-numbers', title: 'Add page numbers', desc: 'Stamp numbers on every page', category: 'edit', icon: ListOrdered, accept: PDF, multiple: false, run: L('P', 'pageNumbers'),
    options: [{ key: 'position', label: 'Position', type: 'select', default: 'bottom-center', options: ['bottom-center', 'bottom-right', 'bottom-left', 'top-center', 'top-right', 'top-left'].map((v) => ({ v, l: v.replace('-', ' ') })) },
      { key: 'format', label: 'Format', type: 'text', default: 'Page {n} of {total}' }, { key: 'start', label: 'Start at', type: 'number', default: 1, min: 0 }] },
  { id: 'watermark-pdf', title: 'Watermark', desc: 'Stamp diagonal text on every page', category: 'edit', icon: Stamp, accept: PDF, multiple: false, run: L('P', 'watermark'),
    options: [{ key: 'text', label: 'Text', type: 'text', default: 'CONFIDENTIAL' }, { key: 'size', label: 'Font size', type: 'number', default: 60, min: 10, max: 200 }, { key: 'opacity', label: 'Opacity (0.05-1)', type: 'number', default: 0.25, min: 0.05, max: 1 }, { key: 'angle', label: 'Angle', type: 'number', default: 45, min: -90, max: 90 }] },
  { id: 'pdf-metadata', title: 'Edit metadata', desc: 'Set title, author, subject and keywords', category: 'edit', icon: Tags, accept: PDF, multiple: false, run: L('P', 'setMeta'),
    options: ['title', 'author', 'subject', 'keywords'].map((k) => ({ key: k, label: k[0].toUpperCase() + k.slice(1), type: 'text' as const, default: '' })) },
  { id: 'compress-pdf', title: 'Compress PDF', desc: 'Shrink scanned or image-heavy PDFs', category: 'optimize', icon: Minimize2, accept: PDF, multiple: false, run: L('P', 'compress'),
    options: [{ key: 'level', label: 'Compression', type: 'select', default: 'med', options: [{ v: 'low', l: 'Strong (smallest file)' }, { v: 'med', l: 'Balanced' }, { v: 'high', l: 'Light (best quality)' }] }] },
  { id: 'images-to-pdf', title: 'Images to PDF', desc: 'JPG, PNG, WebP, GIF, BMP or SVG into one PDF', category: 'to-pdf', icon: Images, accept: IMG, multiple: true, run: L('P', 'imagesToPdf'),
    options: [{ key: 'size', label: 'Page size', type: 'select', default: 'a4', options: [{ v: 'a4', l: 'A4 portrait' }, { v: 'a4-landscape', l: 'A4 landscape' }, { v: 'fit', l: 'Same as image' }] }, { key: 'margin', label: 'Margin (pt)', type: 'number', default: 20, min: 0, max: 100 }] },
  { id: 'pdf-to-images', title: 'PDF to image', desc: 'Every page as PNG, JPG or WebP', category: 'from-pdf', icon: FileImage, accept: PDF, multiple: false, run: L('P', 'pdfToImages'),
    options: [{ key: 'format', label: 'Format', type: 'select', default: 'jpg', options: [{ v: 'jpg', l: 'JPG' }, { v: 'png', l: 'PNG' }, { v: 'webp', l: 'WebP' }] }, { key: 'dpi', label: 'Resolution (DPI)', type: 'number', default: 150, min: 72, max: 300 }] },
  { id: 'pdf-to-text', title: 'PDF to text', desc: 'Extract the text layer of a PDF', category: 'from-pdf', icon: FileText, accept: PDF, multiple: false, run: L('P', 'pdfToText') },
  { id: 'convert-image', title: 'Convert image', desc: 'PNG, JPG, WebP, BMP in any direction', category: 'image', icon: Repeat, accept: IMG, multiple: true, run: L('I', 'convertImages'),
    options: [{ key: 'format', label: 'Convert to', type: 'select', default: 'png', options: ['png', 'jpg', 'webp', 'bmp'].map((v) => ({ v, l: v.toUpperCase() })) }, { key: 'quality', label: 'Quality (1-100)', type: 'number', default: 90, min: 1, max: 100 }] },
  { id: 'image-background', title: 'Background', desc: 'Remove a solid background, fill with a colour or place on your own image', category: 'image', icon: Maximize, accept: IMG, multiple: true, run: L('I', 'backgroundImages'),
    options: [{ key: 'mode', label: 'Mode', type: 'select', default: 'remove', options: [{ v: 'remove', l: 'Remove background (transparent PNG)' }, { v: 'color', l: 'Fill with colour' }, { v: 'image', l: 'Place on an image' }] },
      { key: 'tol', label: 'Removal strength (0-100)', type: 'number', default: 30, min: 1, max: 100 }, { key: 'removeOld', label: 'Remove the old background first', type: 'check', default: true },
      { key: 'color', label: 'Background colour', type: 'color', default: '#ffffff' }, { key: 'bgfile', label: 'Background image', type: 'file', default: null },
      { key: 'format', label: 'Output', type: 'select', default: 'png', options: [{ v: 'png', l: 'PNG' }, { v: 'jpg', l: 'JPG' }, { v: 'webp', l: 'WebP' }] }] },
  { id: 'resize-image', title: 'Resize image', desc: 'By pixels or percent, keeps the ratio', category: 'image', icon: Maximize, accept: IMG, multiple: true, run: L('I', 'resizeImages'),
    options: [{ key: 'mode', label: 'Mode', type: 'select', default: 'percent', options: [{ v: 'percent', l: 'Percent' }, { v: 'pixels', l: 'Pixels' }] }, { key: 'percent', label: 'Percent', type: 'number', default: 50, min: 1, max: 400 },
      { key: 'width', label: 'Width px', type: 'number', default: 0, min: 0 }, { key: 'height', label: 'Height px', type: 'number', default: 0, min: 0 }, { key: 'keep', label: 'Keep aspect ratio', type: 'check', default: true }] },
  { id: 'compress-image', title: 'Compress image', desc: 'Smaller JPG or WebP at the quality you pick', category: 'image', icon: ImageDown, accept: IMG, multiple: true, run: L('I', 'compressImages'),
    options: [{ key: 'format', label: 'Output', type: 'select', default: 'jpg', options: [{ v: 'jpg', l: 'JPG' }, { v: 'webp', l: 'WebP' }, { v: 'keep', l: 'Keep PNG as PNG' }] }, { key: 'quality', label: 'Quality (1-100)', type: 'number', default: 70, min: 1, max: 100 }] },
];
const DOCX = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const TXT = ['text/plain', 'text/markdown', 'text/csv'];
const fs = { key: 'size', label: 'Font size', type: 'number' as const, default: 11, min: 6, max: 24 };
TOOLS.push(
  { id: 'text-to-pdf', title: 'Text to PDF', desc: 'Plain text files into paginated PDFs', category: 'doc', icon: FileType, accept: TXT, multiple: true, run: L('D', 'textToPdf'), options: [fs] },
  { id: 'word-to-pdf', title: 'Word to PDF', desc: 'DOCX with headings and lists into PDF', category: 'doc', icon: FileType2, accept: DOCX, multiple: true, run: L('D', 'docxToPdf'), options: [fs] },
  { id: 'word-to-text', title: 'Word to text', desc: 'Extract plain text from DOCX', category: 'doc', icon: FileText, accept: DOCX, multiple: true, run: L('D', 'docxToText') },
  { id: 'word-to-html', title: 'Word to HTML', desc: 'Clean HTML from a DOCX', category: 'doc', icon: FileCode, accept: DOCX, multiple: true, run: L('D', 'docxToHtml') },
  { id: 'pdf-to-word', title: 'PDF to Word', desc: 'Text of a PDF into an editable DOCX', category: 'doc', icon: FileOutput, accept: PDF, multiple: false, run: L('D', 'pdfToDocx') },
);
const XLS = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
const PPT = ['application/vnd.openxmlformats-officedocument.presentationml.presentation'];
const lang = { key: 'lang', label: 'Language', type: 'select' as const, default: 'eng', options: [{ v: 'eng', l: 'English' }, { v: 'ara', l: 'Arabic' }, { v: 'eng+ara', l: 'English + Arabic' }] };
TOOLS.push(
  { id: 'ocr-image', title: 'OCR image', desc: 'Read text from photos and screenshots (English, Arabic)', category: 'image', icon: FileText, accept: IMG, multiple: true, run: L('O', 'ocrImage'), options: [lang] },
  { id: 'ocr-pdf', title: 'OCR PDF', desc: 'Make scanned PDFs searchable and extract their text', category: 'optimize', icon: FileText, accept: PDF, multiple: false, run: L('O', 'ocrPdf'), options: [lang, { key: 'layer', label: 'Create searchable PDF', type: 'check', default: true }] },
  { id: 'scan-to-pdf', title: 'Scan to PDF', desc: 'Photograph pages and turn them into a clean PDF', category: 'to-pdf', icon: Images, accept: IMG, multiple: true, run: L('O', 'scanToPdf'), options: [{ key: 'filter', label: 'Scan look', type: 'select', default: 'document', options: [{ v: 'document', l: 'Black and white document' }, { v: 'gray', l: 'Grayscale' }, { v: 'original', l: 'Original colours' }] }] },
  { id: 'protect-pdf', title: 'Protect PDF', desc: 'Lock a PDF with a password (RC4 128-bit)', category: 'security', icon: Lock, accept: PDF, multiple: false, run: L('M', 'protect'),
    options: [{ key: 'password', label: 'Password', type: 'text', default: '' }, { key: 'print', label: 'Allow printing', type: 'check', default: true }, { key: 'copy', label: 'Allow copying text', type: 'check', default: false }] },
  { id: 'unlock-pdf', title: 'Unlock PDF', desc: 'Remove the password from a PDF you own', category: 'security', icon: Unlock, accept: PDF, multiple: false, run: L('M', 'unlock'), options: [{ key: 'password', label: 'Password (if you know it)', type: 'text', default: '' }] },
  { id: 'sign-pdf', title: 'Sign PDF', desc: 'Add a typed signature with date', category: 'security', icon: PenLine, accept: PDF, multiple: false, run: L('M', 'sign'),
    options: [{ key: 'name', label: 'Your name', type: 'text', default: '' }, pagesOpt('Pages', '1'), { key: 'position', label: 'Position', type: 'select', default: 'right', options: [{ v: 'left', l: 'Left' }, { v: 'center', l: 'Center' }, { v: 'right', l: 'Right' }] }, { key: 'y', label: 'Height from bottom (pt)', type: 'number', default: 80, min: 20, max: 800 }, { key: 'date', label: 'Add date', type: 'check', default: true }] },
  { id: 'redact-pdf', title: 'Redact PDF', desc: 'Permanently black out words and phrases', category: 'security', icon: EyeOff, accept: PDF, multiple: false, run: L('M', 'redact'), options: [{ key: 'terms', label: 'Words to remove (comma separated)', type: 'text', default: '' }] },
  { id: 'compare-pdf', title: 'Compare PDF', desc: 'See added and removed lines between two PDFs', category: 'security', icon: GitCompare, accept: PDF, multiple: true, minFiles: 2, run: L('M', 'compare') },
  { id: 'repair-pdf', title: 'Repair PDF', desc: 'Recover pages from a damaged PDF', category: 'optimize', icon: Wrench, accept: PDF, multiple: false, run: L('M', 'repair') },
  { id: 'crop-pdf', title: 'Crop PDF', desc: 'Trim page margins', category: 'edit', icon: Crop, accept: PDF, multiple: false, run: L('M', 'crop'),
    options: [pagesOpt('Pages'), ...['top', 'bottom', 'left', 'right'].map((k) => ({ key: k, label: `${k[0].toUpperCase() + k.slice(1)} margin (pt)`, type: 'number' as const, default: 20, min: 0, max: 800 }))] },
  { id: 'pdf-to-markdown', title: 'PDF to Markdown', desc: 'Text with headings, ready for notes and docs', category: 'from-pdf', icon: FileCode2, accept: PDF, multiple: false, run: L('M', 'pdfToMarkdown') },
  { id: 'pdf-to-excel', title: 'PDF to Excel', desc: 'Tables and text into an XLSX, one sheet per page', category: 'from-pdf', icon: FileSpreadsheet, accept: PDF, multiple: false, run: L('M', 'pdfToExcel') },
  { id: 'pdf-to-powerpoint', title: 'PDF to PowerPoint', desc: 'Every page as a slide', category: 'from-pdf', icon: Presentation, accept: PDF, multiple: false, run: L('M', 'pdfToPptx') },
  { id: 'excel-to-pdf', title: 'Excel to PDF', desc: 'XLSX, XLS or CSV sheets into PDF tables', category: 'to-pdf', icon: Sheet, accept: XLS, multiple: true, run: L('M', 'excelToPdf') },
  { id: 'powerpoint-to-pdf', title: 'PowerPoint to PDF', desc: 'PPTX slides into PDF pages', category: 'to-pdf', icon: Presentation, accept: PPT, multiple: true, run: L('M', 'pptxToPdf') },
);
/** Which type page each tool shows on. */
export const TYPES: Record<string, { title: string; desc: string; cats: string[]; ids?: string[] }> = {
  pdf: { title: 'PDF tools', desc: 'Organize, optimize, edit and convert PDFs', cats: ['organize', 'optimize', 'edit', 'from-pdf', 'security'], ids: ['images-to-pdf'] },
  images: { title: 'Image tools', desc: 'Convert, resize and compress images in PNG, JPG, WebP, BMP and more', cats: ['image'], ids: ['images-to-pdf', 'pdf-to-images'] },
  documents: { title: 'Document tools', desc: 'Word and text files to and from PDF', cats: ['doc'], ids: ['pdf-to-text', 'pdf-to-excel', 'pdf-to-powerpoint', 'excel-to-pdf', 'powerpoint-to-pdf', 'pdf-to-markdown', 'ocr-pdf', 'scan-to-pdf'] },
};
export const toolsOfType = (k: string) => TOOLS.filter((t) => TYPES[k].cats.includes(t.category) || TYPES[k].ids?.includes(t.id));
export const CATS: Record<string, string> = { organize: 'Organize PDF', optimize: 'Optimize PDF', 'to-pdf': 'Convert to PDF', 'from-pdf': 'Convert from PDF', edit: 'Edit PDF', image: 'Images', doc: 'Documents', security: 'PDF Security' };
export const getTool = (id?: string) => TOOLS.find((t) => t.id === id);
