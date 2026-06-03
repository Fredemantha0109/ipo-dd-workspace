/**
 * scan.js — docs フォルダを再帰的にスキャンして manifest.json を生成
 * 使い方: node scan.js
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, 'docs');
const MANIFEST_PATH = path.join(DOCS_DIR, 'manifest.json');

const IGNORE = ['manifest.json', '.DS_Store', 'Thumbs.db', '.gitkeep'];

// フォルダを再帰的にスキャンしてファイルパスの配列を返す
function scanRecursive(folderPath, basePath) {
  if (!fs.existsSync(folderPath)) return [];
  const results = [];

  const entries = fs.readdirSync(folderPath)
    .filter(f => !IGNORE.includes(f) && !f.startsWith('.'))
    .sort();

  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry);
    const relativePath = basePath ? `${basePath}/${entry}` : entry;
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // サブフォルダは再帰的にスキャン
      const subFiles = scanRecursive(fullPath, relativePath);
      results.push(...subFiles);
    } else {
      results.push(relativePath);
    }
  }

  return results;
}

function buildManifest() {
  const manifest = {};

  const subFolders = fs.readdirSync(DOCS_DIR)
    .filter(f => !IGNORE.includes(f) && !f.startsWith('.'))
    .filter(f => fs.statSync(path.join(DOCS_DIR, f)).isDirectory())
    .sort();

  for (const folder of subFolders) {
    const key = `docs/${folder}/`;
    const files = scanRecursive(path.join(DOCS_DIR, folder), '');
    // 先頭の '/' を除去
    const cleanFiles = files.map(f => f.startsWith('/') ? f.slice(1) : f);
    manifest[key] = cleanFiles;
    console.log(`  ${key} — ${cleanFiles.length}件`);
  }

  return manifest;
}

const manifest = buildManifest();
fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');

const total = Object.values(manifest).reduce((sum, f) => sum + f.length, 0);
console.log(`\n✓ manifest.json を更新しました（合計 ${total} ファイル）`);
