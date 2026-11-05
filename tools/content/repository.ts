export interface ContentRepository {
  readonly repo: string;
  readonly token: string;
  readonly destination: string;
}

export function cloneArgs({ repo, token, destination }: ContentRepository): string[] {
  return ['clone', '--depth', '1', `https://x-access-token:${token}@github.com/${repo}.git`, destination];
}
