// Persist captured bill photos into the app's document directory so the path
// survives restarts (offline-first), mirroring the Flutter `_saveImageLocally`.
// Uses the stable legacy FileSystem API.

import * as FileSystem from 'expo-file-system/legacy';

const IMAGES_DIR = `${FileSystem.documentDirectory}bill_images`;

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(IMAGES_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
  }
}

/**
 * Copy a picked image into permanent local storage and return the new uri.
 * Returns null if no image was provided.
 */
export async function saveImageLocally(
  sourceUri: string | null | undefined,
  billRef: string,
  side: 'front' | 'back'
): Promise<string | null> {
  if (!sourceUri) return null;
  try {
    await ensureDir();
    const dotIndex = sourceUri.lastIndexOf('.');
    const ext = dotIndex >= 0 ? sourceUri.substring(dotIndex) : '.jpg';
    const dest = `${IMAGES_DIR}/${billRef}_${side}${ext}`;
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
    return dest;
  } catch (e) {
    console.warn('Error saving image locally', e);
    return null;
  }
}
