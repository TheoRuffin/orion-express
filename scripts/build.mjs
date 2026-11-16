import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const base = 'https://raw.githubusercontent.com/TheoRuffin/orion-express/main/';
const header = `// ==UserScript==
// @name Orion Express
// @namespace https://github.com/TheoRuffin/orion-express
// @version ${pkg.version}
// @description Gestion locale de produits, photos, stock et sauvegardes — interface française.
// @match https://example.com/*
// @run-at document-end
// @noframes
// @grant none
// @inject-into auto
// @updateURL ${base}orion-express.meta.js
// @downloadURL ${base}orion-express.user.js
// @homepageURL https://github.com/TheoRuffin/orion-express
// @supportURL https://github.com/TheoRuffin/orion-express/issues
// ==/UserScript==
`;
const core = (await readFile(new URL('src/core.js', root),'utf8')).replace(/^export /gm, '');
const ui = await readFile(new URL('src/app.js', root), 'utf8');
const css = await readFile(new URL('src/style.css', root), 'utf8');
await writeFile(new URL('orion-express.meta.js', root), header);
await writeFile(new URL('orion-express.user.js', root), header + '\n(() => {\n\'use strict\';\n' + core + '\nconst APP_CSS = ' + JSON.stringify(css) + ';\n' + ui + '\n})();\n');
console.log(`Build ${pkg.version} : userscript autonome et métadonnées générés.`);
