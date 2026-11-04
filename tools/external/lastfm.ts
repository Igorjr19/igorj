import * as v from '@valibot/valibot';
import { TopArtistsResponse } from './schema.ts';
import type { Artist, MusicSummary } from './types.ts';

const API = 'https://ws.audioscrobbler.com/2.0/';

export function topArtistsUrl(user: string, apiKey: string, limit = 5): string {
  const query = new URLSearchParams([
    ['method', 'user.gettopartists'],
    ['user', user],
    ['period', '7day'],
    ['limit', String(limit)],
    ['api_key', apiKey],
    ['format', 'json'],
  ]);
  return `${API}?${query}`;
}

/** Keeps the name, play count and link of each artist; artists with no plays are left out. */
export function parseTopArtists(data: unknown, updated: string): MusicSummary {
  const { topartists } = v.parse(TopArtistsResponse, data);
  const artists = topartists.artist
    .map(({ name, playcount, url }): Artist => ({ name, plays: Number(playcount), ...(url && { url }) }))
    .filter((artist) => artist.plays > 0);
  return { updated, period: 'week', artists };
}
