import { build } from 'esbuild';
import { readFileSync } from 'node:fs';

// The bundle id must equal the package name: the client module system keys a
// package-local chunk (client.mermaid.js, client.editor.js) by its owner's
// id, and a chunk whose owner is unknown never arrives.
const PACKAGE_ID = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).name;

const wrap = (chunk) => ({
  banner: {
    js: `window.__ModuleLoader__.load({
	id: "${PACKAGE_ID}",
${chunk ? `\tchunk: "${chunk}",\n` : ''}	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;`,
  },
  footer: {
    js: `		return module.exports;
	}
});`,
  },
});

const shared = {
  bundle: true,
  format: 'cjs',
  target: 'es2020',
  platform: 'browser',
  minify: true,
  // Keep the `/*! ... */` license banners of the bundled third-party code.
  legalComments: 'eof',
  logLevel: 'info',
};

await build({
  ...shared,
  entryPoints: ['src/client-entry.js'],
  outfile: 'client.js',
  external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@deepseek-ai/dsh-client-ui-primitives'],
  ...wrap(null),
});

await build({
  ...shared,
  entryPoints: ['src/mermaid-chunk.js'],
  outfile: 'client.mermaid.js',
  ...wrap('client.mermaid.js'),
});

await build({
  ...shared,
  entryPoints: ['src/editor-chunk.js'],
  outfile: 'client.editor.js',
  ...wrap('client.editor.js'),
});

