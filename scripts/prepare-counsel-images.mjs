// Rebuild responsive photos from the client's original uploads, never upscaling.
// Usage: node scripts/prepare-counsel-images.mjs [name ...]
// With names, only those images are rebuilt. An asset's optional `quality`
// overrides the default WebP quality of 92 (grainy photos compress poorly).
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
const assets = JSON.parse(await readFile(new URL('../data/counsel-images.json', import.meta.url), 'utf8'));
const only = process.argv.slice(2);
for (const name of only) if (!assets[name]) throw new Error(`${name}: not in counsel-images.json`);
for (const [name, asset] of Object.entries(assets)) {
  if (only.length && !only.includes(name)) continue;
  const response = await fetch(asset.source);
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  const original = Buffer.from(await response.arrayBuffer());
  const metadata = await sharp(original).metadata();
  if (metadata.width !== asset.width || metadata.height !== asset.height) {
    throw new Error(`${name}: source dimensions changed; update counsel-images.json before rebuilding`);
  }
  for (const width of asset.widths) {
    const suffix = width === asset.width ? '' : `-${width}`;
    await sharp(original).rotate().resize({ width, withoutEnlargement: true })
      .webp({ quality: asset.quality ?? 92, effort: 6 })
      .toFile(new URL(`../public/images/counsel/${name}${suffix}.webp`, import.meta.url).pathname);
  }
  console.log(`${name}: ${asset.width} × ${asset.height}`);
}
