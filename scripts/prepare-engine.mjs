import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
const require = createRequire(new URL('../apps/web/package.json', import.meta.url));
const engineRoot = dirname(require.resolve('stockfish/package.json'));
const output = new URL('../apps/web/public/engine/', import.meta.url);
await mkdir(output, { recursive: true });
for (const ext of ['js', 'wasm'])
  await copyFile(
    resolve(engineRoot, `bin/stockfish-19-lite-single.${ext}`),
    new URL(`stockfish-19-lite-single.${ext}`, output),
  );
await copyFile(resolve(engineRoot, 'Copying.txt'), new URL('COPYING.txt', output));
await writeFile(
  new URL('SOURCE.txt', output),
  'Stockfish.js 19.0.1, unmodified lite single-thread build. GPL-3.0.\nExact corresponding source: https://github.com/nmrugg/stockfish.js/tree/v19.0.1\nSource archive: https://github.com/nmrugg/stockfish.js/archive/refs/tags/v19.0.1.tar.gz\nSource commit: 0d5dd7944f88c817c07a26bc4fb1905d5f9c46d6\nDistributed binary package: https://registry.npmjs.org/stockfish/-/stockfish-19.0.1.tgz\n',
);
console.log('Stockfish 19 single-thread engine assets ready.');
