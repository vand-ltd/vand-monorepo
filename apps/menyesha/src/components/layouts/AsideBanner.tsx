'use client'

import React, { ReactNode } from "react";
import Image from "next/image";
import { TrendingUp, Clock, Eye, ArrowUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type AsideBannerProps = {
  children: ReactNode;
};

const trendingStories = [
  { 
    title: "Breaking: Economic Summit Reaches Historic Agreement", 
    views: "2.4M", 
    time: "2 hours ago",
    category: "Politics",
    image: "https://images.unsplash.com/photo-1541872705-1f73c6400ec9?w=80&h=60&fit=crop"
  },
  { 
    title: "AI Revolution: New Technology Changes Healthcare", 
    views: "1.8M", 
    time: "4 hours ago",
    category: "Technology",
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=80&h=60&fit=crop"
  },
  { 
    title: "Climate Summit: World Leaders Unite on Green Energy", 
    views: "1.2M", 
    time: "6 hours ago",
    category: "Environment",
    image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=80&h=60&fit=crop"
  },
  { 
    title: "Sports Championship Sets New Global Records", 
    views: "980K", 
    time: "8 hours ago",
    category: "Sports",
    image: "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=80&h=60&fit=crop"
  },
  { 
    title: "Tech Giants Announce Groundbreaking Partnership", 
    views: "750K", 
    time: "12 hours ago",
    category: "Business",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=80&h=60&fit=crop"
  },
];

const AsideBanner = ({ children }: AsideBannerProps) => {
  return (
    <>
      {/* Top Banner Ad */}
      <div className='bg-background border-b px-4'>
        <div className="my-4 w-full max-w-[728px] mx-auto h-[120px] bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 rounded-lg flex items-center justify-center text-sm text-gray-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-50"></div>
          <div className="relative text-center">
            <div className="text-lg font-semibold text-gray-700 mb-1">Premium Advertisement Space</div>
            <span className="text-xs text-gray-500">728 × 90 (Desktop) / 320 × 100 (Mobile)</span>
          </div>
        </div>
      </div>

      <main className='w-full bg-gray-50 dark:bg-gray-900/50 overflow-hidden'>
        <div className='max-w-screen-xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8'>
          {/* Main Content */}
          <div className='w-full max-w-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border p-6 overflow-hidden'>
            {children}
          </div>

          {/* Enhanced Sidebar */}
          <aside className='space-y-6'>
            {/* Trending Stories */}
            <Card className="overflow-hidden">
              <div className="bg-brand-primary text-white p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <h3 className="font-bold text-lg">Trending Now</h3>
                </div>
              </div>
              <CardContent className="p-0">
                {trendingStories.map((story, index) => (
                  <div 
                    key={index} 
                    className="p-4 border-b last:border-b-0 hover:bg-brand-secondary dark:hover:bg-brand-accent hover:text-white dark:hover:text-white transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-brand-light text-brand-primary rounded-full flex items-center justify-center text-sm font-bold group-hover:text-white dark:group-hover:text-white">
                        {index + 1}
                      </div>
                      <div className="relative w-16 h-12 flex-shrink-0 rounded overflow-hidden">
                        <Image
                          src={story.image}
                          alt={story.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium line-clamp-2 group-hover:text-white dark:group-hover:text-white transition-colors leading-tight">
                          {story.title}
                        </h4>
                        <div className="flex items-center space-x-3 mt-2 text-xs text-muted-foreground group-hover:text-white dark:group-hover:text-white">
                          <span className="text-brand-primary font-medium group-hover:text-white dark:group-hover:text-white">{story.category}</span>
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>{story.views}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{story.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Side Advertisement */}
            <Card>
              <CardContent className="p-4">
                <div className="w-full h-[300px] bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 border border-purple-200 dark:border-purple-700 rounded-lg flex items-center justify-center text-sm text-purple-600 dark:text-purple-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-50"></div>
                  <div className="relative text-center">
                    <div className="text-base font-semibold mb-1">Advertisement</div>
                    <span className="text-xs">300 × 250 Sidebar Ad</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Today&apos;s Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Articles Published</span>
                    <span className="font-bold text-success">47</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Readers</span>
                    <span className="font-bold text-brand-primary">2.4M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Breaking Stories</span>
                    <span className="font-bold text-error">12</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Advertisement Section */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700">
              <CardContent className="p-4">
                <div className="text-center space-y-3">
                  <div className="text-xs text-brand-secondary dark:text-brand-secondary font-medium uppercase tracking-wide">
                    Sponsored Content
                  </div>
                  <div className="relative aspect-square w-24 mx-auto rounded-lg overflow-hidden bg-white dark:bg-gray-800 p-2">
                    <Image
                      src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=96&h=96&fit=crop"
                      alt="Company Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">
                      TechCorp Solutions
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      Revolutionizing business automation with AI-powered solutions. 
                      Join 10,000+ companies worldwide.
                    </p>
                  </div>
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                    Learn More
                  </button>
                  <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
                    <span>⭐</span>
                    <span>4.9/5</span>
                    <span>•</span>
                    <span>Trusted by 10K+ companies</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Newsletter Signup */}
            <Card className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-gray-800 dark:to-gray-800 border-brand-primary">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2 text-brand-primary dark:text-white">Stay Informed</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Get breaking news and exclusive analysis delivered to your inbox.
                </p>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                  <button className="w-full bg-brand-primary hover:bg-brand-secondary text-white py-2 rounded-lg text-sm font-medium transition-colors">
                    Subscribe Now
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Alternative Advertisement Layout */}
            <Card className="overflow-hidden">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-green-400 to-blue-500">
                <Image
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=320&h=240&fit=crop"
                  alt="Business Advertisement"
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 right-2">
                  <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">
                    Ad
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <h4 className="text-white font-bold text-sm mb-1">
                    Growth Marketing Platform
                  </h4>
                  <p className="text-gray-200 text-xs line-clamp-2">
                    Scale your business with data-driven marketing strategies
                  </p>
                </div>
              </div>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">MarketGrow Inc.</span>
                  <button className="bg-success hover:bg-green-700 text-white text-xs font-medium px-3 py-1 rounded transition-colors">
                    Try Free
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Back to Top */}
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowUp className="h-4 w-4" />
              <span>Back to Top</span>
            </button>
          </aside>
        </div>
      </main>
    </>
  );
};

export default AsideBanner;