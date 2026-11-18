import type { CvModel } from '../../../../tools/model/types.ts';
import type { FontKind, Labels, Measure, Op, Page, Tone } from './types.ts';
import { wrapText } from './wrap.ts';

/** A4 in points, with margins of 19 mm. */
export const PAGE = { width: 595.28, height: 841.89, margin: 54 } as const;
const WIDTH = PAGE.width - 2 * PAGE.margin;
const BULLET_INDENT = 12;
const BODY = 10;
const SMALL = 9;
const LINE = 1.4;

/** Where the next line goes: the pages so far, and how far down the current one is. */
interface Flow {
  readonly pages: Op[][];
  y: number;
  readonly measure: Measure;
  readonly labels: Labels;
}

interface Style {
  readonly x?: number;
  readonly size?: number;
  readonly font?: FontKind;
  readonly tone?: Tone;
  readonly link?: string | undefined;
}

function current(flow: Flow): Op[] {
  return flow.pages[flow.pages.length - 1] as Op[];
}

/** Makes room for `height` more points, on a new page when the current one cannot hold them. */
function need(flow: Flow, height: number): void {
  if (flow.y + height > PAGE.height - PAGE.margin && flow.y > PAGE.margin) {
    flow.pages.push([]);
    flow.y = PAGE.margin;
  }
}

/** One run of text at the cursor; how wide it came out. */
function text(flow: Flow, value: string, style: Style = {}): number {
  const { x = PAGE.margin, size = BODY, font = 'regular', tone = 'text', link } = style;
  current(flow).push({ kind: 'text', x, y: flow.y + size, text: value, font, size, tone, link });
  return flow.measure(value, font, size);
}

/** A paragraph wrapped within `width`, a line at a time, the first one starting `firstOffset` in. */
function paragraph(flow: Flow, value: string, style: Style & { width?: number; firstOffset?: number } = {}): void {
  const { x = PAGE.margin, size = BODY, font = 'regular', width = WIDTH, firstOffset = 0 } = style;
  const lines = wrapText(value, width, flow.measure, font, size, firstOffset);
  for (const [index, line] of lines.entries()) {
    need(flow, size * LINE);
    text(flow, line, { ...style, x: x + (index === 0 ? firstOffset : 0) });
    flow.y += size * LINE;
  }
}

function heading(flow: Flow, label: string): void {
  need(flow, 40);
  flow.y += 14;
  text(flow, label.toUpperCase(), { size: SMALL, font: 'bold', tone: 'accent' });
  flow.y += SMALL + 3;
  current(flow).push({ kind: 'rule', x1: PAGE.margin, x2: PAGE.margin + WIDTH, y: flow.y });
  flow.y += 8;
}

/** A line with a title at the left and a period at the right edge; the title wraps within what the period leaves. */
function entryHead(flow: Flow, title: string, period: string, link?: string): void {
  const periodWidth = period ? flow.measure(period, 'regular', SMALL) : 0;
  const lines = wrapText(title, WIDTH - periodWidth - 14, flow.measure, 'bold', BODY + 1);
  need(flow, (BODY + 1) * LINE * lines.length + BODY * LINE * 2);
  for (const [index, line] of lines.entries()) {
    text(flow, line, { size: BODY + 1, font: 'bold', link: index === 0 ? link : undefined });
    if (index === 0 && period) {
      text(flow, period, { x: PAGE.margin + WIDTH - periodWidth, size: SMALL, tone: 'muted' });
    }
    flow.y += (BODY + 1) * LINE;
  }
}

function bullets(flow: Flow, items: readonly string[]): void {
  for (const item of items) {
    const lines = wrapText(item, WIDTH - BULLET_INDENT, flow.measure, 'regular', BODY);
    need(flow, BODY * LINE * Math.min(2, lines.length));
    text(flow, '•');
    for (const line of lines) {
      need(flow, BODY * LINE);
      text(flow, line, { x: PAGE.margin + BULLET_INDENT });
      flow.y += BODY * LINE;
    }
    flow.y += 2;
  }
}

/** `Name: a, b, c` with the name in bold and the rest wrapping under it. */
function labelled(flow: Flow, label: string, rest: string): void {
  const offset = flow.measure(`${label} `, 'bold', BODY);
  const lines = wrapText(rest, WIDTH, flow.measure, 'regular', BODY, offset);
  need(flow, BODY * LINE);
  text(flow, label, { font: 'bold' });
  for (const [index, line] of lines.entries()) {
    need(flow, BODY * LINE);
    text(flow, line, { x: PAGE.margin + (index === 0 ? offset : 0) });
    flow.y += BODY * LINE;
  }
  flow.y += 2;
}

/** The name, the role and place, the summary and the ways to reach the person. */
function head(flow: Flow, cv: CvModel, name: string): void {
  text(flow, name, { size: 22, font: 'bold' });
  flow.y += 30;
  const headline = [cv.basics.label, cv.basics.location].filter(Boolean).join(' · ');
  if (headline) {
    text(flow, headline, { size: 11, tone: 'muted' });
    flow.y += 17;
  }
  if (cv.basics.summary) {
    paragraph(flow, cv.basics.summary);
    flow.y += 4;
  }
  const contacts = [
    { label: cv.basics.email, link: `mailto:${cv.basics.email}` },
    ...cv.basics.profiles.map((profile) => ({ label: profile.network, link: profile.url })),
  ].filter((contact) => contact.label);
  let x: number = PAGE.margin;
  for (const [index, contact] of contacts.entries()) {
    if (index > 0) {
      x += text(flow, ' · ', { x, size: SMALL, tone: 'muted' });
    }
    x += text(flow, contact.label, { x, size: SMALL, tone: 'accent', link: contact.link });
  }
  flow.y += SMALL * LINE;
}

function work(flow: Flow, cv: CvModel): void {
  heading(flow, flow.labels.work);
  for (const job of cv.work) {
    entryHead(
      flow,
      `${job.position} · ${job.name}`,
      `${job.startDate} – ${job.endDate ?? flow.labels.present}`,
      job.url,
    );
    if (job.location) {
      paragraph(flow, job.location, { size: SMALL, tone: 'muted' });
    }
    if (job.summary) {
      paragraph(flow, job.summary);
    }
    bullets(flow, job.highlights);
    flow.y += 6;
  }
}

function education(flow: Flow, cv: CvModel): void {
  heading(flow, flow.labels.education);
  for (const study of cv.education) {
    const period = study.startDate
      ? `${study.startDate} – ${study.endDate ?? flow.labels.present}`
      : (study.endDate ?? '');
    entryHead(flow, `${study.studyType} · ${study.area}`, period);
    paragraph(flow, study.institution, { size: SMALL, tone: 'muted' });
    flow.y += 6;
  }
}

function academic(flow: Flow, cv: CvModel): void {
  heading(flow, flow.labels.academic);
  for (const entry of cv.academic) {
    entryHead(flow, entry.title, String(entry.year));
    paragraph(flow, entry.institution, { size: SMALL, tone: 'muted' });
    if (entry.summary) {
      paragraph(flow, entry.summary);
    }
    flow.y += 6;
  }
}

function lists(flow: Flow, cv: CvModel): void {
  if (cv.skills.length > 0) {
    heading(flow, flow.labels.skills);
    for (const skill of cv.skills) {
      labelled(flow, `${skill.name}:`, skill.keywords.join(', '));
    }
  }
  if (cv.languages.length > 0) {
    heading(flow, flow.labels.languages);
    for (const language of cv.languages) {
      labelled(flow, `${language.language}:`, language.fluency);
    }
  }
  if (cv.publications.length > 0) {
    heading(flow, flow.labels.publications);
    for (const publication of cv.publications) {
      paragraph(flow, `${publication.title} (${publication.year})`);
    }
  }
}

/** Lays the CV out on A4 pages, top to bottom, and starts a new page where a block would not fit. */
export function layoutCv(cv: CvModel, name: string, labels: Labels, measure: Measure): Page[] {
  const flow: Flow = { pages: [[]], y: PAGE.margin, measure, labels };
  head(flow, cv, name);
  if (cv.work.length > 0) {
    work(flow, cv);
  }
  if (cv.education.length > 0) {
    education(flow, cv);
  }
  if (cv.academic.length > 0) {
    academic(flow, cv);
  }
  lists(flow, cv);
  return flow.pages;
}
