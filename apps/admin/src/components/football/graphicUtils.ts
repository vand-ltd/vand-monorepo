import { toPng } from 'html-to-image';

// Fetch an image and inline it as a data URL so the exported canvas isn't tainted
// by a cross-origin image (which would blank the whole PNG). null on any failure.
export async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Rasterize a card node to a PNG and trigger a download.
export async function downloadCardPng(node: HTMLElement, filename: string): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }
  // No cacheBust: images are embedded data URLs; cache-busting appends a query
  // that corrupts data URIs and drops crests/photos from the exported PNG.
  const dataUrl = await toPng(node, { pixelRatio: 2, backgroundColor: '#003153' });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export const slugify = (s: string): string =>
  s.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'menyesha';
