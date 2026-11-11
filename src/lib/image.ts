import { Platform } from 'react-native';

const MAX_SIDE = 1600;

/**
 * Reads a picked photo for upload. On the web, big phone photos (often 5-10 MB) are shrunk to at most
 * 1600 pixels and saved as JPEG, so uploads are quick on mobile data and the feed loads fast.
 * The phone apps already compress photos in the picker.
 */
export async function readPhoto(uri: string, mime: string): Promise<{ body: ArrayBuffer | Blob; mime: string }> {
  const res = await fetch(uri);
  if (Platform.OS !== 'web') return { body: await res.arrayBuffer(), mime };
  const blob = await res.blob();
  try {
    const url = URL.createObjectURL(blob);
    const img = new window.Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    const out = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', 0.82));
    if (out && (out.size < blob.size || !/jpeg|png|webp/.test(blob.type))) return { body: out, mime: 'image/jpeg' };
  } catch {
    // Fall back to the original file if the browser cannot read it.
  }
  return { body: blob, mime: blob.type || mime };
}
