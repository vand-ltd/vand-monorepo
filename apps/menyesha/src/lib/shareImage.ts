import { toPng } from 'html-to-image';

// Fetch an image and inline it as a data URL so the exported canvas isn't tainted
// by a cross-origin image (which would blank the whole PNG). Remote http(s) URLs
// go through the same-origin /api/media-proxy so the media host's missing CORS
// headers don't matter. Same-origin relative paths (e.g. the logo) are fetched
// directly. null on failure.
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

// Fetch an image, then downscale + re-encode it as a compact JPEG data URL.
// html-to-image inlines every <img> as base64 inside an SVG <foreignObject>; a
// multi-MB cover inflates past the browser's embed limit and gets silently
// dropped from the export (it still shows in the live preview, which is the
// confusing part). Shrinking to a card-sized JPEG keeps the embed small enough
// to survive, and awaiting decode() guarantees the pixels are ready. Aspect
// ratio is preserved — the card's object-fit:cover does the framing. Falls back
// to the full data URL if canvas encoding isn't available.
export async function coverDataUrl(url: string, maxDim = 1280, quality = 0.85): Promise<string | null> {
  const dataUrl = await urlToDataUrl(url);
  if (!dataUrl) return null;
  try {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    return dataUrl;
  }
}

// Rasterize a card node to a PNG and save it. Desktop downloads a file; touch
// devices get the native share sheet (Save to Photos / send to Instagram, etc.),
// which is the natural save flow on phones where <a download> is unreliable.
export async function downloadCardPng(node: HTMLElement, filename: string): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }
  const dataUrl = await toPng(node, { pixelRatio: 2, backgroundColor: '#003153' });
  const blob = await (await fetch(dataUrl)).blob();

  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };
  const isTouch =
    typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true;
  if (isTouch) {
    try {
      const file = new File([blob], filename, { type: 'image/png' });
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file] });
        return;
      }
    } catch (err) {
      if ((err as Error | null)?.name === 'AbortError') return;
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 15000);
}

export const slugify = (s: string): string =>
  s.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'menyesha';
