const OUTPUT_PATH = 'generated/data/build.json';

const { success, stdout, stderr } = await new Deno.Command('git', { args: ['rev-parse', 'HEAD'] }).output();
if (!success) {
  console.error(`git rev-parse HEAD failed: ${new TextDecoder().decode(stderr)}`);
  Deno.exit(1);
}
const commit = new TextDecoder().decode(stdout).trim();

await Deno.mkdir('generated/data', { recursive: true });
await Deno.writeTextFile(OUTPUT_PATH, `${JSON.stringify({ commit })}\n`);
console.log(`Build commit ${commit.slice(0, 7)} written to ${OUTPUT_PATH}.`);
