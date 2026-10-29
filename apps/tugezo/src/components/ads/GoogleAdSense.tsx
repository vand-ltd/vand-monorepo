interface GoogleAdSenseProps {
  publisherId: string // Your Google AdSense publisher ID (ca-pub-XXXXXXXXXX)
}

// The AdSense loader, rendered in <head>. A plain <script> (not next/script) so
// it is in the server HTML exactly as Google's snippet — the AdSense site
// verification crawler looks for it there and flags next/script's extra
// data-nscript attribute. Individual ad units push themselves once mounted.
export default function GoogleAdSense({ publisherId }: GoogleAdSenseProps) {
  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
      crossOrigin="anonymous"
    />
  )
}
