import { useState } from 'react';
import { 
  MasonryLayout, 
  NewspaperLayout, 
  MagazineGridLayout, 
  TimelineLayout, 
  BentoLayout, 
  LayoutSelector 
} from '@/components/layouts/AlternativeLayouts';

// Sample articles data
const sampleArticles = [
  {
    id: 1,
    title: "Global Economic Summit Reaches Historic Climate Agreement",
    excerpt: "World leaders unite on unprecedented climate action plan, setting new standards for international cooperation and environmental protection.",
    image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop",
    category: "Politics",
    author: "Sarah Johnson",
    publishedAt: "2 hours ago",
    readTime: "5 min read",
    comments: 147,
    views: "2.4K",
  },
  {
    id: 2,
    title: "Revolutionary AI Breakthrough Transforms Medical Diagnosis",
    excerpt: "New artificial intelligence system demonstrates 99% accuracy in early disease detection, promising to revolutionize healthcare worldwide.",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop",
    category: "Technology",
    author: "Dr. Michael Chen",
    publishedAt: "4 hours ago",
    readTime: "4 min read",
    comments: 89,
    views: "1.8K",
  },
  {
    id: 3,
    title: "Championship Final Sets New Global Viewership Records",
    excerpt: "Historic sporting event draws over 2 billion viewers worldwide, breaking all previous records.",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=300&fit=crop",
    category: "Sports",
    author: "Alex Rodriguez",
    publishedAt: "6 hours ago",
    readTime: "3 min read",
    comments: 234,
    views: "3.1K",
  },
  {
    id: 4,
    title: "Clean Energy Initiative Promises 80% Cost Reduction",
    excerpt: "Groundbreaking solar technology breakthrough offers hope for affordable renewable energy.",
    image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600&h=300&fit=crop",
    category: "Environment",
    author: "Emma Watson",
    publishedAt: "8 hours ago",
    readTime: "6 min read",
    comments: 156,
    views: "1.5K",
  },
  {
    id: 5,
    title: "Financial Markets React to Central Bank Policy Shift",
    excerpt: "Major indices show significant movement following unexpected interest rate announcement.",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=300&fit=crop",
    category: "Business",
    author: "James Wilson",
    publishedAt: "12 hours ago",
    readTime: "4 min read",
    comments: 78,
    views: "1.2K",
  },
  {
    id: 6,
    title: "Space Exploration Mission Discovers New Exoplanet",
    excerpt: "NASA scientists confirm discovery of potentially habitable planet in nearby star system.",
    image: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=600&h=300&fit=crop",
    category: "Science",
    author: "Dr. Lisa Park",
    publishedAt: "1 day ago",
    readTime: "7 min read",
    comments: 312,
    views: "4.2K",
  },
];

const AlternativeLayoutsDemo = () => {
  const [currentLayout, setCurrentLayout] = useState('magazine');

  const renderLayout = () => {
    switch (currentLayout) {
      case 'masonry':
        return <MasonryLayout articles={sampleArticles} />;
      case 'newspaper':
        return <NewspaperLayout articles={sampleArticles} />;
      case 'magazine':
        return <MagazineGridLayout articles={sampleArticles} />;
      case 'timeline':
        return <TimelineLayout articles={sampleArticles} />;
      case 'bento':
        return <BentoLayout articles={sampleArticles} />;
      default:
        return <MagazineGridLayout articles={sampleArticles} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Alternative Article Layouts
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Explore different layout styles for displaying news articles. Each layout offers a unique user experience and visual appeal.
          </p>
          
          <LayoutSelector 
            currentLayout={currentLayout} 
            onLayoutChange={setCurrentLayout} 
          />
        </div>

        <div className="layout-container">
          {renderLayout()}
        </div>
      </div>
    </div>
  );
};

export default AlternativeLayoutsDemo;
