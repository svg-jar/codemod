import gradient from 'gradient-string';
import path from 'node:path';
import fs from 'node:fs/promises';
import { defaultBanner } from '#lib/banners.ts';

const gradientString = gradient(
  [
    { color: '#E04E39', pos: 0 },
    { color: '#e9c121', pos: 1 },
  ],
  { interpolation: 'hsv' },
)(defaultBanner);

const bannerFilePath = path.resolve(import.meta.dirname, '../lib/banners.ts');

console.log(`Updating banner in ${bannerFilePath}...`);

const fileContents = await fs.readFile(bannerFilePath, 'utf-8');

const updatedFileContents = fileContents.replace(
  /export const gradientBanner = '.*?'/s,
  `export const gradientBanner = '${gradientString.replaceAll('\u001b', '\\x1B')}'`,
);

await fs.writeFile(bannerFilePath, updatedFileContents, 'utf-8');

console.log('Banner updated successfully.');
