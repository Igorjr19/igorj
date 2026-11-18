// biome-ignore-all lint/style/useNamingConvention: the keys of a PDF dictionary are capitalized by the format
import { PDFDocument, type PDFFont, PDFName, type PDFPage, PDFString, rgb, StandardFonts } from 'pdf-lib';
import type { CvModel } from '../../../../tools/model/types.ts';
import { layoutCv, PAGE } from './layout.ts';
import type { FontKind, Labels, Measure, Op, Tone } from './types.ts';

const STANDARD: Readonly<Record<FontKind, StandardFonts>> = {
  regular: StandardFonts.Helvetica,
  bold: StandardFonts.HelveticaBold,
  italic: StandardFonts.HelveticaOblique,
};

type Rgb = ReturnType<typeof rgb>;

/** A theme color made darker for paper, where the light accent of a dark theme would barely show. */
function inkOf(hex: string): Rgb {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  const dark = (shift: number): number => (((value >> shift) & 255) / 255) * 0.62;
  return rgb(dark(16), dark(8), dark(0));
}

/** The text with what a standard PDF font cannot draw replaced by a question mark, so one odd character never stops a build. */
function printable(text: string, font: PDFFont): string {
  const supported = new Set(font.getCharacterSet());
  return [...text].map((char) => (supported.has(char.codePointAt(0) ?? 0) ? char : '?')).join('');
}

function addLink(document: PDFDocument, page: PDFPage, rect: readonly number[], url: string): void {
  const link = document.context.register(
    document.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [...rect],
      Border: [0, 0, 0],
      A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
    }),
  );
  const existing = page.node.Annots();
  if (existing) {
    existing.push(link);
  } else {
    page.node.set(PDFName.of('Annots'), document.context.obj([link]));
  }
}

function draw(
  document: PDFDocument,
  page: PDFPage,
  op: Op,
  fonts: Readonly<Record<FontKind, PDFFont>>,
  colors: Readonly<Record<Tone, Rgb>>,
): void {
  if (op.kind === 'rule') {
    page.drawLine({
      start: { x: op.x1, y: PAGE.height - op.y },
      end: { x: op.x2, y: PAGE.height - op.y },
      thickness: 0.5,
      color: colors.muted,
    });
    return;
  }
  const font = fonts[op.font];
  const value = printable(op.text, font);
  const y = PAGE.height - op.y;
  page.drawText(value, { x: op.x, y, size: op.size, font, color: colors[op.tone] });
  if (op.link) {
    addLink(document, page, [op.x, y - 2, op.x + font.widthOfTextAtSize(value, op.size), y + op.size], op.link);
  }
}

/** The CV as a PDF on A4 pages, in the standard fonts so the file stays small and opens everywhere. */
export async function renderCvPdf(
  cv: CvModel,
  meta: { readonly name: string; readonly accent: string; readonly labels: Labels },
): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const fonts = {
    regular: await document.embedFont(STANDARD.regular),
    bold: await document.embedFont(STANDARD.bold),
    italic: await document.embedFont(STANDARD.italic),
  };
  const colors: Record<Tone, Rgb> = {
    text: rgb(0.12, 0.13, 0.17),
    muted: rgb(0.4, 0.42, 0.48),
    accent: inkOf(meta.accent),
  };
  const measure: Measure = (text, font, size) => fonts[font].widthOfTextAtSize(printable(text, fonts[font]), size);
  for (const ops of layoutCv(cv, meta.name, meta.labels, measure)) {
    const page = document.addPage([PAGE.width, PAGE.height]);
    for (const op of ops) {
      draw(document, page, op, fonts, colors);
    }
  }
  document.setTitle(`${meta.name} · CV`);
  document.setAuthor(meta.name);
  document.setProducer('igorj.dev');
  document.setCreator('igorj.dev');
  // The same bytes for the same CV, whenever it is built.
  document.setCreationDate(new Date(0));
  document.setModificationDate(new Date(0));
  return await document.save();
}
