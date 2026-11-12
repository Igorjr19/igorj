import { readFile } from 'node:fs/promises';
import { parse } from 'smol-toml';
import type { SiteModel } from '../../../../../tools/model/types.ts';
import { type DataSource, isStale, listeningBars, recentRows, systemSources } from '../home/data.ts';
import type { HomeData } from '../home/types.ts';
import { readImages } from './images.ts';

const BUILD_INFO = process.env['BUILD_INFO'] ?? '../../generated/data/build.json';
const SOURCES = process.env['SOURCES_FILE'] ?? '../tui/data/sources.toml';

async function commitOf(): Promise<string | null> {
  try {
    return (JSON.parse(await readFile(BUILD_INFO, 'utf8')) as { commit?: string }).commit ?? null;
  } catch {
    return null;
  }
}

const MODEL_KEYS: readonly string[] = ['music', 'films', 'github', 'codetime'];

function isSource(value: unknown): value is DataSource {
  const source = value as Partial<Record<keyof DataSource, unknown>> | null;
  return (
    typeof source?.name === 'string' &&
    typeof source.what === 'string' &&
    typeof source.model === 'string' &&
    MODEL_KEYS.includes(source.model)
  );
}

async function readSources(): Promise<DataSource[]> {
  const sources = parse(await readFile(SOURCES, 'utf8'))['sources'];
  if (!Array.isArray(sources)) {
    throw new Error(`${SOURCES} must list the sources`);
  }
  return sources.map((entry) => {
    if (!isSource(entry)) {
      throw new Error(`${SOURCES} must list sources with a name, a model key and a text key`);
    }
    return { name: entry.name, model: entry.model, what: entry.what };
  });
}

function lateOf(updated: string | undefined, now: Date): string | null {
  return updated && isStale(updated, now) ? updated : null;
}

function networksOf(model: SiteModel): Record<string, string> {
  const links = model.contact ? [...model.contact.personal, ...model.contact.professional] : [];
  return Object.fromEntries(links.map((link) => [link.network, link.url]));
}

type Images = Awaited<ReturnType<typeof readImages>>;

function heroOf(model: SiteModel, images: Images): HomeData['hero'] {
  const profile = model.profile;
  if (!profile) {
    return null;
  }
  const photo = profile.photo ? images.portraits[profile.photo] : undefined;
  return {
    author: profile.author,
    role: profile.role,
    location: profile.location,
    lines: profile.lines,
    photo: photo ? { alt: profile.photoAlt, ...photo } : null,
  };
}

function codeOf(model: SiteModel, now: Date): HomeData['code'] {
  const { github, codetime } = model;
  if (!(github || codetime)) {
    return null;
  }
  return {
    github: github
      ? { total: github.total, levels: github.levels.slice(-30), updatedLate: lateOf(github.updated, now) }
      : null,
    codetime: codetime
      ? {
          weekMinutes: codetime.weekMinutes,
          monthMinutes: codetime.monthMinutes,
          languages: codetime.languages.slice(0, 3).map((language) => language.name),
          updatedLate: lateOf(codetime.updated, now),
        }
      : null,
  };
}

function watchedOf(model: SiteModel, now: Date): HomeData['watched'] {
  if (!model.films?.films.length) {
    return null;
  }
  return {
    films: model.films.films.slice(0, 4).map((film) => ({
      title: film.title,
      year: film.year,
      rating: film.rating ?? null,
      url: film.url ?? null,
    })),
    updatedLate: lateOf(model.films.updated, now),
  };
}

async function systemOf(model: SiteModel, now: Date): Promise<HomeData['system']> {
  const sources = systemSources(model, await readSources());
  const count = (section: 'posts' | 'projects' | 'research'): number | null =>
    model.sections[section] ? model[section].length : null;
  return {
    commit: await commitOf(),
    built: now.toISOString().slice(0, 10),
    counts: { posts: count('posts'), projects: count('projects'), research: count('research') },
    sources: sources.names,
    updated: sources.updated,
  };
}

export async function buildHome(model: SiteModel, now: Date): Promise<HomeData> {
  const music = model.music?.artists.length ? listeningBars(model.music.artists) : null;
  return {
    hero: heroOf(model, await readImages()),
    recent: recentRows(model, model.language),
    system: await systemOf(model, now),
    code: codeOf(model, now),
    listening: music && model.music ? { ...music, updatedLate: lateOf(model.music.updated, now) } : null,
    watched: watchedOf(model, now),
    networks: networksOf(model),
  };
}
