import { PDFDocument } from 'pdf-lib'; import fs from 'fs';
const d=await PDFDocument.create(); const p=d.addPage([400,400]); const f=d.getForm();
for (const [i,n] of ['Name','Email'].entries()) f.createTextField(n).addToPage(p,{x:50,y:300-i*40,width:200,height:20});
fs.writeFileSync('fixtures/form.pdf', await d.save());
