/**
 * Host half of the local preview bundle: authenticated file commands for the
 * Markdown editor and the file-tree context menu, plus session-title commands.
 */
import { copyFile, mkdir, rename, unlink, writeFile } from 'node:fs/promises';
export const inject = ['commands', 'fs', 'sessionTitle'];

export function apply(ctx) {
  ctx.effect(
    () =>
      ctx.commands.register({
        name: 'mmd-save',
        description: 'Write edited content back to a workspace file from the preview editor',
        input: { hint: '<json>' },
        recordInput: false,
        handler: async ({ rawInput }) => {
          try {
            const payload = JSON.parse(rawInput);
            const target = payload?.path;
            const content = payload?.content;
            if (typeof target !== 'string' || target.length === 0) return { kind: 'error', text: 'mmd-save: missing path' };
            if (typeof content !== 'string') return { kind: 'error', text: 'mmd-save: missing content' };
            if (!target.startsWith('/')) return { kind: 'error', text: 'mmd-save: absolute path required' };
            if (target.includes('..')) return { kind: 'error', text: 'mmd-save: path traversal refused' };
            if (content.length > 4 * 1024 * 1024) return { kind: 'error', text: 'mmd-save: content too large' };
            const info = await ctx.fs.lstat(target);
            if (info === undefined || info.type !== 'file') return { kind: 'error', text: 'mmd-save: not a regular file' };
            const file = await ctx.fs.resolve(target);
            await ctx.fs.writeText(file, content);
            return { kind: 'success', text: 'saved' };
          } catch (error) {
            return { kind: 'error', text: 'mmd-save: ' + (error instanceof Error ? error.message : String(error)) };
          }
        },
      }),
    'markdown-editor: save command',
  );

  ctx.effect(
    () =>
      ctx.commands.register({
        name: 'retitle',
        description: 'Regenerate this session title from the whole conversation',
        recordInput: false,
        handler: async ({ agent }) => {
          try {
            const session = agent?.session ?? agent;
            await ctx.sessionTitle.refresh(session);
            return { kind: 'success', text: 'title re-evaluated' };
          } catch (error) {
            return { kind: 'error', text: 'retitle: ' + (error instanceof Error ? error.message : String(error)) };
          }
        },
      }),
    'session-title: retitle command',
  );

  ctx.effect(
    () =>
      ctx.commands.register({
        name: 'rename',
        description: 'Rename this session',
        input: { hint: '<title>' },
        recordInput: false,
        handler: async ({ agent, rawInput }) => {
          const title = String(rawInput ?? '').trim();
          if (title === '') return { kind: 'error', text: 'usage: /rename <title>' };
          try {
            const session = agent?.session ?? agent;
            await ctx.sessionTitle.rename(session, title);
            return { kind: 'success', text: 'renamed to ' + title };
          } catch (error) {
            return { kind: 'error', text: 'rename: ' + (error instanceof Error ? error.message : String(error)) };
          }
        },
      }),
    'session-title: rename command',
  );

  ctx.effect(
    () =>
      ctx.commands.register({
        name: 'mmd-fs',
        description: 'File operations from the file-tree context menu',
        input: { hint: '<json>' },
        recordInput: false,
        handler: async ({ rawInput }) => {
          const guard = (value) => {
            if (typeof value !== 'string' || value.length === 0) throw new Error('path required');
            if (!value.startsWith('/')) throw new Error('absolute path required');
            if (value.includes('..')) throw new Error('path traversal refused');
            if (value.split('/').filter(Boolean).length < 2) throw new Error('path too shallow');
            return value;
          };
          try {
            const payload = JSON.parse(rawInput);
            const op = payload?.op;
            const path = guard(payload?.path);
            if (op === 'mkdir') await mkdir(path);
            else if (op === 'create') await writeFile(path, '', { flag: 'wx' });
            else if (op === 'rename' || op === 'move') await rename(path, guard(payload?.target));
            else if (op === 'copy') await copyFile(path, guard(payload?.target));
            else if (op === 'delete') await unlink(path);
            else return { kind: 'error', text: 'mmd-fs: unknown op ' + String(op) };
            return { kind: 'success', text: op };
          } catch (error) {
            return { kind: 'error', text: 'mmd-fs: ' + (error instanceof Error ? error.message : String(error)) };
          }
        },
      }),
    'file-tree: fs command',
  );
}
