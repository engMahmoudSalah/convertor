import { Combine, Scissors, FileX, FilePlus2, RotateCw, ListOrdered, Stamp, Minimize2, Images, FileImage, FileText, ArrowUpDown, Tags, Repeat, Maximize, ImageDown } from 'lucide-react';
import type { Tool } from './types';
import * as P from './pdfTools';
import * as I from './imageTools';
import * as D from './docTools';
import { FileType, FileCode, FileOutput, FileType2 } from 'lucide-react';

const IMG = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml'];
const PDF = ['application/pdf'];
const pages = (label = 'Pages', def = 'all') => ({ key: 'pages', label: `${label} (e.g. 1-3,5,8-)`, type: 'text' as const, default: def });

export const TOOLS: Tool[] = [
  { id: 'merge-pdf', title: 'Merge PDF', desc: 'Combine several PDFs into one, in the order you choose', category: 'organize', icon: Combine, accept: PDF, multiple: true, minFiles: 2, run: P.merge },
  { id: 'split-pdf', title: 'Split PDF', desc: 'Cut a PDF by page ranges, every N pages or one file per page', category: 'organize', icon: Scissors, accept: PDF, multiple: false, run: P.split,
    options: [
      { key: 'mode', label: 'Split mode', type: 'select', default: 'ranges', options: [{ v: 'ranges', l: 'By ranges' }, { v: 'every', l: 'Every N pages' }, { v: 'each', l: 'Each page' }] },
      { key: 'ranges', label: 'Ranges, one file each (e.g. 1-3,4-6,7)', type: 'text', default: '1-1' },
      { key: 'every', label: 'N (for every N pages)', type: 'number', default: 2, min: 1 }] },
  { id: 'remove-pages', title: 'Remove pages', desc: 'Delete the pages you do not want', category: 'organize', icon: FileX, accept: PDF, multiple: false, run: P.removePages, options: [pages('Pages to remove', '1')] },
  { id: 'extract-pages', title: 'Extract pages', desc: 'Pull selected pages into a new PDF', category: 'organize', icon: FilePlus2, accept: PDF, multiple: false, run: P.extractPages, options: [pages('Pages to keep', '1')] },
  { id: 'reorder-pdf', title: 'Reorder pages', desc: 'Rearrange pages or reverse the document', category: 'organize', icon: ArrowUpDown, accept: PDF, multiple: false, run: P.reorder, options: [{ key: 'order', label: 'New order (e.g. 3,1,2 or "reverse")', type: 'text', default: 'reverse' }] },
  { id: 'rotate-pdf', title: 'Rotate PDF', desc: 'Rotate all or some pages', category: 'edit', icon: RotateCw, accept: PDF, multiple: false, run: P.rotate,
    options: [{ key: 'angle', label: 'Rotation', type: 'select', default: '90', options: [{ v: '90', l: '90° right' }, { v: '180', l: '180°' }, { v: '270', l: '90° left' }] }, pages('Pages')] },
  { id: 'page-numbers', title: 'Add page numbers', desc: 'Stamp numbers on every page', category: 'edit', icon: ListOrdered, accept: PDF, multiple: false, run: P.pageNumbers,
    options: [{ key: 'position', label: 'Position', type: 'select', default: 'bottom-center', options: ['bottom-center', 'bottom-right', 'bottom-left', 'top-center', 'top-right', 'top-left'].map((v) => ({ v, l: v.replace('-', ' ') })) },
      { key: 'format', label: 'Format', type: 'text', default: 'Page {n} of {total}' }, { key: 'start', label: 'Start at', type: 'number', default: 1, min: 0 }] },
  { id: 'watermark-pdf', title: 'Watermark', desc: 'Stamp diagonal text on every page', category: 'edit', icon: Stamp, accept: PDF, multiple: false, run: P.watermark,
    options: [{ key: 'text', label: 'Text', type: 'text', default: 'CONFIDENTIAL' }, { key: 'size', label: 'Font size', type: 'number', default: 60, min: 10, max: 200 }, { key: 'opacity', label: 'Opacity (0.05-1)', type: 'number', default: 0.25, min: 0.05, max: 1 }, { key: 'angle', label: 'Angle', type: 'number', default: 45, min: -90, max: 90 }] },
  { id: 'pdf-metadata', title: 'Edit metadata', desc: 'Set title, author, subject and keywords', category: 'edit', icon: Tags, accept: PDF, multiple: false, run: P.setMeta,
    options: ['title', 'author', 'subject', 'keywords'].map((k) => ({ key: k, label: k[0].toUpperCase() + k.slice(1), type: 'text' as const, default: '' })) },
  { id: 'compress-pdf', title: 'Compress PDF', desc: 'Shrink scanned or image-heavy PDFs', category: 'optimize', icon: Minimize2, accept: PDF, multiple: false, run: P.compress,
    options: [{ key: 'level', label: 'Compression', type: 'select', default: 'med', options: [{ v: 'low', l: 'Strong (smallest file)' }, { v: 'med', l: 'Balanced' }, { v: 'high', l: 'Light (best quality)' }] }] },
  { id: 'images-to-pdf', title: 'Images to PDF', desc: 'JPG, PNG, WebP, GIF, BMP or SVG into one PDF', category: 'to-pdf', icon: Images, accept: IMG, multiple: true, run: P.imagesToPdf,
    options: [{ key: 'size', label: 'Page size', type: 'select', default: 'a4', options: [{ v: 'a4', l: 'A4 portrait' }, { v: 'a4-landscape', l: 'A4 landscape' }, { v: 'fit', l: 'Same as image' }] }, { key: 'margin', label: 'Margin (pt)', type: 'number', default: 20, min: 0, max: 100 }] },
  { id: 'pdf-to-images', title: 'PDF to image', desc: 'Every page as PNG, JPG or WebP', category: 'from-pdf', icon: FileImage, accept: PDF, multiple: false, run: P.pdfToImages,
    options: [{ key: 'format', label: 'Format', type: 'select', default: 'jpg', options: [{ v: 'jpg', l: 'JPG' }, { v: 'png', l: 'PNG' }, { v: 'webp', l: 'WebP' }] }, { key: 'dpi', label: 'Resolution (DPI)', type: 'number', default: 150, min: 72, max: 300 }] },
  { id: 'pdf-to-text', title: 'PDF to text', desc: 'Extract the text layer of a PDF', category: 'from-pdf', icon: FileText, accept: PDF, multiple: false, run: P.pdfToText },
  { id: 'convert-image', title: 'Convert image', desc: 'PNG, JPG, WebP, BMP in any direction', category: 'image', icon: Repeat, accept: IMG, multiple: true, run: I.convertImages,
    options: [{ key: 'format', label: 'Convert to', type: 'select', default: 'png', options: ['png', 'jpg', 'webp', 'bmp'].map((v) => ({ v, l: v.toUpperCase() })) }, { key: 'quality', label: 'Quality (1-100)', type: 'number', default: 90, min: 1, max: 100 }] },
  { id: 'resize-image', title: 'Resize image', desc: 'By pixels or percent, keeps the ratio', category: 'image', icon: Maximize, accept: IMG, multiple: true, run: I.resizeImages,
    options: [{ key: 'mode', label: 'Mode', type: 'select', default: 'percent', options: [{ v: 'percent', l: 'Percent' }, { v: 'pixels', l: 'Pixels' }] }, { key: 'percent', label: 'Percent', type: 'number', default: 50, min: 1, max: 400 },
      { key: 'width', label: 'Width px', type: 'number', default: 0, min: 0 }, { key: 'height', label: 'Height px', type: 'number', default: 0, min: 0 }, { key: 'keep', label: 'Keep aspect ratio', type: 'check', default: true }] },
  { id: 'compress-image', title: 'Compress image', desc: 'Smaller JPG or WebP at the quality you pick', category: 'image', icon: ImageDown, accept: IMG, multiple: true, run: I.compressImages,
    options: [{ key: 'format', label: 'Output', type: 'select', default: 'jpg', options: [{ v: 'jpg', l: 'JPG' }, { v: 'webp', l: 'WebP' }, { v: 'keep', l: 'Keep PNG as PNG' }] }, { key: 'quality', label: 'Quality (1-100)', type: 'number', default: 70, min: 1, max: 100 }] },
];
const DOCX = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const TXT = ['text/plain', 'text/markdown', 'text/csv'];
const fs = { key: 'size', label: 'Font size', type: 'number' as const, default: 11, min: 6, max: 24 };
TOOLS.push(
  { id: 'text-to-pdf', title: 'Text to PDF', desc: 'Plain text files into paginated PDFs', category: 'doc', icon: FileType, accept: TXT, multiple: true, run: D.textToPdf, options: [fs] },
  { id: 'word-to-pdf', title: 'Word to PDF', desc: 'DOCX with headings and lists into PDF', category: 'doc', icon: FileType2, accept: DOCX, multiple: true, run: D.docxToPdf, options: [fs] },
  { id: 'word-to-text', title: 'Word to text', desc: 'Extract plain text from DOCX', category: 'doc', icon: FileText, accept: DOCX, multiple: true, run: D.docxToText },
  { id: 'word-to-html', title: 'Word to HTML', desc: 'Clean HTML from a DOCX', category: 'doc', icon: FileCode, accept: DOCX, multiple: true, run: D.docxToHtml },
  { id: 'pdf-to-word', title: 'PDF to Word', desc: 'Text of a PDF into an editable DOCX', category: 'doc', icon: FileOutput, accept: PDF, multiple: false, run: D.pdfToDocx },
);
/** Which type page each tool shows on. */
export const TYPES: Record<string, { title: string; desc: string; cats: string[]; ids?: string[] }> = {
  pdf: { title: 'PDF tools', desc: 'Organize, optimize, edit and convert PDFs', cats: ['organize', 'optimize', 'edit', 'from-pdf'], ids: ['images-to-pdf'] },
  images: { title: 'Image tools', desc: 'Convert, resize and compress images in PNG, JPG, WebP, BMP and more', cats: ['image'], ids: ['images-to-pdf', 'pdf-to-images'] },
  documents: { title: 'Document tools', desc: 'Word and text files to and from PDF', cats: ['doc'], ids: ['pdf-to-text'] },
};
export const toolsOfType = (k: string) => TOOLS.filter((t) => TYPES[k].cats.includes(t.category) || TYPES[k].ids?.includes(t.id));
export const CATS: Record<string, string> = { organize: 'Organize PDF', optimize: 'Optimize PDF', 'to-pdf': 'Convert to PDF', 'from-pdf': 'Convert from PDF', edit: 'Edit PDF', image: 'Images', doc: 'Documents' };
export const getTool = (id?: string) => TOOLS.find((t) => t.id === id);
