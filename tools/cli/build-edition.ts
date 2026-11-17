// biome-ignore-all lint/style/useNamingConvention: the names of environment variables are capitals
/**
 * Builds one edition of the site into a folder, from the model the main build already wrote: `build-edition.ts pro public-pro`.
 * With `--if-declared`, an edition the content does not declare is left alone, so the content check can ask for every
 * edition it may have.
 */
const [edition, out, flag] = Deno.args;
if (!(edition && out)) {
  console.error('Usage: build-edition.ts <edition> <folder> [--if-declared]');
  Deno.exit(2);
}

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function run(args: string[], cwd: string, env: Record<string, string>): Promise<void> {
  const result = await new Deno.Command('deno', { args, cwd, env, stdout: 'inherit', stderr: 'inherit' }).output();
  if (!result.success) {
    Deno.exit(result.code);
  }
}

if (flag === '--if-declared' && !(await exists(`generated/model/${edition}`))) {
  console.log(`The content declares no edition "${edition}"; nothing to build.`);
  Deno.exit(0);
}
await run(['task', 'app:images'], '.', { EDITION: edition });
await run(['run', '-A', '--config', '../../deno.json', 'npm:vite', 'build'], 'frontend/app', {
  EDITION: edition,
  // Paths in the environment are read from `frontend/app`.
  APP_OUT: `../../${out}`,
});
