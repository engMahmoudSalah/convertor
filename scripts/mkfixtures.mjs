import { PDFDocument, StandardFonts } from 'pdf-lib'; import fs from 'fs'; import zlib from 'zlib';
const mk = async (n, t) => { const d = await PDFDocument.create(); const f = await d.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= n; i++) d.addPage([400, 300]).drawText(`${t} page ${i}`, { x: 40, y: 150, size: 24, font: f }); fs.writeFileSync(`fixtures/${t}.pdf`, await d.save()); };
await mk(5, 'five'); await mk(3, 'three');
// minimal PNG 64x64 gradient
const w=64,h=64; const raw=Buffer.alloc((w*4+1)*h); for(let y=0;y<h;y++){raw[y*(w*4+1)]=0;for(let x=0;x<w;x++){const o=y*(w*4+1)+1+x*4;raw[o]=x*4;raw[o+1]=y*4;raw[o+2]=128;raw[o+3]=255;}}
const crcT=[...Array(256)].map((_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0});
const crc=b=>{let c=~0;for(const x of b)c=crcT[(c^x)&255]^(c>>>8);return ~c>>>0};
const ch=(t,d)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(t),d]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([l,td,c])};
const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;
fs.writeFileSync('fixtures/grad.png',Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),ch('IHDR',ih),ch('IDAT',zlib.deflateSync(raw)),ch('IEND',Buffer.alloc(0))]));
