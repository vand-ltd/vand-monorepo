'use client'

import Image from "next/image"
import { useState } from "react"
import { ChevronLeft, ChevronRight, Play, X, Camera, ExternalLink } from "lucide-react"

// Individual content block components
export const ArticleImage = ({ 
  src, 
  caption, 
  credit, 
  alt 
}: {
  src: string
  caption: string
  credit?: string
  alt: string
}) => (
  <figure className="my-8">
    <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-lg">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
      />
    </div>
    <figcaption className="mt-3 text-sm text-gray-600 dark:text-gray-400">
      <span className="block font-medium">{caption}</span>
      {credit && (
        <span className="text-xs text-gray-500 dark:text-gray-500 flex items-center mt-1">
          <Camera className="h-3 w-3 mr-1" />
          {credit}
        </span>
      )}
    </figcaption>
  </figure>
)

export const ArticleGallery = ({ 
  images 
}: {
  images: Array<{ src: string; caption: string; credit?: string }>
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <>
      <div className="my-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div 
              key={index} 
              className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow"
              onClick={() => {
                setCurrentIndex(index)
                setIsModalOpen(true)
              }}
            >
              <Image
                src={image.src}
                alt={image.caption}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-xs font-medium bg-black/50 backdrop-blur-sm rounded px-2 py-1 line-clamp-2">
                  {image.caption}
                </p>
              </div>
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-brand-primary text-white text-xs px-2 py-1 rounded">
                  Gallery
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 text-center">
          Click images to view gallery • {images.length} photos
        </p>
      </div>

      {/* Gallery Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full">
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Navigation buttons */}
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Image */}
            <div className="relative aspect-video w-full">
              <Image
                src={images[currentIndex].src}
                alt={images[currentIndex].caption}
                fill
                className="object-contain"
                sizes="90vw"
              />
            </div>

            {/* Caption */}
            <div className="bg-black/50 text-white p-4 rounded-b-lg">
              <p className="font-medium">{images[currentIndex].caption}</p>
              {images[currentIndex].credit && (
                <p className="text-sm text-gray-300 mt-1 flex items-center">
                  <Camera className="h-3 w-3 mr-1" />
                  {images[currentIndex].credit}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {currentIndex + 1} of {images.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export const ArticleQuote = ({ 
  content, 
  author, 
  title 
}: {
  content: string
  author: string
  title?: string
}) => (
  <blockquote className="my-8 relative">
    <div className="bg-gradient-to-r from-brand-light to-brand-subtle border-l-4 border-brand-primary p-6 rounded-r-lg">
      <div className="text-brand-primary text-6xl leading-none mb-2">&ldquo;</div>
      <p className="text-lg italic text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        {content}
      </p>
      <footer className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-sm">
            {author.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div>
          <cite className="font-semibold text-gray-900 dark:text-white not-italic">
            {author}
          </cite>
          {title && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          )}
        </div>
      </footer>
    </div>
  </blockquote>
)

export const ArticleInfographic = ({ 
  src, 
  caption, 
  credit 
}: {
  src: string
  caption: string
  credit?: string
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  return (
    <>
      <figure className="my-8">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <div 
            className="relative w-full aspect-[4/3] cursor-pointer group"
            onClick={() => setIsFullscreen(true)}
          >
            <Image
              src={src}
              alt={caption}
              fill
              className="object-contain group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, 80vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-lg" />
            <div className="absolute top-3 right-3 bg-brand-primary text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              Click to expand
            </div>
          </div>
        </div>
        <figcaption className="mt-3 text-sm text-gray-600 dark:text-gray-400 text-center">
          <span className="block font-medium">{caption}</span>
          {credit && (
            <span className="text-xs text-gray-500 dark:text-gray-500 flex items-center justify-center mt-1">
              <ExternalLink className="h-3 w-3 mr-1" />
              {credit}
            </span>
          )}
        </figcaption>
      </figure>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <div className="relative max-w-7xl w-full max-h-full">
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="relative w-full h-[80vh]">
              <Image
                src={src}
                alt={caption}
                fill
                className="object-contain"
                sizes="95vw"
              />
            </div>
            
            <div className="bg-black/50 text-white p-4 rounded-b-lg">
              <p className="font-medium">{caption}</p>
              {credit && (
                <p className="text-sm text-gray-300 mt-1 flex items-center">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  {credit}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export const ArticleSideBySide = ({ 
  leftImage, 
  rightImage 
}: {
  leftImage: { src: string; caption: string; credit?: string }
  rightImage: { src: string; caption: string; credit?: string }
}) => (
  <figure className="my-8">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-md">
          <Image
            src={leftImage.src}
            alt={leftImage.caption}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        <figcaption className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="block font-medium">{leftImage.caption}</span>
          {leftImage.credit && (
            <span className="text-xs text-gray-500 dark:text-gray-500 flex items-center mt-1">
              <Camera className="h-3 w-3 mr-1" />
              {leftImage.credit}
            </span>
          )}
        </figcaption>
      </div>
      
      <div>
        <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-md">
          <Image
            src={rightImage.src}
            alt={rightImage.caption}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        <figcaption className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="block font-medium">{rightImage.caption}</span>
          {rightImage.credit && (
            <span className="text-xs text-gray-500 dark:text-gray-500 flex items-center mt-1">
              <Camera className="h-3 w-3 mr-1" />
              {rightImage.credit}
            </span>
          )}
        </figcaption>
      </div>
    </div>
  </figure>
)

export const ArticleVideo = ({ 
  thumbnailSrc, 
  caption, 
  duration, 
  credit 
}: {
  thumbnailSrc: string
  caption: string
  duration: string
  credit?: string
}) => {
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlayClick = () => {
    setIsPlaying(true)
    // In a real implementation, this would trigger video playback
    // For demo purposes, we'll show a loading state
    setTimeout(() => {
      alert('Video playback would start here. In a real implementation, this would integrate with a video player like YouTube, Vimeo, or a custom video solution.')
      setIsPlaying(false)
    }, 1000)
  }

  return (
    <figure className="my-8">
      <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-lg cursor-pointer group">
        <Image
          src={thumbnailSrc}
          alt={caption}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, 80vw"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
        
        {/* Play button */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          onClick={handlePlayClick}
        >
          <div className="bg-black/70 text-white rounded-full p-4 group-hover:bg-black/80 transition-colors transform group-hover:scale-110 duration-300">
            {isPlaying ? (
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="h-8 w-8 fill-current ml-1" />
            )}
          </div>
        </div>
        
        {/* Duration badge */}
        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-sm px-2 py-1 rounded flex items-center space-x-1">
          <Play className="h-3 w-3" />
          <span>{duration}</span>
        </div>

        {/* Video label */}
        <div className="absolute top-3 left-3 bg-error text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span>VIDEO</span>
        </div>
      </div>
      <figcaption className="mt-3 text-sm text-gray-600 dark:text-gray-400">
        <span className="block font-medium">{caption}</span>
        {credit && (
          <span className="text-xs text-gray-500 dark:text-gray-500 flex items-center mt-1">
            <Play className="h-3 w-3 mr-1" />
            {credit}
          </span>
        )}
      </figcaption>
    </figure>
  )
}
