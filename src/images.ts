import { createHash } from 'node:crypto';
import type { ImageContent } from '@earendil-works/pi-ai';
import * as codingAgent from '@earendil-works/pi-coding-agent';
import { isImage } from './core/images.ts';
import { isMime, type Store } from './core/store.ts';

export const IMAGE_LIMITS = { maxWidth: 2048, maxHeight: 2048, maxBytes: 2 * 1024 * 1024, jpegQuality: 85 };
const hash = (image: ImageContent) => createHash('sha256').update(image.data).digest('hex').slice(0, 16);
export const imageRef = (image: ImageContent) => `[image ${hash(image)}]`;

const resizeImage = typeof (codingAgent as any).resizeImage === 'function' ? (codingAgent as any).resizeImage : undefined;

export async function saveImages(store: Store, content: unknown) {
  if (!Array.isArray(content)) return;
  for (const image of content.filter(isImage)) {
    const name = hash(image);
    if (await store.image(name)) continue;
    const kept = (resizeImage ? await resizeImage(Buffer.from(image.data, 'base64'), image.mimeType, IMAGE_LIMITS) : null) ?? image;
    if (isMime(kept.mimeType)) await store.putImage(name, kept.mimeType, Buffer.from(kept.data, 'base64'));
  }
}
