import { type ConventionViolation, findConventionViolations, shouldCheck } from '../quality/conventions.ts';

const { stdout } = await new Deno.Command('git', { args: ['ls-files', '-z'] }).output();
const paths = new TextDecoder()
  .decode(stdout)
  .split('\0')
  .filter((path) => path && shouldCheck(path));

const violations: ConventionViolation[] = [];
for (const path of paths) {
  violations.push(...findConventionViolations(path, await Deno.readTextFile(path)));
}

if (violations.length > 0) {
  for (const { path, line, rule, text } of violations) {
    console.error(`${path}:${line} ${rule}: ${text}`);
  }
  Deno.exit(1);
}
console.log(`Conventions check passed (${paths.length} files).`);
