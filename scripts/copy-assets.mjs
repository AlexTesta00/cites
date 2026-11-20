// Copia nel sito (public/assets) le librerie e i font installati con npm.
// Così il sito non dipende da CDN esterni e Renovate può aggiornare tutto da package.json.
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fromModules = (...p) => path.join(root, 'node_modules', ...p);
const toAssets = (...p) => path.join(root, 'public', 'assets', ...p);

const VENDOR = [
  ['gsap/dist/gsap.min.js', 'vendor/gsap/gsap.min.js'],
  ['gsap/dist/ScrollTrigger.min.js', 'vendor/gsap/ScrollTrigger.min.js'],
  ['gsap/dist/SplitText.min.js', 'vendor/gsap/SplitText.min.js'],
  ['lenis/dist/lenis.min.js', 'vendor/lenis/lenis.min.js'],
];

// Font usati dall'interfaccia (Geist, Geist Mono, Instrument Serif) e dai template (gli altri).
const FONTS = [
  { pkg: '@fontsource-variable/geist', css: ['wght.css'], family: 'Geist' },
  { pkg: '@fontsource-variable/geist-mono', css: ['wght.css'], family: 'Geist Mono' },
  { pkg: '@fontsource/instrument-serif', css: ['400.css', '400-italic.css'] },
  { pkg: '@fontsource/eb-garamond', css: ['400.css', '500.css', '400-italic.css', '500-italic.css'] },
  { pkg: '@fontsource/cormorant-garamond', css: ['500.css', '600.css', '500-italic.css'] },
  { pkg: '@fontsource/libre-baskerville', css: ['400.css', '700.css', '400-italic.css'] },
  { pkg: '@fontsource/crimson-pro', css: ['400.css', '500.css', '400-italic.css'] },
  { pkg: '@fontsource/caveat', css: ['500.css', '600.css'] },
  { pkg: '@fontsource/homemade-apple', css: ['400.css'] },
  { pkg: '@fontsource/nothing-you-could-do', css: ['400.css'] },
  { pkg: '@fontsource/la-belle-aurore', css: ['400.css'] },
  { pkg: '@fontsource/special-elite', css: ['400.css'] },
];

const BLOCK = /\/\*\s*([^*]+?)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g;

async function copyVendor() {
  for (const [from, to] of VENDOR) {
    await mkdir(path.dirname(toAssets(to)), { recursive: true });
    await copyFile(fromModules(from), toAssets(to));
  }
}

async function copyFonts() {
  const rules = [];
  await mkdir(toAssets('fonts', 'licenses'), { recursive: true });
  for (const font of FONTS) {
    for (const cssFile of font.css) {
      const css = await readFile(fromModules(font.pkg, cssFile), 'utf8');
      for (const [, , body] of css.matchAll(BLOCK)) {
        const file = body.match(/url\(\.\/files\/([^)]+?\.woff2)\)/)?.[1];
        if (!file || !/-latin(-ext)?-/.test(file)) continue;
        await copyFile(fromModules(font.pkg, 'files', file), toAssets('fonts', file));
        let rule = body
          .replace(/src:[^;]+;/, `src: url(/assets/fonts/${file}) format('woff2');`)
          .replace(/\n\s*/g, ' ')
          .trim();
        if (font.family) rule = rule.replace(/font-family:\s*'[^']+'/, `font-family: '${font.family}'`);
        rules.push(`@font-face { ${rule} }`);
      }
    }
    const licenseName = font.pkg.replace(/^@/, '').replace(/\//g, '-');
    await copyFile(fromModules(font.pkg, 'LICENSE'), toAssets('fonts', 'licenses', `${licenseName}.txt`));
  }
  await mkdir(toAssets('css'), { recursive: true });
  const header = '/* File generato da scripts/copy-assets.mjs: non modificare a mano. */\n';
  await writeFile(toAssets('css', 'fonts.css'), header + rules.join('\n') + '\n');
  return rules.length;
}

await rm(toAssets('vendor'), { recursive: true, force: true });
await rm(toAssets('fonts'), { recursive: true, force: true });
await copyVendor();
const count = await copyFonts();
console.log(`Asset copiati: ${VENDOR.length} librerie, ${count} file di font.`);
