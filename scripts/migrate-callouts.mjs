import fs from 'node:fs';
import path from 'node:path';

export function transformCallouts(source) {
  return source.replace(/^> 💡 (.*)$/gm, '> [!TIP]\n> $1');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = 'src/content/posts';
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  let touched = 0;
  for (const f of files) {
    const p = path.join(dir, f);
    const src = fs.readFileSync(p, 'utf8');
    const out = transformCallouts(src);
    if (out !== src) {
      fs.writeFileSync(p, out);
      touched++;
    }
  }
  console.log(`Rewrote callouts in ${touched} posts.`);
}
