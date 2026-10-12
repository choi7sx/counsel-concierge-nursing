// Rebuild responsive photos from the client's original uploads, never upscaling.
// Usage: node scripts/prepare-counsel-images.mjs
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
const assets = JSON.parse(await readFile(new URL('../data/counsel-images.json', import.meta.url), 'utf8'));
for (const [name, asset] of Object.entries(assets)) {
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
      .webp({ quality: 92, effort: 6 })
      .toFile(new URL(`../public/images/counsel/${name}${suffix}.webp`, import.meta.url).pathname);
  }
  console.log(`${name}: ${asset.width} × ${asset.height}`);
}
