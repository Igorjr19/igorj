import * as v from '@valibot/valibot';

/** The part of the Last.fm user.getTopArtists response the site uses; Last.fm sends counts as strings. */
export const TopArtistsResponse = v.object({
  topartists: v.object({
    artist: v.array(
      v.object({
        name: v.pipe(v.string(), v.nonEmpty()),
        playcount: v.pipe(v.string(), v.regex(/^\d+$/)),
        url: v.optional(v.string()),
      }),
    ),
  }),
});
