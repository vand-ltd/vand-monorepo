"use client"

import * as React from "react"
import Image from "next/image"

const testStories = [
  {
    id: 1,
    title: "Breaking: Global Climate Summit Reaches Historic Agreement",
    image: "https://images.unsplash.com/photo-1569163139394-de4e5f43e4e3?w=1200&h=600&fit=crop",
    category: "Environment",
  },
  {
    id: 2,
    title: "Tech Giants Announce Revolutionary AI Partnership",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=600&fit=crop", 
    category: "Technology",
  },
];

export function CarouselSimple() {
  return (
    <div className="relative w-full h-full bg-error-light border-2 border-error">
      <div className="w-full h-full">
        {testStories.map((story, index) => (
          <div key={story.id} className={`absolute inset-0 ${index === 0 ? 'block' : 'hidden'}`}>
            <div className="relative w-full h-full bg-brand-light">
              <Image
                src={story.image}
                alt={story.title}
                fill
                className="object-cover"
                priority={index === 0}
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-black/30 z-10" />
              <div className="absolute bottom-4 left-4 text-white z-20">
                <h2 className="text-xl font-bold">{story.title}</h2>
                <span className="text-sm">{story.category}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
