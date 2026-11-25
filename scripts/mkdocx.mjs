import { Document, Packer, Paragraph, HeadingLevel } from 'docx'; import fs from 'fs';
const d = new Document({ sections: [{ children: [new Paragraph({ text: 'Quarterly Report', heading: HeadingLevel.HEADING_1 }), new Paragraph('Hello from Magic Convertor docx fixture.'), new Paragraph('Second paragraph.')] }] });
fs.writeFileSync('fixtures/sample.docx', await Packer.toBuffer(d)); fs.writeFileSync('fixtures/note.txt', 'Line one\nLine two\nLine three\n');
