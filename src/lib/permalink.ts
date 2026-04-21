export function buildPostSlug(id: string): string {
  return id.replace(/\.(md|mdx)$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

export function buildPostPath({
  id,
  categories,
}: {
  id: string;
  categories: string[];
}): string {
  const slug = buildPostSlug(id);
  const cats = categories.map((c) => c.toLowerCase());
  return [...cats, slug].join('/');
}
