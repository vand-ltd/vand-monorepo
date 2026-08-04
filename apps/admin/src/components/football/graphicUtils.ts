import { toPng } from 'html-to-image';

// Fetch an image and inline it as a data URL so the exported canvas isn't tainted
// by a cross-origin image (which would blank the whole PNG). Remote http(s) URLs
// go through the same-origin /api/media-proxy so the media host's missing CORS
// headers don't matter. null on any failure (→ the card draws initials).
export async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const src = /^https?:\/\//i.test(url) ? `/api/media-proxy?url=${encodeURIComponent(url)}` : url;
    const res = await fetch(src);
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

// Rasterize a card node to a PNG and save it.
//
// Desktop uses a normal blob-URL download. Mobile browsers (iOS Safari in
// particular) ignore the <a download> attribute and can't handle multi-MB
// data-URL hrefs, so nothing downloaded there. Instead we hand the PNG to the
// native share sheet (Save to Photos / send to WhatsApp, Instagram, etc.),
// which is the natural save flow on phones, and fall back to a blob download /
// new-tab open where share-with-files isn't supported.
export async function downloadCardPng(node: HTMLElement, filename: string): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }
  // No cacheBust: images are embedded data URLs; cache-busting appends a query
  // that corrupts data URIs and drops crests/photos from the exported PNG.
  const dataUrl = await toPng(node, { pixelRatio: 2, backgroundColor: '#003153' });
  const blob = await (await fetch(dataUrl)).blob();

  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };
  try {
    const file = new File([blob], filename, { type: 'image/png' });
    if (nav.share && nav.canShare?.({ files: [file] })) {
      await nav.share({ files: [file] });
      return;
    }
  } catch (err) {
    // User dismissing the share sheet is not an error worth falling back on.
    if ((err as Error | null)?.name === 'AbortError') return;
    // Any other share failure → fall through to the download path below.
  }

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  // Where `download` is honoured (desktop) this saves the file; where it isn't
  // (older iOS Safari) target=_blank opens the image so it can be long-pressed
  // and saved to the camera roll.
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 15000);
}

export const slugify = (s: string): string =>
  s.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'menyesha';
