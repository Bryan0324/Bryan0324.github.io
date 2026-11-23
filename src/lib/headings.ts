import type { MarkdownHeading } from 'astro';
export interface TocItem extends MarkdownHeading { number: string; children: TocItem[]; }
export function headingTree(headings: MarkdownHeading[]) {
  const root: TocItem = { depth: 0, slug: '', text: '', number: '', children: [] };
  const stack = [root];
  for (const heading of headings) {
    while (stack.length > 1 && stack[stack.length - 1].depth >= heading.depth) stack.pop();
    const parent = stack[stack.length - 1];
    const node = { ...heading, number: `${parent.number}${parent.children.length + 1}.`, children: [] };
    parent.children.push(node);
    stack.push(node);
  }
  return root.children;
}
