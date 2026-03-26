'use client'

import React from 'react'

interface GoogleAdBannerProps {
  adSlot: string
  adFormat?: 'auto' | 'rectangle' | 'horizontal' | 'vertical'
  style?: React.CSSProperties
  className?: string
  size?: 'small' | 'medium' | 'large' | 'leaderboard' | 'rectangle' | 'skyscraper'
}

const getAdDimensions = (size: string) => {
  switch (size) {
    case 'small':
      return { width: 320, height: 100 }
    case 'medium':
      return { width: 728, height: 90 }
    case 'large':
      return { width: 970, height: 250 }
    case 'leaderboard':
      return { width: 728, height: 90 }
    case 'rectangle':
      return { width: 300, height: 250 }
    case 'skyscraper':
      return { width: 160, height: 600 }
    default:
      return { width: 728, height: 90 }
  }
}

export const GoogleAdBanner: React.FC<GoogleAdBannerProps> = ({
  adSlot,
  style,
  className = '',
  size = 'medium'
}) => {
  const dimensions = getAdDimensions(size)
  
  React.useEffect(() => {
    try {
      // @ts-expect-error - AdSense global not typed
      (window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (err) {
      // AdSense initialization error
    }
  }, [])

  return (
    <div className={`my-4 flex justify-center ${className}`}>
      <div 
        className="bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-sm"
        style={{ 
          width: dimensions.width, 
          height: dimensions.height,
          ...style 
        }}
      >
        {/* Placeholder for development - replace with actual Google AdSense code */}
        <div className="text-center">
          <div className="text-lg font-semibold mb-1">Google Advertisement</div>
          <div className="text-xs opacity-75">{dimensions.width} × {dimensions.height}</div>
          <div className="text-xs opacity-50 mt-1">Slot: {adSlot}</div>
        </div>
        
        {/* Uncomment and configure when ready for production */}
        {/*
        <ins 
          className="adsbygoogle"
          style={{ 
            display: 'block',
            width: dimensions.width,
            height: dimensions.height
          }}
          data-ad-client="ca-pub-XXXXXXXXXX" // Replace with your AdSense client ID
          data-ad-slot={adSlot}
          data-ad-format={adFormat}
          data-full-width-responsive="true"
        />
        */}
      </div>
    </div>
  )
}

// Component for responsive ads that adapt to container size
export const GoogleAdResponsive: React.FC<{
  adSlot: string
  className?: string
}> = ({ adSlot, className = '' }) => {
  React.useEffect(() => {
    try {
      // @ts-expect-error - AdSense global not typed
      (window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (err) {
      // AdSense initialization error
    }
  }, [])

  return (
    <div className={`my-6 ${className}`}>
      <div className="bg-gray-100 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
        <div className="text-lg font-semibold mb-2">Responsive Google Advertisement</div>
        <div className="text-sm opacity-75">Adapts to container width</div>
        <div className="text-xs opacity-50 mt-1">Slot: {adSlot}</div>
        
        {/* Uncomment and configure when ready for production */}
        {/*
        <ins 
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-XXXXXXXXXX" // Replace with your AdSense client ID
          data-ad-slot={adSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        */}
      </div>
    </div>
  )
}
