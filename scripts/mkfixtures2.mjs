import fs from 'fs'; import * as XLSX from 'xlsx'; import PptxGenJS from 'pptxgenjs'; import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';
const ws = XLSX.utils.aoa_to_sheet([['Name', 'Qty'], ['Apple', 3], ['Pear', 5]]); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Stock');
fs.writeFileSync('fixtures/stock.xlsx', XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
const p = new PptxGenJS(); p.addSlide().addText('Launch Plan', { x: 1, y: 1, fontSize: 32 }); p.addSlide().addText('Second slide text', { x: 1, y: 1 });
fs.writeFileSync('fixtures/deck.pptx', Buffer.from(await p.write({ outputType: 'nodebuffer' })));
fs.writeFileSync('fixtures/locked.pdf', await encryptPDF(new Uint8Array(fs.readFileSync('fixtures/three.pdf')), 'secret123', { ownerPassword: 'secret123' }));
fs.writeFileSync('fixtures/broken.pdf', fs.readFileSync('fixtures/three.pdf').subarray(0, fs.statSync('fixtures/three.pdf').size - 0).toString('latin1').replace('startxref', 'startxrex'), 'latin1');
