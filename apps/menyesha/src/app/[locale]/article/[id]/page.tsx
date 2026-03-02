import Image from "next/image";
import Link from "next/link";
import { 
  Clock, 
  Eye, 
  MessageCircle, 
  Share2, 
  BookmarkPlus, 
  Heart,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Tag,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GoogleAdBanner, GoogleAdResponsive } from "@/components/ads/GoogleAdBanner";
import { 
  ArticleImage, 
  ArticleGallery, 
  ArticleQuote, 
  ArticleInfographic, 
  ArticleSideBySide, 
  ArticleVideo 
} from "@/components/article/MediaComponents";

// Sample article data - in a real app, this would come from an API or database
const getArticleData = (id: string) => ({
  id: parseInt(id),
  title: "Global Economic Summit Reaches Historic Climate Agreement: A New Era of International Cooperation",
  subtitle: "World leaders unite on unprecedented climate action plan, setting new standards for international cooperation and environmental protection that could reshape global policy for decades to come.",
  
  // Rich multimedia content structure
  contentBlocks: [
    {
      type: "paragraph",
      content: "In a groundbreaking development that has captured the attention of the international community, world leaders have successfully reached a historic climate agreement during the Global Economic Summit held in Geneva this week. This unprecedented accord represents a significant milestone in international cooperation and environmental policy."
    },
    {
      type: "image",
      src: "https://picsum.photos/800/500?random=10",
      caption: "World leaders gather at the Global Economic Summit in Geneva to discuss climate action",
      credit: "Reuters/John Smith",
      alt: "World leaders at Geneva climate summit"
    },
    {
      type: "paragraph",
      content: "The agreement, which took three years of intensive negotiations to finalize, establishes binding commitments for carbon neutrality across 195 participating nations by 2045. The comprehensive framework includes specific targets for renewable energy adoption, deforestation reduction, and sustainable economic development practices."
    },
    {
      type: "heading",
      level: 2,
      content: "Key Provisions of the Agreement"
    },
    {
      type: "paragraph",
      content: "The historic accord encompasses several critical areas that will reshape global environmental policy. Most notably, the agreement mandates a 60% reduction in greenhouse gas emissions by 2030, with interim checkpoints every five years to ensure nations remain on track."
    },
    {
      type: "gallery",
      images: [
        {
          src: "https://picsum.photos/600/400?random=11",
          caption: "Solar panel installation in developing nations",
          credit: "EPA/Environmental Agency"
        },
        {
          src: "https://picsum.photos/600/400?random=12", 
          caption: "Wind farms across European coastlines",
          credit: "AP/Climate Photos"
        },
        {
          src: "https://picsum.photos/600/400?random=13",
          caption: "Reforestation efforts in South America",
          credit: "Greenpeace/Forest Initiative"
        },
        {
          src: "https://picsum.photos/600/400?random=14",
          caption: "Electric vehicle charging stations",
          credit: "Tesla/Sustainability Report"
        }
      ]
    },
    {
      type: "quote",
      content: "This agreement represents humanity's commitment to future generations. We are not just talking about policy changes; we are fundamentally restructuring how the global economy operates in harmony with our planet's natural systems.",
      author: "Dr. Elena Rodriguez",
      title: "Chief Climate Negotiator"
    },
    {
      type: "paragraph",
      content: "Furthermore, the agreement establishes a $500 billion international climate fund, sourced from participating nations based on their economic capacity and historical emissions. This fund will support developing countries in their transition to sustainable energy systems and help communities adapt to climate change impacts."
    },
    {
      type: "infographic",
      src: "https://picsum.photos/700/500?random=15",
      caption: "Climate funding breakdown by region and initiative",
      credit: "UN Climate Data/Visualization Team"
    },
    {
      type: "heading",
      level: 2,
      content: "Implementation Timeline"
    },
    {
      type: "paragraph",
      content: "The implementation strategy spans over two decades, with clear milestones and accountability measures. Phase one, beginning in 2025, focuses on immediate emissions reductions and the establishment of monitoring systems."
    },
    {
      type: "image",
      src: "https://picsum.photos/800/450?random=16",
      caption: "Timeline visualization of climate agreement phases",
      credit: "Climate Action Network",
      alt: "Climate agreement implementation timeline"
    },
    {
      type: "paragraph",
      content: "Each participating nation will submit annual progress reports, reviewed by an independent international panel of climate scientists and policy experts. Nations that fail to meet their commitments will face graduated consequences, including trade restrictions and reduced access to international climate funding."
    },
    {
      type: "heading",
      level: 2,
      content: "Global Reactions and Future Outlook"
    },
    {
      type: "paragraph",
      content: "The international response has been overwhelmingly positive, with environmental organizations, business leaders, and civil society groups praising the agreement's ambition and comprehensive scope. Stock markets have responded favorably, with renewable energy companies seeing significant gains."
    },
    {
      type: "sideBySide",
      leftImage: {
        src: "https://picsum.photos/400/300?random=17",
        caption: "Protests supporting climate action",
        credit: "AP/Climate Activism"
      },
      rightImage: {
        src: "https://picsum.photos/400/300?random=18", 
        caption: "Business leaders endorsing agreement",
        credit: "Business Weekly/Summit Coverage"
      }
    },
    {
      type: "paragraph",
      content: "However, some critics argue that the timeline may be too aggressive for certain developing economies, raising concerns about economic disruption and social impacts. Proponents counter that the accelerated timeline is necessary given the urgency of the climate crisis."
    },
    {
      type: "video",
      thumbnailSrc: "https://picsum.photos/800/450?random=19",
      caption: "Watch: Key moments from the climate agreement signing ceremony",
      duration: "3:45",
      credit: "Geneva Summit Media"
    }
  ],
  image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=600&fit=crop",
  category: "Politics",
  author: {
    name: "Sarah Johnson",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=200&h=200&fit=crop&crop=face",
    bio: "Senior International Affairs Correspondent with over 15 years of experience covering global politics and environmental policy. Based in Geneva, Switzerland.",
    articles: 247,
    followers: "12.5K"
  },
  publishedAt: "2024-08-05T10:30:00Z",
  updatedAt: "2024-08-05T14:20:00Z",
  readTime: "8 min read",
  views: "24.7K",
  likes: 892,
  comments: 156,
  shares: 234,
  tags: ["Climate Change", "International Politics", "Environmental Policy", "Global Economy", "Sustainability"],
  relatedArticles: [
    {
      id: 2,
      title: "Renewable Energy Markets Surge Following Climate Agreement",
      image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400&h=250&fit=crop",
      category: "Business",
      readTime: "5 min read",
      publishedAt: "4 hours ago"
    },
    {
      id: 3,
      title: "Tech Giants Pledge $50 Billion for Green Innovation",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=250&fit=crop",
      category: "Technology",
      readTime: "6 min read",
      publishedAt: "6 hours ago"
    },
    {
      id: 4,
      title: "How Small Nations Are Leading the Climate Revolution",
      image: "https://images.unsplash.com/photo-1569163139394-de4e4f43e4e3?w=400&h=250&fit=crop",
      category: "Environment",
      readTime: "7 min read",
      publishedAt: "1 day ago"
    }
  ]
});

// Sample comments data
const getCommentsData = () => [
  {
    id: 1,
    fullName: "Michael Chen",
    comment: "This is exactly the kind of international cooperation we need to see more of. The binding commitments are particularly encouraging, as previous agreements often lacked enforcement mechanisms.",
    timeAgo: "2 hours ago",
    likes: 24,
    dislikes: 3,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
  },
  {
    id: 2,
    fullName: "Dr. Sarah Williams",
    comment: "While I appreciate the ambitious timeline, I'm concerned about the implementation challenges for developing nations. The $500 billion fund is a good start, but we need to ensure equitable distribution.",
    timeAgo: "4 hours ago",
    likes: 18,
    dislikes: 7,
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=face"
  },
  {
    id: 3,
    fullName: "James Rodriguez",
    comment: "Finally! This agreement gives me hope for my children's future. The interim checkpoints every five years will be crucial for accountability.",
    timeAgo: "6 hours ago",
    likes: 31,
    dislikes: 2,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
  }
];

const categoryStyles = {
  Politics: { bg: "bg-red-100", text: "text-error", border: "border-red-200" },
  Technology: { bg: "bg-blue-100", text: "text-brand-primary", border: "border-blue-200" },
  Business: { bg: "bg-purple-100", text: "text-brand-secondary", border: "border-purple-200" },
  Environment: { bg: "bg-emerald-100", text: "text-success", border: "border-emerald-200" },
};

export default async function ArticlePage({ 
  params 
}: { 
  params: Promise<{ locale: string; id: string }> 
}) {
  const { locale, id } = await params;
  const articleData = getArticleData(id);
  const commentsData = getCommentsData();
  const categoryStyle = categoryStyles[articleData.category as keyof typeof categoryStyles];
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link href="/" className="navigation-link inline-flex items-center space-x-2 text-brand-primary hover:text-brand-secondary dark:hover:text-brand-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Article Header */}
      <article className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
        {/* Hero Image */}
        <div className="relative h-96 md:h-[500px]">
          <Image
            src={articleData.image}
            alt={articleData.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Category Badge */}
          <div className="absolute top-6 left-6">
            <span className={`${categoryStyle.bg} ${categoryStyle.text} px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide`}>
              {articleData.category}
            </span>
          </div>

          {/* Social Actions */}
          <div className="absolute top-6 right-6 flex space-x-2">
            <button className="p-3 bg-white/80 hover:bg-white rounded-full transition-colors">
              <BookmarkPlus className="h-5 w-5 text-gray-700" />
            </button>
            <button className="p-3 bg-white/80 hover:bg-white rounded-full transition-colors">
              <Share2 className="h-5 w-5 text-gray-700" />
            </button>
          </div>

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
              {articleData.title}
            </h1>
            <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
              {articleData.subtitle}
            </p>
          </div>
        </div>

        {/* Article Meta */}
        <div className="p-6 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Author Info */}
            <div className="flex items-center space-x-4">
              <div className="relative w-12 h-12">
                <Image
                  src={articleData.author.avatar}
                  alt={articleData.author.name}
                  fill
                  className="object-cover rounded-full"
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{articleData.author.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Senior International Affairs Correspondent</p>
              </div>
            </div>

            {/* Article Stats */}
            <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(articleData.publishedAt)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{articleData.readTime}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{articleData.views}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Google Ad Banner - Top Position */}
        <div className="px-6">
          <GoogleAdBanner 
            adSlot="article-top-banner"
            size="leaderboard"
            className="border-t border-b py-4"
          />
        </div>

        {/* Article Content */}
        <div className="p-6 md:p-8">
          {/* Content Blocks */}
          <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300">
            {articleData.contentBlocks.map((block, index) => {
              // Insert ad after the first few blocks
              const shouldShowMidAd = index === Math.floor(articleData.contentBlocks.length * 0.4);
              
              return (
                <div key={index}>
                  {/* Render content block */}
                  {block.type === 'paragraph' && (
                    <p className="mb-6 leading-relaxed">{block.content}</p>
                  )}
                  
                  {block.type === 'heading' && block.level === 2 && (
                    <h2 className="text-2xl font-bold mt-8 mb-4">{block.content}</h2>
                  )}
                  
                  {block.type === 'heading' && block.level === 3 && (
                    <h3 className="text-xl font-semibold mt-6 mb-3">{block.content}</h3>
                  )}
                  
                  {block.type === 'image' && block.src && (
                    <ArticleImage 
                      src={block.src}
                      caption={block.caption || ''}
                      credit={block.credit}
                      alt={block.alt || block.caption || ''}
                    />
                  )}
                  
                  {block.type === 'gallery' && block.images && (
                    <ArticleGallery images={block.images} />
                  )}
                  
                  {block.type === 'quote' && (
                    <ArticleQuote 
                      content={block.content || ''}
                      author={block.author || ''}
                      title={block.title}
                    />
                  )}
                  
                  {block.type === 'infographic' && block.src && (
                    <ArticleInfographic 
                      src={block.src}
                      caption={block.caption || ''}
                      credit={block.credit}
                    />
                  )}
                  
                  {block.type === 'sideBySide' && block.leftImage && block.rightImage && (
                    <ArticleSideBySide 
                      leftImage={block.leftImage}
                      rightImage={block.rightImage}
                    />
                  )}
                  
                  {block.type === 'video' && block.thumbnailSrc && (
                    <ArticleVideo 
                      thumbnailSrc={block.thumbnailSrc}
                      caption={block.caption || ''}
                      duration={block.duration || ''}
                      credit={block.credit}
                    />
                  )}
                  
                  {/* Mid-article ad */}
                  {shouldShowMidAd && (
                    <GoogleAdResponsive 
                      adSlot="article-mid-content"
                      className="my-8 border-t border-b py-6 bg-gray-50 dark:bg-gray-800/50"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Tags */}
          <div className="mt-8 pt-6 border-t">
            <div className="flex flex-wrap gap-2">
              {articleData.tags.map((tag, index) => (
                <Link
                  key={index}
                  href={`/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}
                  className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-brand-secondary hover:text-white dark:hover:bg-brand-accent transition-colors"
                >
                  <Tag className="h-3 w-3" />
                  <span>{tag}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Engagement Actions */}
          <div className="mt-8 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <button className="flex items-center space-x-2 text-gray-600 hover:text-error transition-colors">
                  <Heart className="h-5 w-5" />
                  <span>{articleData.likes}</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 hover:text-brand-primary dark:hover:text-brand-accent transition-colors">
                  <MessageCircle className="h-5 w-5" />
                  <span>{articleData.comments}</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 hover:text-success transition-colors">
                  <Share2 className="h-5 w-5" />
                  <span>{articleData.shares}</span>
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Share:</span>
                <button className="p-2 text-brand-primary hover:bg-brand-secondary hover:text-white dark:text-white dark:hover:bg-brand-accent rounded-full transition-colors">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>
                <button className="p-2 text-brand-primary hover:bg-brand-secondary hover:text-white dark:text-white dark:hover:bg-brand-accent rounded-full transition-colors">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"/>
                  </svg>
                </button>
                <button className="p-2 text-brand-secondary hover:bg-brand-secondary hover:text-white dark:text-white dark:hover:bg-brand-accent rounded-full transition-colors">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Author Bio */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="relative w-20 h-20 flex-shrink-0">
              <Image
                src={articleData.author.avatar}
                alt={articleData.author.name}
                fill
                className="object-cover rounded-full"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{articleData.author.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">{articleData.author.bio}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{articleData.author.articles} articles</span>
                <span>{articleData.author.followers} followers</span>
                <button className="text-brand-primary hover:text-brand-secondary dark:text-white dark:hover:text-brand-accent font-medium">Follow</button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Ad Banner - After Author Bio */}
      <GoogleAdBanner 
        adSlot="article-after-author"
        size="large"
        className="my-8"
      />

      {/* Related Articles */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Related Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articleData.relatedArticles.map((article) => {
            const relatedCategoryStyle = categoryStyles[article.category as keyof typeof categoryStyles];
            
            return (
              <Link key={article.id} href={`/article/${article.id}`} className="group block">
                <Card className="overflow-hidden border hover:shadow-lg transition-shadow duration-300">
                  <div className="relative h-48">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`${relatedCategoryStyle.bg} ${relatedCategoryStyle.text} px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide`}>
                        {article.category}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{article.publishedAt}</span>
                      <span>{article.readTime}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Google Ad Banner - Before Navigation */}
      <GoogleAdResponsive 
        adSlot="article-before-navigation"
        className="my-8"
      />

      {/* Navigation to Next/Previous Articles */}
      <div className="mt-12 flex justify-between items-center py-6 border-t">
        <Link href="/article/1" className="flex items-center space-x-2 text-brand-primary hover:text-brand-secondary dark:text-white dark:hover:text-brand-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Previous Article</span>
        </Link>
        <Link href="/article/3" className="flex items-center space-x-2 text-brand-primary hover:text-brand-secondary dark:text-white dark:hover:text-brand-accent transition-colors">
          <span>Next Article</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Comment Form Section */}
      <Card className="mt-12">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Leave a Comment</h2>
          <form className="space-y-4">
            <div>
              <Label htmlFor="full-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </Label>
              <Input 
                id="full-name" 
                placeholder="John Doe" 
                className="w-full"
                required
              />
            </div>
            <div>
              <Label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Comment
              </Label>
              <Textarea 
                id="comment" 
                placeholder="Share your thoughts..." 
                className="w-full"
                rows={4}
                required
              />
            </div>
            <div className="flex justify-end">
              <Button 
                type="submit" 
                className="px-6 py-2 bg-brand-accent text-white hover:bg-brand-secondary dark:hover:bg-brand-accent transition-colors"
              >
                Post Comment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Comments Display Section */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Comments ({commentsData.length})
          </h2>
          <div className="space-y-6">
            {commentsData.map((comment) => (
              <div key={comment.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-6 last:pb-0">
                <div className="flex items-start space-x-4">
                  {/* Avatar */}
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <Image
                      src={comment.avatar}
                      alt={comment.fullName}
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                  
                  {/* Comment Content */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {comment.fullName}
                      </h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {comment.timeAgo}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                      {comment.comment}
                    </p>
                    
                    {/* Like/Dislike Actions */}
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-success transition-colors">
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-sm">{comment.likes}</span>
                      </button>
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-error transition-colors">
                        <ThumbsDown className="h-4 w-4" />
                        <span className="text-sm">{comment.dislikes}</span>
                      </button>
                      <button className="text-sm text-brand-primary hover:text-brand-secondary dark:text-white dark:hover:text-brand-accent transition-colors">
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string; id: string }> 
}) {
  const { id } = await params;
  const articleData = getArticleData(id);
  
  return {
    title: articleData.title,
    description: articleData.subtitle,
    openGraph: {
      title: articleData.title,
      description: articleData.subtitle,
      images: [articleData.image],
    },
  };
}
