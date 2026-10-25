import { marked } from 'marked';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

export function createEditorKit() {
  marked.setOptions({ gfm: true, breaks: false });
  const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
    strongDelimiter: '**',
  });
  turndown.use(gfm);
  turndown.keep(['table']);
  return {
    toHtml(markdown) {
      return String(marked.parse(markdown ?? ''));
    },
    toMarkdown(html) {
      return turndown.turndown(html ?? '');
    },
  };
}
