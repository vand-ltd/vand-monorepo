import { NextRequest, NextResponse } from 'next/server';

// Same-origin image proxy. The media host doesn't send CORS headers, so the
// browser can't read crest/photo images into a <canvas> (html-to-image) without
// tainting it. Fetching server-side (no CORS) and returning the bytes from our
// own origin lets the graphics embed real logos instead of initials.
//
// Safety: only http(s), only image responses, size-capped, and host-allowlisted
// (the API origin by default; extend with IMAGE_PROXY_HOSTS="cdn.example.com,...").

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

// Trusted media hosts (uploads live here). `.vand.rw` covers our custom storage
// domain (storage.vand.rw); the R2 / Images suffixes cover the public Cloudflare
// URLs. Extend via IMAGE_PROXY_HOSTS for anything else.
const ALLOWED_SUFFIXES = ['.vand.rw', '.r2.dev', '.r2.cloudflarestorage.com', '.imagedelivery.net'];

function exactHosts(): Set<string> {
  const hosts = new Set<string>(['imagedelivery.net']); // Cloudflare Images
  try {
    if (process.env.NEXT_PUBLIC_API_URL) hosts.add(new URL(process.env.NEXT_PUBLIC_API_URL).host);
  } catch {
    /* ignore */
  }
  for (const h of (process.env.IMAGE_PROXY_HOSTS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)) {
    hosts.add(h);
  }
  return hosts;
}

function hostAllowed(host: string): boolean {
  if (exactHosts().has(host)) return true;
  return ALLOWED_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url');
  if (!raw) return new NextResponse('Missing url', { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new NextResponse('Bad url', { status: 400 });
  }
  if (target.protocol !== 'https:' && target.protocol !== 'http:') {
    return new NextResponse('Unsupported protocol', { status: 400 });
  }

  if (!hostAllowed(target.host)) {
    return new NextResponse('Host not allowed', { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), { headers: { Accept: 'image/*' } });
  } catch {
    return new NextResponse('Upstream fetch failed', { status: 502 });
  }
  if (!upstream.ok) return new NextResponse('Upstream error', { status: 502 });

  const contentType = upstream.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) {
    return new NextResponse('Not an image', { status: 415 });
  }

  const buf = await upstream.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) return new NextResponse('Too large', { status: 413 });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
