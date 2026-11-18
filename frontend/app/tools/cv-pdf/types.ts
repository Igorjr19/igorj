export type FontKind = 'regular' | 'bold' | 'italic';
export type Tone = 'text' | 'muted' | 'accent';

/** Measures a text in points for a font and a size; the page layout does not know which library draws it. */
export type Measure = (text: string, font: FontKind, size: number) => number;

/** One run of text on the page, its baseline `y` points below the top edge. */
export interface TextOp {
  readonly kind: 'text';
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly font: FontKind;
  readonly size: number;
  readonly tone: Tone;
  readonly link?: string | undefined;
}

export interface RuleOp {
  readonly kind: 'rule';
  readonly x1: number;
  readonly x2: number;
  readonly y: number;
}

export type Op = TextOp | RuleOp;
export type Page = readonly Op[];

/** The words of the interface the CV carries, in the language of the CV. */
export interface Labels {
  readonly work: string;
  readonly education: string;
  readonly academic: string;
  readonly skills: string;
  readonly languages: string;
  readonly publications: string;
  readonly present: string;
}
