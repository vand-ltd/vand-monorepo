import React from 'react';

// Social handles for the brand. Only the display label matters on a graphic — the
// full URLs live here for reference / future linking.
export const SOCIAL_LINKS = {
  instagram: { url: 'https://www.instagram.com/tugezo_/', handle: '@tugezo_' },
  facebook: { url: 'https://www.facebook.com/tugezo/', handle: '/tugezo' },
  x: { url: 'https://x.com/tugezo', handle: '@tugezo' },
  tiktok: { url: 'https://www.tiktok.com/@tugezo.com', handle: '@tugezo.com' },
  threads: { url: 'https://www.threads.com/@tugezo_', handle: '@tugezo_' },
  // Channel-ID URL: stable even if the @handle is later changed.
  youtube: { url: 'https://www.youtube.com/channel/UC6rRfybev77dFL0t005-hMw', handle: 'Tugezo' },
  whatsapp: { url: 'https://whatsapp.com/channel/0029VayajqXBKfi9j2KY1P15', handle: 'Tugezo' },
} as const;

export type SocialKey = keyof typeof SOCIAL_LINKS;

// Monochrome brand glyphs (Simple Icons, 24×24 viewBox). Inline SVG paths so they
// rasterize reliably in html-to-image exports — icon fonts / emoji do not.
const PATHS: Record<SocialKey, string> = {
  instagram:
    'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.012-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
  facebook:
    'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  tiktok:
    'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  threads:
    'M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z',
  youtube:
    'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  whatsapp:
    'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z',
};

// Default order — most-used platforms first.
const ORDER: SocialKey[] = ['instagram', 'facebook', 'x', 'tiktok', 'threads', 'youtube', 'whatsapp'];

// What downloadable graphics show. A bare icon isn't clickable and doesn't say
// WHERE to find us, so graphics print a short set of platforms WITH handles —
// something a viewer can actually search for. Kept small on purpose.
export const GRAPHIC_PLATFORMS: SocialKey[] = ['x', 'facebook', 'instagram'];

// A row of monochrome social icons — the shared brand signature for every
// downloadable graphic (article/match share cards, admin result/stats/fixture
// cards, …). Uses inline styles + inline SVG so it exports cleanly via
// html-to-image. `handle` optionally appends a text handle after the icons.
export function SocialIcons({
  size = 30,
  color = 'rgba(255,255,255,0.82)',
  gap,
  platforms = ORDER,
  handle,
  showHandles = false,
  style,
}: {
  size?: number;
  color?: string;
  gap?: number;
  platforms?: SocialKey[];
  /** A single trailing handle, appended after the icon row. */
  handle?: string;
  /** Print each platform's OWN handle beside its icon (for downloadable graphics,
   *  where an icon alone isn't clickable and doesn't say where to find us). */
  showHandles?: boolean;
  style?: React.CSSProperties;
}) {
  const g = gap ?? size * 0.42;
  const fontSize = size * 0.66;

  if (showHandles) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: g * 1.9, flexWrap: 'wrap', ...style }}>
        {platforms.map((k) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: g * 0.55 }}>
            <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', flexShrink: 0 }}>
              <path d={PATHS[k]} />
            </svg>
            <span style={{ color, fontSize, fontWeight: 700, fontFamily: 'Arial, Helvetica, sans-serif', whiteSpace: 'nowrap' }}>
              {SOCIAL_LINKS[k].handle}
            </span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: g, ...style }}>
      {platforms.map((k) => (
        <svg key={k} width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
          <path d={PATHS[k]} />
        </svg>
      ))}
      {handle && (
        <span style={{ color, fontSize, fontWeight: 700, fontFamily: 'Arial, Helvetica, sans-serif', marginLeft: g * 0.5 }}>
          {handle}
        </span>
      )}
    </div>
  );
}
