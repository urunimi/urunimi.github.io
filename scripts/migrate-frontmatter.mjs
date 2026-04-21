import fs from 'node:fs';
import path from 'node:path';

const DROP_KEYS = /^(toc|layout)\s*:/;

export function transformFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return source;
  const [, yaml, body] = match;
  const filtered = yaml
    .split('\n')
    .filter((line) => !DROP_KEYS.test(line))
    .join('\n');
  return `---\n${filtered}\n---\n${body}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = 'src/content/posts';
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  let touched = 0;
  for (const f of files) {
    const p = path.join(dir, f);
    const src = fs.readFileSync(p, 'utf8');
    const out = transformFrontmatter(src);
    if (out !== src) {
      fs.writeFileSync(p, out);
      touched++;
    }
  }
  console.log(`Migrated front matter for ${files.length} posts (${touched} changed).`);
}
