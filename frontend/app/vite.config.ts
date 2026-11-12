import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// The build writes outside the app so the Hugo site keeps owning public/ until the switch.
const out = process.env['APP_OUT'] ?? '../../generated/app';

export default defineConfig({
  plugins: [
    sveltekit({
      adapter: adapter({ pages: out, assets: out }),
      // A section the content turns off has no entries, so its route is legitimately never seen.
      prerender: { handleUnseenRoutes: 'ignore' },
      files: { assets: '../../generated/app-static' },
    }),
  ],
});
