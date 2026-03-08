import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Clock, Eye, Grid, List, Layers, Layout } from "lucide-react";

// Type definition for articles
interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  author: string;
  publishedAt: string;
  readTime: string;
  comments: number;
  views: string;
}

// Alternative layout components for news articles

// 1. Masonry/Pinterest-style layout
export const MasonryLayout = ({ articles }: { articles: Article[] }) => {
  return (
    <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
      {articles.map((article) => (
        <Link key={article.id} href={`/article/${article.slug}`} className="group block break-inside-avoid mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="relative h-48 overflow-hidden">
              <Image
                src={article.image}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3">
                <span className="bg-brand-primary text-white px-2 py-1 rounded-full text-xs font-bold">
                  {article.category}
                </span>
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-lg mb-3 group-hover:text-brand-primary transition-colors leading-tight">
                {article.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                {article.excerpt}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{article.publishedAt}</span>
                <div className="flex items-center space-x-2">
                  <Eye className="h-3 w-3" />
                  <span>{article.views}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

// 2. Newspaper column layout
export const NewspaperLayout = ({ articles }: { articles: Article[] }) => {
  const featuredArticle = articles[0];
  const columnArticles = articles.slice(1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Main feature article */}
      <div className="lg:col-span-2">
        <Link href={`/article/${featuredArticle.slug}`} className="group block">
          <div className="relative h-96 rounded-xl overflow-hidden">
            <Image
              src={featuredArticle.image}
              alt={featuredArticle.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className="bg-error px-3 py-1 rounded-full text-xs font-bold uppercase mb-3 inline-block">
                {featuredArticle.category}
              </span>
              <h2 className="text-2xl font-bold mb-2 group-hover:text-yellow-300 transition-colors">
                {featuredArticle.title}
              </h2>
              <p className="text-gray-200 text-sm">{featuredArticle.excerpt}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Column articles */}
      <div className="lg:col-span-2 space-y-6">
        {columnArticles.slice(0, 4).map((article) => (
          <Link key={article.id} href={`/article/${article.slug}`} className="group block">
            <div className="flex space-x-4 p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="relative w-20 h-16 flex-shrink-0 rounded overflow-hidden">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-brand-primary font-semibold">{article.category}</span>
                <h3 className="font-bold text-sm mb-1 group-hover:text-brand-primary transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{article.publishedAt}</span>
                  <span>•</span>
                  <span>{article.readTime}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

// 3. Magazine grid layout
export const MagazineGridLayout = ({ articles }: { articles: Article[] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {articles.map((article, index) => {
        const isLarge = index % 4 === 0;
        return (
          <Link 
            key={article.id} 
            href={`/article/${article.slug}`} 
            className={`group block ${isLarge ? 'md:col-span-2 lg:col-span-2' : ''}`}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className={`relative overflow-hidden ${isLarge ? 'h-64' : 'h-48'}`}>
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="bg-brand-primary text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                    {article.category}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className={`font-bold mb-2 group-hover:text-yellow-300 transition-colors ${isLarge ? 'text-xl' : 'text-lg'}`}>
                    {article.title}
                  </h3>
                  {isLarge && (
                    <p className="text-gray-200 text-sm mb-2">{article.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span>{article.publishedAt}</span>
                    <div className="flex items-center space-x-2">
                      <Eye className="h-3 w-3" />
                      <span>{article.views}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

// 4. Timeline/Feed layout
export const TimelineLayout = ({ articles }: { articles: Article[] }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>
        
        <div className="space-y-12">
          {articles.map((article) => (
            <div key={article.id} className="relative flex items-start space-x-8">
              {/* Timeline dot */}
              <div className="relative flex-shrink-0">
                <div className="w-4 h-4 bg-brand-primary rounded-full border-4 border-white dark:border-gray-900 shadow-lg"></div>
                <div className="absolute -top-1 -left-1 w-6 h-6 bg-brand-primary/20 rounded-full animate-ping"></div>
              </div>
              
              {/* Article content */}
              <Link href={`/article/${article.slug}`} className="group block flex-1">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-6">
                    <div className="relative w-full lg:w-64 h-48 lg:h-32 flex-shrink-0 rounded-lg overflow-hidden">
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="bg-brand-primary text-white px-2 py-1 rounded-full text-xs font-bold">
                          {article.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                        <Clock className="h-4 w-4" />
                        <span>{article.publishedAt}</span>
                        <span>•</span>
                        <span>{article.readTime}</span>
                      </div>
                      
                      <h3 className="text-xl font-bold mb-3 group-hover:text-brand-primary transition-colors">
                        {article.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                        {article.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-700">
                              {article.author.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          </div>
                          <span className="text-sm font-medium">{article.author}</span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>{article.views}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="h-3 w-3" />
                            <span>{article.comments}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 5. Bento box layout (Mixed sizes)
export const BentoLayout = ({ articles }: { articles: Article[] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 auto-rows-fr">
      {articles.map((article, index) => {
        // Define different sizes for bento box layout
        let colSpan = 'md:col-span-2';
        let rowSpan = 'row-span-1';
        
        if (index === 0) {
          colSpan = 'md:col-span-4 lg:col-span-3';
          rowSpan = 'row-span-2';
        } else if (index === 1) {
          colSpan = 'md:col-span-2 lg:col-span-3';
          rowSpan = 'row-span-1';
        } else if (index % 5 === 0) {
          colSpan = 'md:col-span-2';
          rowSpan = 'row-span-2';
        }
        
        return (
          <Link 
            key={article.id} 
            href={`/article/${article.slug}`} 
            className={`group block ${colSpan} ${rowSpan}`}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 h-full">
              <div className="relative h-full min-h-[200px]">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <div className="absolute top-4 left-4">
                  <span className="bg-brand-primary text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                    {article.category}
                  </span>
                </div>
                
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="font-bold mb-2 group-hover:text-yellow-300 transition-colors leading-tight text-sm lg:text-base">
                    {article.title}
                  </h3>
                  {index === 0 && (
                    <p className="text-gray-200 text-xs mb-2 line-clamp-2">{article.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span>{article.publishedAt}</span>
                    <div className="flex items-center space-x-2">
                      <Eye className="h-3 w-3" />
                      <span>{article.views}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

// Layout selector component
export const LayoutSelector = ({ 
  currentLayout, 
  onLayoutChange 
}: { 
  currentLayout: string;
  onLayoutChange: (layout: string) => void;
}) => {
  const layouts = [
    { id: 'magazine', name: 'Magazine', icon: Layout },
    { id: 'masonry', name: 'Masonry', icon: Grid },
    { id: 'newspaper', name: 'Newspaper', icon: List },
    { id: 'timeline', name: 'Timeline', icon: Clock },
    { id: 'bento', name: 'Bento', icon: Layers },
  ];

  return (
    <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {layouts.map((layout) => {
        const Icon = layout.icon;
        return (
          <button
            key={layout.id}
            onClick={() => onLayoutChange(layout.id)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentLayout === layout.id
                ? 'bg-white dark:bg-gray-700 text-brand-primary shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{layout.name}</span>
          </button>
        );
      })}
    </div>
  );
};
