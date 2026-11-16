import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const base = 'https://raw.githubusercontent.com/TheoRuffin/orion-express/main/';
const header = `// ==UserScript==
// @name Orion Express
// @namespace https://github.com/TheoRuffin/orion-express
// @version ${pkg.version}
// @description Catálogo local y rellenado experimental en Vinted España, sin publicar.
// @description:fr Catalogue local et préremplissage expérimental Vinted Espagne, sans publication.
// @match https://example.com/*
// @run-at document-end
// @noframes
// @match https://www.vinted.es/items/new*
// @grant GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @inject-into auto
// @updateURL ${base}orion-express.meta.js
// @downloadURL ${base}orion-express.user.js
// @homepageURL https://github.com/TheoRuffin/orion-express
// @supportURL https://github.com/TheoRuffin/orion-express/issues
// ==/UserScript==
`;
const localisation = await readFile(new URL('src/i18n.js',root),'utf8');
const core = (await readFile(new URL('src/core.js', root),'utf8')).replace(/^export /gm, '');
const ui = await readFile(new URL('src/app.js', root), 'utf8');
const preparation = (await readFile(new URL('src/preparation.js', root),'utf8')).replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
const prepUI = await readFile(new URL('src/preparation-ui.js', root),'utf8');
const adapter = (await readFile(new URL('src/vinted-adapter.js',root),'utf8')).replace(/^export /gm,'');
const vintedUI=await readFile(new URL('src/vinted-ui.js',root),'utf8');
const css = await readFile(new URL('src/style.css', root), 'utf8');
await writeFile(new URL('orion-express.meta.js', root), header);
await writeFile(new URL('orion-express.user.js', root), header + '\n(async () => {\n\'use strict\';\n' + localisation + '\nawait initialiseOrionLanguage();\n' + core + '\n' + preparation + '\n' + adapter + '\nconst APP_CSS = ' + JSON.stringify(css) + ';\n' + vintedUI + '\nif(location.hostname === \'www.vinted.es\'){void initVintedAssistant();return;}\n' + ui + '\n' + prepUI + '\n})();\n');
console.log(`Build ${pkg.version} : userscript autonome et métadonnées générés.`);
