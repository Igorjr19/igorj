import { parseGitDiff } from '../quality/git-diff.ts';
import { assessRisk, renderRiskReport } from '../quality/risk.ts';

const base = Deno.args[0] ?? 'origin/main';

async function git(...args: string[]): Promise<string> {
  const { success, stdout, stderr } = await new Deno.Command('git', { args }).output();
  if (!success) {
    throw new Error(`git ${args.join(' ')} failed: ${new TextDecoder().decode(stderr)}`);
  }
  return new TextDecoder().decode(stdout);
}

const range = `${base}...HEAD`;
const files = parseGitDiff(
  await git('diff', '--name-status', '-M', range),
  await git('diff', '--numstat', '-M', '--no-renames', range),
);
const report = assessRisk(files);
const markdown = renderRiskReport(report);
console.log(markdown);

const summary = Deno.env.get('GITHUB_STEP_SUMMARY');
if (summary) {
  await Deno.writeTextFile(summary, markdown, { append: true });
}
const output = Deno.env.get('GITHUB_OUTPUT');
if (output) {
  await Deno.writeTextFile(output, `risky=${report.findings.length > 0}\n`, { append: true });
}
