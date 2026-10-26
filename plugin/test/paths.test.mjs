/**
 * Path-helper tests.
 *
 * The Harness reports an absolute path `/`-separated on POSIX and
 * drive-rooted with the platform separator on Windows. These tests pin the
 * behaviour of both spellings, because the client and the host half must
 * agree on what an absolute path is and how a path is split.
 *
 * Run with `node --test test/`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isAbsolutePath,
  joinPath,
  pathBasename,
  pathDirname,
  pathParts,
  pathSegments,
  relativeToRoot,
  toPosixPath,
} from '../paths.js';

test('isAbsolutePath accepts POSIX, drive and UNC spellings', () => {
  for (const path of [
    '/home/user/note.md',
    '/',
    'D:\\workspace\\note.md',
    'D:/workspace/note.md',
    '\\\\server\\share\\note.md',
  ]) {
    assert.equal(isAbsolutePath(path), true, `${path} should be absolute`);
  }
  for (const path of ['note.md', 'docs/note.md', 'docs\\note.md', '', 'C:note.md']) {
    assert.equal(isAbsolutePath(path), false, `${path} should not be absolute`);
  }
});

test('pathSegments counts segments on either separator', () => {
  assert.deepEqual(pathSegments('/home/user/note.md'), ['home', 'user', 'note.md']);
  assert.deepEqual(pathSegments('D:\\workspace\\docs\\note.md'), ['D:', 'workspace', 'docs', 'note.md']);
  assert.deepEqual(pathSegments('D:\\'), ['D:']);
  assert.deepEqual(pathSegments('\\\\server\\share'), ['server', 'share']);
});

test('pathBasename reads the last segment of either spelling', () => {
  assert.equal(pathBasename('/home/user/note.md'), 'note.md');
  assert.equal(pathBasename('D:\\workspace\\docs\\note.md'), 'note.md');
  assert.equal(pathBasename('D:\\workspace\\'), 'workspace');
  assert.equal(pathBasename('note.md'), 'note.md');
});

test('pathParts splits a path into directory and name', () => {
  assert.deepEqual(pathParts('/home/user/note.md'), { directory: '/home/user/', name: 'note.md' });
  assert.deepEqual(pathParts('D:\\workspace\\note.md'), { directory: 'D:\\workspace\\', name: 'note.md' });
  assert.deepEqual(pathParts('/home/user/'), { directory: '/home/', name: 'user' });
});

test('pathDirname returns the parent of either spelling', () => {
  assert.equal(pathDirname('/home/user/note.md'), '/home/user');
  assert.equal(pathDirname('D:\\workspace\\docs\\note.md'), 'D:\\workspace\\docs');
  assert.equal(pathDirname('/home/user'), '/home');
  assert.equal(pathDirname('D:\\workspace'), 'D:\\');
});

test('joinPath keeps the separator of its parent', () => {
  assert.equal(joinPath('/home/user', 'note.md'), '/home/user/note.md');
  assert.equal(joinPath('D:\\workspace', 'note.md'), 'D:\\workspace\\note.md');
  assert.equal(joinPath('D:\\workspace\\', 'note.md'), 'D:\\workspace\\note.md');
  assert.equal(joinPath('/home/user/', '/note.md'), '/home/user/note.md');
});

test('relativeToRoot returns a POSIX relative path under the root', () => {
  assert.equal(relativeToRoot('/home/user/docs/note.md', '/home/user'), 'docs/note.md');
  assert.equal(relativeToRoot('D:\\workspace\\docs\\note.md', 'D:\\workspace'), 'docs/note.md');
  assert.equal(relativeToRoot('/home/user/note.md', '/home/user/'), 'note.md');
  assert.equal(relativeToRoot('/home/user', '/home/user'), '');
  assert.equal(relativeToRoot('/etc/hosts', '/home/user'), undefined);
  assert.equal(relativeToRoot('D:\\other\\note.md', 'D:\\workspace'), undefined);
});

test('toPosixPath rewrites backslashes for display and mentions', () => {
  assert.equal(toPosixPath('D:\\workspace\\docs\\note.md'), 'D:/workspace/docs/note.md');
  assert.equal(toPosixPath('/home/user/note.md'), '/home/user/note.md');
});
