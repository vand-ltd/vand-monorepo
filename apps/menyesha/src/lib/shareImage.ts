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
