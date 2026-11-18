import { assert, assertEquals } from '@std/assert';
import type { CvModel } from '../../../../../tools/model/types.ts';
import { layoutCv, PAGE } from '../../../tools/cv-pdf/layout.ts';
import type { Labels, Measure, TextOp } from '../../../tools/cv-pdf/types.ts';

const measure: Measure = (text, _font, size) => text.length * size * 0.5;
const labels: Labels = {
  work: 'Work',
  education: 'Education',
  academic: 'Academic',
  skills: 'Skills',
  languages: 'Languages',
  publications: 'Publications',
  present: 'present',
};

function cvOf(jobs: number): CvModel {
  return {
    language: 'en',
    fallback: false,
    basics: {
      label: 'Developer',
      summary: 'A summary of the career.',
      email: 'person@example.com',
      location: 'Somewhere',
      profiles: [{ network: 'GitHub', url: 'https://github.com/person' }],
    },
    work: Array.from({ length: jobs }, (_, index) => ({
      name: `Company ${index}`,
      position: 'Developer',
      url: 'https://example.com',
      startDate: '2024-01',
      highlights: Array.from(
        { length: 4 },
        () => 'Built a thing that works well and is used by many people every day.',
      ),
    })),
    education: [
      { institution: 'A University', studyType: 'Bachelor', area: 'Computing', startDate: '2020', endDate: '2023' },
    ],
    academic: [],
    skills: [{ name: 'Backend', keywords: ['Go', 'Node.js'] }],
    languages: [],
    publications: [],
  };
}

const texts = (pages: ReturnType<typeof layoutCv>): TextOp[] =>
  pages.flat().filter((op): op is TextOp => op.kind === 'text');

Deno.test('a short CV fits one page, and its head says the name, the role and the ways to reach the person', () => {
  const pages = layoutCv(cvOf(1), 'A Person', labels, measure);
  assertEquals(pages.length, 1);
  const words = texts(pages).map((op) => op.text);
  assert(words.includes('A Person'));
  assert(words.includes('Developer · Somewhere'));
  assert(words.includes('person@example.com'));
});

Deno.test('a long CV flows onto more pages and nothing is drawn below the bottom margin', () => {
  const pages = layoutCv(cvOf(8), 'A Person', labels, measure);
  assert(pages.length > 1);
  for (const op of pages.flat()) {
    assert(op.y <= PAGE.height - PAGE.margin + 1, `y ${op.y} is below the margin`);
  }
});

Deno.test('the company is a link to its address and the period is at the right edge', () => {
  const pages = layoutCv(cvOf(1), 'A Person', labels, measure);
  const linked = texts(pages).filter((op) => op.link === 'https://example.com');
  assertEquals(linked.length, 1);
  const period = texts(pages).find((op) => op.text === '2024-01 – present');
  assert(period && period.x + measure(period.text, 'regular', period.size) <= PAGE.width - PAGE.margin + 0.5);
});

Deno.test('the sections carry the labels of the language of the CV, in capitals', () => {
  const words = texts(layoutCv(cvOf(1), 'A Person', labels, measure)).map((op) => op.text);
  for (const label of ['WORK', 'EDUCATION', 'SKILLS']) {
    assert(words.includes(label), label);
  }
  assert(!words.includes('ACADEMIC'));
});
