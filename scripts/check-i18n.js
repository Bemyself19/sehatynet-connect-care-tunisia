// scripts/check-i18n.js
// Usage: node scripts/check-i18n.js
// Scans for t('...') usages and checks for missing keys in all locales.

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
const LOCALES_DIR = path.join(__dirname, '../public/locales');
const TRANSLATION_FILE = 'translation.json';

function walk(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = walk(filepath, filelist);
    } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      filelist.push(filepath);
    }
  });
  return filelist;
}

function extractKeysFromSource(file) {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /t\(['"`]([\w.\-]+)['"`]\)/g;
  const keys = [];
  let match;
  while ((match = regex.exec(content))) {
    keys.push(match[1]);
  }
  return keys;
}

function flatten(obj, prefix = '', res = {}) {
  for (const k in obj) {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      flatten(obj[k], pre + k, res);
    } else {
      res[pre + k] = obj[k];
    }
  }
  return res;
}

function main() {
  // 1. Collect all translation keys used in source
  const files = walk(SRC_DIR);
  const usedKeys = new Set();
  files.forEach(file => {
    extractKeysFromSource(file).forEach(key => usedKeys.add(key));
  });

  // 2. For each locale, check for missing keys
  const locales = fs.readdirSync(LOCALES_DIR).filter(f => fs.statSync(path.join(LOCALES_DIR, f)).isDirectory());
  let hasMissing = false;
  locales.forEach(locale => {
    const translationPath = path.join(LOCALES_DIR, locale, TRANSLATION_FILE);
    if (!fs.existsSync(translationPath)) {
      console.warn(`[WARN] Missing translation file for locale: ${locale}`);
      return;
    }
    const translations = flatten(JSON.parse(fs.readFileSync(translationPath, 'utf8')));
    const missing = [];
    usedKeys.forEach(key => {
      if (!(key in translations)) missing.push(key);
    });
    if (missing.length) {
      hasMissing = true;
      console.log(`\n[${locale}] Missing keys (${missing.length}):`);
      missing.forEach(k => console.log('  ' + k));
    } else {
      console.log(`\n[${locale}] All keys present.`);
    }
  });
  if (!hasMissing) {
    console.log('\nAll translation keys are present in all locales!');
  }
}

main();
