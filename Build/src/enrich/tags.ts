export function mergeTags(...tagArrays: (string[] | undefined)[]): string[] {
  const allTags: string[] = [];
  
  for (const tags of tagArrays) {
    if (tags && tags.length > 0) {
      allTags.push(...tags);
    }
  }
  
  return [...new Set(allTags)];
}

export function hasTag(tags: string[], tag: string): boolean {
  return tags.includes(tag);
}

export function filterByTags(tags: string[], allowedTags: string[]): boolean {
  if (allowedTags.length === 0) return true;
  return tags.some(tag => allowedTags.includes(tag));
}