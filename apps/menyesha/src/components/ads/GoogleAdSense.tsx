import Script from 'next/script'

interface GoogleAdSenseProps {
  publisherId: string // Your Google AdSense publisher ID (ca-pub-XXXXXXXXXX)
}

export default function GoogleAdSense({ publisherId }: GoogleAdSenseProps) {
  return (
    <>
      <Script
        id="google-adsense"
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <Script
        id="google-adsense-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (adsbygoogle = window.adsbygoogle || []).push({
              google_ad_client: "${publisherId}",
              enable_page_level_ads: true
            });
          `,
        }}
      />
    </>
  )
}
