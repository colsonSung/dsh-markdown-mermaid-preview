/**
 * Cross-platform path helpers shared by the host half and the client half.
 *
 * The Harness reports an absolute path `/`-separated on POSIX and
 * drive-rooted with the platform separator on Windows, and the Session
 * workspace root arrives in the same spelling. A single separator test
 * therefore cannot classify a path on both platforms, so every helper below
 * accepts either separator and never assumes one.
 *
 * The semantics mirror `@deepseek-ai/dsh-util-workspace-path`, the shipped
 * helper the Harness uses for the same job. The plugin keeps its own copy so
 * the linked bundle stays self-contained and its behaviour stays testable.
 */

/** Whether a path uses a Windows drive or UNC prefix. */
export function isWindowsStylePath(value) {
  return /^[A-Za-z]:[/\\]/.test(value) || value.startsWith('\\\\');
}

/**
 * Whether a path is absolute in either spelling the Host accepts: POSIX
 * (`/a/b`), a Windows drive (`C:\a\b`) or UNC (`\\server\share`).
 *
 * Which spelling counts as absolute is the platform's business, not the
 * caller's.
 */
export function isAbsolutePath(value) {
  return typeof value === 'string' && (value.startsWith('/') || isWindowsStylePath(value));
}

/**
 * Path segments on either separator, so the depth of a path counts the same
 * way on both platforms.
 */
export function pathSegments(value) {
  return String(value ?? '').split(/[/\\]+/).filter(Boolean);
}

/**
 * The final non-empty segment of a path, for display.
 *
 * @param {string} value - a path using POSIX or Windows separators.
 * @returns {string} the last segment, or an empty string for a separator-only path.
 */
export function pathBasename(value) {
  const trimmed = String(value ?? '').replace(/[/\\]+$/, '');
  const cut = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'));
  return cut < 0 ? trimmed : trimmed.slice(cut + 1);
}

/**
 * Split a path for display: the directories through their last separator, and
 * the final segment after it. Trailing separators are dropped first, so a
 * directory path names its own last segment.
 *
 * @param {string} value - a path using POSIX or Windows separators.
 * @returns {{directory: string, name: string}} the directory prefix, which keeps
 *   its trailing separator, and the final segment.
 */
export function pathParts(value) {
  const text = String(value ?? '');
  const trimmed = text.replace(/[/\\]+$/, '');
  if (trimmed === '') return { directory: '', name: text };
  const cut = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\')) + 1;
  return { directory: trimmed.slice(0, cut), name: trimmed.slice(cut) };
}

/**
 * The directory of a path, without a trailing separator.
 *
 * @param {string} value - a path using POSIX or Windows separators.
 * @returns {string} the parent path, in the separators the input used.
 */
export function pathDirname(value) {
  const text = String(value ?? '');
  const trimmed = text.replace(/[/\\]+$/, '');
  if (trimmed === '') return text.startsWith('/') ? '/' : '';
  const cut = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'));
  if (cut < 0) return trimmed;
  if (cut === 0) return '/';
  const directory = trimmed.slice(0, cut);
  return /^[A-Za-z]:$/.test(directory) ? directory + '\\' : directory;
}

/**
 * Join a child onto a parent, keeping the parent's separator so a Windows
 * path stays drive-rooted and backslash-separated.
 */
export function joinPath(parent, child) {
  const base = String(parent ?? '').replace(/[/\\]+$/, '');
  const name = String(child ?? '').replace(/^[/\\]+/, '');
  if (base === '') return name;
  const separator = base.includes('\\') ? '\\' : '/';
  return `${base}${separator}${name}`;
}

/**
 * The path of `text` relative to the workspace root, for display and for chat
 * mentions.
 *
 * @param {string} text - an absolute path.
 * @param {string} root - the workspace root, in either separator spelling.
 * @returns {string|undefined} the POSIX-separated relative path, an empty
 *   string when `text` is the root itself, or `undefined` when `text` is not
 *   rooted there.
 */
export function relativeToRoot(text, root) {
  if (typeof text !== 'string' || typeof root !== 'string') return undefined;
  const base = root.replace(/[/\\]+$/, '');
  if (base === '') return undefined;
  if (text === base) return '';
  if (!text.startsWith(`${base}/`) && !text.startsWith(`${base}\\`)) return undefined;
  return text.slice(base.length + 1).replace(/\\/g, '/');
}

/** A path with POSIX separators, for display and for chat mentions. */
export function toPosixPath(value) {
  return String(value ?? '').replace(/\\/g, '/');
}
