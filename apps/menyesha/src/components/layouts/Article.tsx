'use client'

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { MessageCircle, Clock, Eye, ArrowRight, BookmarkPlus, TrendingUp, Share2, Heart, Grid, List, Zap } from "lucide-react";

// Sample articles data
const heroArticle = {
  id: 1,
  title: "Breakthrough Gene Therapy Trial Shows 95% Success Rate",
  excerpt: "Revolutionary treatment for rare genetic disorders demonstrates unprecedented success in clinical trials, offering hope to millions of patients worldwide and marking a new era in personalized medicine.",
  image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=600&fit=crop",
  category: "Medical",
  author: "Dr. Sarah Johnson",
  publishedAt: "1 hour ago",
  readTime: "7 min read",
  comments: 189,
  views: "18.2K",
  isBreaking: true,
  priority: "high"
};

const regularArticles = [
  {
    id: 5,
    title: "Cryptocurrency Market Stabilizes After Volatile Week",
    excerpt: "Digital currencies show signs of recovery following regulatory clarity from major financial institutions worldwide.",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=250&fit=crop",
    category: "Finance",
    author: "Alex Thompson",
    publishedAt: "10 hours ago",
    readTime: "4 min read",
    comments: 76,
    views: "6.2K",
  },
  {
    id: 6,
    title: "Mars Rover Discovers Evidence of Ancient Water Flow",
    excerpt: "Latest findings from red planet exploration reveal new insights into Mars' geological history and potential for past life.",
    image: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=400&h=250&fit=crop",
    category: "Space",
    author: "Dr. Lisa Park",
    publishedAt: "12 hours ago",
    readTime: "6 min read",
    comments: 145,
    views: "14.7K",
  },
  {
    id: 7,
    title: "Urban Vertical Farming Revolution Transforms Cities",
    excerpt: "Innovative agricultural technology brings fresh produce to metropolitan areas while reducing environmental impact.",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=250&fit=crop",
    category: "Innovation",
    author: "Maya Singh",
    publishedAt: "1 day ago",
    readTime: "5 min read",
    comments: 98,
    views: "8.3K",
  },
  {
    id: 8,
    title: "Revolutionary Smart City Infrastructure Unveiled",
    excerpt: "Futuristic urban planning project integrates IoT, renewable energy, and AI to create sustainable metropolitan environments.",
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=250&fit=crop",
    category: "Technology",
    author: "David Kim",
    publishedAt: "2 days ago",
    readTime: "6 min read",
    comments: 91,
    views: "5.7K",
  },
  {
    id: 9,
    title: "Breakthrough in Alzheimer's Disease Treatment",
    excerpt: "Clinical trials show promising results for new therapy that could slow cognitive decline and improve quality of life for patients.",
    image: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=250&fit=crop",
    category: "Medical",
    author: "Dr. Rebecca Chen",
    publishedAt: "2 days ago",
    readTime: "7 min read",
    comments: 156,
    views: "12.8K",
  },
];

const categoryStyles: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  "Breaking News": { bg: "bg-error", text: "text-white", dot: "bg-error", border: "border-error" },
  Medical: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300", dot: "bg-cyan-500", border: "border-cyan-200" },
  Technology: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", dot: "bg-brand-primary", border: "border-brand-primary" },
  History: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500", border: "border-amber-200" },
  Environment: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500", border: "border-emerald-200" },
  Finance: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", dot: "bg-purple-500", border: "border-purple-200" },
  Space: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300", dot: "bg-indigo-500", border: "border-indigo-200" },
  Innovation: { bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-300", dot: "bg-teal-500", border: "border-teal-200" },
  Politics: { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-700 dark:text-gray-300", dot: "bg-gray-500", border: "border-gray-200" },
};

const Article = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  return (
    <div className="w-full space-y-8 sm:space-y-12">
      {/* Hero Section */}
      <section className="relative w-full max-w-full overflow-hidden">
        <Link href={`/article/${heroArticle.id}`} className="group block">
          <div className="relative h-[400px] sm:h-[500px] lg:h-[600px] rounded-xl lg:rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-black shadow-2xl">
            <Image
              src={heroArticle.image}
              alt={heroArticle.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            {/* Breaking Badge */}
            {heroArticle.isBreaking && (
              <div className="absolute top-4 sm:top-6 left-4 sm:left-6">
                <div className="bg-error text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse flex items-center space-x-2 shadow-lg">
                  <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white rounded-full animate-ping"></div>
                  <span>Live</span>
                </div>
              </div>
            )}

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8 xl:p-12 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-4 sm:mb-6">
                <span className="bg-error text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg inline-block w-fit">
                  {heroArticle.category}
                </span>
                <div className="flex items-center space-x-2 text-xs sm:text-sm opacity-90">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{heroArticle.publishedAt}</span>
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-5xl font-bold leading-tight mb-3 sm:mb-4 lg:mb-6 group-hover:text-brand-accent transition-colors duration-300 max-w-4xl">
                {heroArticle.title}
              </h1>

              <p className="text-gray-200 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base lg:text-lg xl:text-xl max-w-4xl line-clamp-3 sm:line-clamp-none">
                {heroArticle.excerpt}
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 lg:w-12 sm:h-10 lg:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold">{heroArticle.author.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm sm:text-base">{heroArticle.author}</div>
                    <div className="text-xs sm:text-sm opacity-75">{heroArticle.readTime}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm opacity-90">
                  <div className="flex items-center space-x-1.5 bg-white/10 backdrop-blur-sm rounded-full px-2.5 sm:px-3 py-1">
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{heroArticle.views}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-white/10 backdrop-blur-sm rounded-full px-2.5 sm:px-3 py-1">
                    <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{heroArticle.comments}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* Latest News */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8 space-y-3 sm:space-y-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-2 sm:space-x-3">
            <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-brand-accent" />
            <span>Latest Stories</span>
          </h2>
          <div className="flex items-center space-x-2">
            <div className="relative group">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                Grid view
              </div>
            </div>

            <div className="relative group">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                List view
              </div>
            </div>
          </div>
        </div>

        <div className={`space-y-5 lg:space-y-6 ${viewMode === 'grid' ? 'md:grid md:grid-cols-2 md:gap-6 md:space-y-0' : ''}`}>
          {regularArticles.map((article) => {
            const categoryStyle = categoryStyles[article.category] || categoryStyles.Politics;

            return (
              <Link key={article.id} href={`/article/${article.id}`} className="group block">
                <article className={`relative ${
                  viewMode === 'grid'
                    ? 'flex flex-col space-y-4 p-4 sm:p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-brand-primary/40 transition-all duration-300 transform hover:-translate-y-1'
                    : 'flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 lg:space-x-8 p-4 sm:p-5 lg:p-6 bg-white dark:bg-gray-800 rounded-xl lg:rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-brand-primary/40 transition-all duration-300 transform hover:-translate-y-1'
                }`}>

                  {/* Article Image */}
                  <div className={`relative ${
                    viewMode === 'grid'
                      ? 'w-full h-48 sm:h-52'
                      : 'w-full md:w-60 lg:w-72 h-48 sm:h-52 md:h-40 lg:h-44'
                  } flex-shrink-0 rounded-lg lg:rounded-xl overflow-hidden`}>
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`${categoryStyle.bg} ${categoryStyle.text} px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide`}>
                        {article.category}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute top-3 right-3 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button className="p-1.5 bg-white/90 hover:bg-brand-primary hover:text-white rounded-full transition-colors shadow-sm">
                        <BookmarkPlus className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1.5 bg-white/90 hover:bg-brand-primary hover:text-white rounded-full transition-colors shadow-sm">
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Article Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 text-xs text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{article.publishedAt}</span>
                        </div>
                        <span>·</span>
                        <span>{article.readTime}</span>
                        <div className="flex items-center space-x-1">
                          <Heart className="h-3 w-3" />
                          <span>24</span>
                        </div>
                      </div>

                      <h3 className={`font-bold text-gray-900 dark:text-white group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors leading-tight ${
                        viewMode === 'grid'
                          ? 'text-base sm:text-lg mb-2'
                          : 'text-lg sm:text-xl lg:text-2xl mb-3'
                      }`}>
                        {article.title}
                      </h3>

                      <p className={`text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 ${
                        viewMode === 'grid'
                          ? 'text-sm mb-3'
                          : 'text-sm sm:text-base mb-4 sm:line-clamp-3'
                      }`}>
                        {article.excerpt}
                      </p>
                    </div>

                    <div className={`flex ${
                      viewMode === 'grid'
                        ? 'flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'
                        : 'flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center ${
                          viewMode === 'grid' ? 'w-7 h-7' : 'w-8 h-8 sm:w-9 sm:h-9'
                        }`}>
                          <span className="font-bold text-white text-xs">
                            {article.author.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <div className={`font-semibold text-gray-900 dark:text-white ${
                            viewMode === 'grid' ? 'text-xs' : 'text-sm'
                          }`}>{article.author}</div>
                          <div className={`text-gray-400 ${
                            viewMode === 'grid' ? 'text-xs' : 'text-xs'
                          }`}>Senior Reporter</div>
                        </div>
                      </div>

                      <div className={`flex items-center space-x-3 text-gray-400 ${
                        viewMode === 'grid' ? 'text-xs' : 'text-xs sm:text-sm'
                      }`}>
                        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-full px-2.5 py-1">
                          <Eye className="h-3 w-3" />
                          <span>{article.views}</span>
                        </div>
                        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-full px-2.5 py-1">
                          <MessageCircle className="h-3 w-3" />
                          <span>{article.comments}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Load More Section */}
      <div className="text-center py-8 sm:py-12 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-md mx-auto space-y-4">
          <button
            className="group relative w-full bg-gradient-breaking-news text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl flex items-center justify-center space-x-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-brand-accent via-brand-secondary to-brand-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative flex items-center space-x-3">
              <TrendingUp className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
              <span className="text-lg font-semibold tracking-wide">Load More Stories</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </button>

          <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse"></div>
              <span>More stories available</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Eye className="h-3.5 w-3.5" />
              <span>500+ articles</span>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2 pt-1">
            <span className="text-xs text-gray-400">Or browse by:</span>
            <button className="text-xs text-brand-primary dark:text-brand-accent hover:underline transition-colors font-medium">
              Categories
            </button>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <button className="text-xs text-brand-primary dark:text-brand-accent hover:underline transition-colors font-medium">
              Popular
            </button>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <button className="text-xs text-brand-primary dark:text-brand-accent hover:underline transition-colors font-medium">
              Recent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Article;
