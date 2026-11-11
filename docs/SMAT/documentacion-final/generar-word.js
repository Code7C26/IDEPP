// Convierte secciones-toro.md en secciones-toro.docx con formato APA 7 (Times New Roman 12, interlineado
// doble, márgenes de 2,54 cm, número de página arriba a la derecha) e inserta las capturas como figuras.
//
// La librería "docx" no es una dependencia del proyecto: se instala aparte, en una carpeta temporal.
// Uso, en PowerShell, desde esta carpeta:
//     npm install --prefix $env:TEMP\docx-word docx@9.5.0
//     $env:NODE_PATH = "$env:TEMP\docx-word\node_modules"; node generar-word.js
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType, ImageRun, Header, PageNumber, LevelFormat,
} = require('docx');

const origen = path.join(__dirname, 'secciones-toro.md');
const carpetaCapturas = path.join(__dirname, 'capturas');
const destino = process.argv[2] || path.join(__dirname, 'secciones-toro.docx');
const md = fs.readFileSync(origen, 'utf8').replace(/\r\n/g, '\n');

const FUENTE = 'Times New Roman';
const ANCHO_TEXTO = 9026; // A4 (11906) menos 2 márgenes de 1440 DXA

// Texto con **negrita** y `código`; [COMPLETAR] resaltado en amarillo para que no se pase por alto
function corridas(texto, base = {}) {
  const partes = texto.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  const salida = [];
  for (const p of partes) {
    let t = p, extra = {};
    if (p.startsWith('**') && p.endsWith('**')) { t = p.slice(2, -2); extra = { bold: true }; }
    else if (p.startsWith('`') && p.endsWith('`')) { t = p.slice(1, -1); extra = { font: 'Consolas', size: 20 }; }
    t.split(/(\[COMPLETAR\])/g).filter(Boolean).forEach((trozo) => {
      salida.push(new TextRun({ text: trozo, font: FUENTE, size: 24, ...base, ...extra,
        ...(trozo === '[COMPLETAR]' ? { highlight: 'yellow', bold: true } : {}) }));
    });
  }
  return salida;
}

function parrafo(texto) {
  return new Paragraph({ children: corridas(texto), indent: { firstLine: 720 } });
}

function titulo(texto, nivel) {
  // APA: nivel 1 centrado en negrita; nivel 2 a la izquierda en negrita
  const opciones = {
    1: { heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER },
    2: { heading: HeadingLevel.HEADING_2 },
  }[nivel];
  return new Paragraph({ ...opciones, children: corridas(texto, { bold: true, color: '000000' }) });
}

function tabla(filas) {
  const columnas = filas[0].length;
  const anchoCol = Math.floor(ANCHO_TEXTO / columnas);
  const anchos = Array(columnas).fill(anchoCol);
  anchos[columnas - 1] = ANCHO_TEXTO - anchoCol * (columnas - 1);
  const borde = { style: BorderStyle.SINGLE, size: 4, color: '999999' };
  return new Table({
    width: { size: ANCHO_TEXTO, type: WidthType.DXA },
    columnWidths: anchos,
    rows: filas.map((celdas, i) => new TableRow({
      tableHeader: i === 0,
      children: celdas.map((c, j) => new TableCell({
        width: { size: anchos[j], type: WidthType.DXA },
        borders: { top: borde, bottom: borde, left: borde, right: borde },
        shading: i === 0 ? { type: ShadingType.CLEAR, fill: 'EDEDED', color: 'auto' } : undefined,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({ spacing: { line: 240 }, children: corridas(c, { size: 20, bold: i === 0 }) })],
      })),
    })),
  });
}

let figura = 0;
function imagen(archivo, descripcion) {
  const datos = fs.readFileSync(path.join(carpetaCapturas, archivo));
  // Tamaño en píxeles leído del encabezado PNG; se achica para entrar en la página (máx. 600 x 760)
  const ancho = datos.readUInt32BE(16), alto = datos.readUInt32BE(20);
  const escala = Math.min(600 / ancho, 760 / alto, 1);
  figura += 1;
  return [
    new Paragraph({ keepNext: true, spacing: { before: 240 }, children: [new TextRun({ text: `Figura ${figura}`, bold: true, font: FUENTE, size: 24 })] }),
    new Paragraph({ keepNext: true, children: corridas(descripcion, { italics: true }) }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: 'png', data: datos,
      transformation: { width: Math.round(ancho * escala), height: Math.round(alto * escala) },
      altText: { title: descripcion, description: descripcion, name: archivo } })] }),
    new Paragraph({ children: [
      new TextRun({ text: 'Nota.', italics: true, font: FUENTE, size: 20 }),
      new TextRun({ text: ' Captura de DROID-E3D con datos de prueba. Elaboración propia.', font: FUENTE, size: 20 }),
    ] }),
  ];
}

// Solo desde la sección 5 (lo de arriba son instrucciones para el equipo, no van al documento)
const lineas = md.slice(md.indexOf('## 5. Diseño')).split('\n');
const hijos = [];
let i = 0;
while (i < lineas.length) {
  const l = lineas[i];
  if (!l.trim() || l.trim() === '---') { i++; continue; }
  if (l.startsWith('### ')) { hijos.push(titulo(l.slice(4), 2)); i++; continue; }
  if (l.startsWith('## ')) { hijos.push(titulo(l.slice(3), 1)); i++; continue; }
  if (l.startsWith('|')) {
    const bloque = [];
    while (i < lineas.length && lineas[i].startsWith('|')) bloque.push(lineas[i++]);
    const filas = bloque.filter((f) => !/^\|[\s:|-]+\|$/.test(f))
      .map((f) => f.slice(1, -1).split('|').map((c) => c.trim()));
    hijos.push(tabla(filas), new Paragraph({ children: [] }));
    // Debajo de la tabla de capturas van las imágenes, como figuras
    if (filas[0][1] === 'Archivo') filas.slice(1).forEach(([, archivo, que]) => hijos.push(...imagen(archivo.replace(/`/g, ''), que)));
    continue;
  }
  if (/^- /.test(l)) {
    hijos.push(new Paragraph({ numbering: { reference: 'vinetas', level: 0 }, children: corridas(l.slice(2)) }));
    i++; continue;
  }
  if (/^\d+\. /.test(l)) {
    hijos.push(new Paragraph({ numbering: { reference: 'numeros', level: 0 }, children: corridas(l.replace(/^\d+\. /, '')) }));
    i++; continue;
  }
  // Párrafo: junta las líneas seguidas
  const texto = [];
  while (i < lineas.length && lineas[i].trim() && !/^(#|\||- |\d+\. |---)/.test(lineas[i])) texto.push(lineas[i++].trim());
  hijos.push(parrafo(texto.join(' ')));
}

const doc = new Document({
  creator: 'IDEPP',
  title: 'DROID-E3D · Secciones técnicas del documento final',
  styles: {
    default: { document: { run: { font: FUENTE, size: 24 }, paragraph: { spacing: { line: 480 } } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FUENTE, size: 24, bold: true, color: '000000' }, paragraph: { spacing: { line: 480 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FUENTE, size: 24, bold: true, color: '000000' }, paragraph: { spacing: { line: 480 }, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [
    { reference: 'vinetas', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'numeros', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
      children: [new TextRun({ children: [PageNumber.CURRENT], font: FUENTE, size: 24 })] })] }) },
    children: hijos,
  }],
});

Packer.toBuffer(doc).then((b) => { fs.writeFileSync(destino, b); console.log(`listo: ${destino} (${figura} figuras)`); });
