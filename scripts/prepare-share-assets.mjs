// Builds the images search engines and social apps request directly:
// - public/images/og/<photo>.jpg: 1200×630 share images (Open Graph, iMessage,
//   LinkedIn) cropped from the local client photography.
// - favicon.ico, apple-touch-icon.png, and icon-192/512.png from favicon.svg.
//   Google shows the favicon beside search results.
// Run after prepare-counsel-images.mjs: node scripts/prepare-share-assets.mjs
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";
import images from "../data/counsel-images.json" with { type: "json" };

const path = (relative) => new URL(`../${relative}`, import.meta.url).pathname;

await mkdir(path("public/images/og"), { recursive: true });
for (const key of Object.keys(images)) {
  await sharp(path(`public/images/counsel/${key}.webp`))
    // "attention" keeps faces in frame when portrait photos are cropped wide.
    .resize(1200, 630, { fit: "cover", position: "attention" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path(`public/images/og/${key}.jpg`));
  console.log(`public/images/og/${key}.jpg`);
}

const icon = (size) =>
  sharp(path("public/favicon.svg"), { density: 1200 }).resize(size, size).png().toBuffer();
for (const [file, size] of [["apple-touch-icon.png", 180], ["icon-192.png", 192], ["icon-512.png", 512]]) {
  await writeFile(path(`public/${file}`), await icon(size));
  console.log(`public/${file}`);
}

// An ICO file is a small directory header followed by embedded PNG images.
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map(icon));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, i) => {
  const entry = 6 + 16 * i;
  header.writeUInt8(size, entry);
  header.writeUInt8(size, entry + 1);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(pngs[i].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += pngs[i].length;
});
await writeFile(path("public/favicon.ico"), Buffer.concat([header, ...pngs]));
console.log("public/favicon.ico");
