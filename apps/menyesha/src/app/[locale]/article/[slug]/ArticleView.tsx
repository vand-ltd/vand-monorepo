'use client';

import { useQuery } from '@tanstack/react-query';
import { getArticleBySlug, getRelatedArticles } from '@org/api';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  Eye,
  ArrowLeft,
  Calendar,
  Tag,
  User,
  Zap,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CommentSection } from '@/components/article/CommentSection';
import { ShareButton } from '@/components/article/ShareButton';

// Category color map keyed by slug
const categoryColorMap: Record<string, { lightBg: string; darkBg: string; lightText: string; darkText: string }> = {
  'breaking-news': { lightBg: '#fee2e2', darkBg: '#7f1d1d', lightText: '#dc2626', darkText: '#fca5a5' },
  medical:         { lightBg: '#cffafe', darkBg: 'rgba(8,145,178,0.3)', lightText: '#0e7490', darkText: '#67e8f9' },
  technology:      { lightBg: '#dbeafe', darkBg: 'rgba(29,78,216,0.3)', lightText: '#1d4ed8', darkText: '#93c5fd' },
  history:         { lightBg: '#fef3c7', darkBg: 'rgba(180,83,9,0.3)', lightText: '#b45309', darkText: '#fcd34d' },
  environment:     { lightBg: '#d1fae5', darkBg: 'rgba(4,120,87,0.3)', lightText: '#047857', darkText: '#6ee7b7' },
  finance:         { lightBg: '#ede9fe', darkBg: 'rgba(109,40,217,0.3)', lightText: '#7c3aed', darkText: '#c4b5fd' },
  innovation:      { lightBg: '#ccfbf1', darkBg: 'rgba(13,148,136,0.3)', lightText: '#0d9488', darkText: '#5eead4' },
  education:       { lightBg: '#ffedd5', darkBg: 'rgba(194,65,12,0.3)', lightText: '#c2410c', darkText: '#fdba74' },
  science:         { lightBg: '#ffe4e6', darkBg: 'rgba(190,18,60,0.3)', lightText: '#be123c', darkText: '#fda4af' },
  business:        { lightBg: '#dcfce7', darkBg: 'rgba(21,128,61,0.3)', lightText: '#15803d', darkText: '#86efac' },
  sports:          { lightBg: '#fee2e2', darkBg: 'rgba(185,28,28,0.3)', lightText: '#b91c1c', darkText: '#fca5a5' },
  politics:        { lightBg: '#f3f4f6', darkBg: '#374151', lightText: '#374151', darkText: '#d1d5db' },
  // Subcategories (regions)
  africa:          { lightBg: '#fef3c7', darkBg: 'rgba(180,83,9,0.3)', lightText: '#92400e', darkText: '#fcd34d' },
  afrique:         { lightBg: '#fef3c7', darkBg: 'rgba(180,83,9,0.3)', lightText: '#92400e', darkText: '#fcd34d' },
  afurika:         { lightBg: '#fef3c7', darkBg: 'rgba(180,83,9,0.3)', lightText: '#92400e', darkText: '#fcd34d' },
  europe:          { lightBg: '#dbeafe', darkBg: 'rgba(29,78,216,0.3)', lightText: '#1e40af', darkText: '#93c5fd' },
  uburayi:         { lightBg: '#dbeafe', darkBg: 'rgba(29,78,216,0.3)', lightText: '#1e40af', darkText: '#93c5fd' },
  international:   { lightBg: '#e0e7ff', darkBg: 'rgba(67,56,202,0.3)', lightText: '#4338ca', darkText: '#a5b4fc' },
  mpuzamahanga:    { lightBg: '#e0e7ff', darkBg: 'rgba(67,56,202,0.3)', lightText: '#4338ca', darkText: '#a5b4fc' },
};

function getCategoryColors(slug: string) {
  const c = categoryColorMap[slug] || { lightBg: '#f3f4f6', darkBg: '#374151', lightText: '#374151', darkText: '#d1d5db' };
  return {
    backgroundColor: `light-dark(${c.lightBg}, ${c.darkBg})`,
    color: `light-dark(${c.lightText}, ${c.darkText})`,
  };
}

// Tiptap JSON renderer
function renderTiptapNode(node: any, index: number): React.ReactNode {
  if (!node) return null;

  switch (node.type) {
    case 'doc':
      return node.content?.map((child: any, i: number) => renderTiptapNode(child, i));

    case 'paragraph':
      return (
        <p key={index} className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300" style={{ textAlign: node.attrs?.textAlign || undefined }}>
          {node.content?.map((child: any, i: number) => renderTiptapNode(child, i)) || <br />}
        </p>
      );

    case 'heading': {
      const level = node.attrs?.level || 2;
      const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements;
      const classes: Record<number, string> = {
        1: 'text-3xl font-bold mt-8 mb-4',
        2: 'text-2xl font-bold mt-8 mb-4',
        3: 'text-xl font-semibold mt-6 mb-3',
        4: 'text-lg font-semibold mt-4 mb-2',
      };
      return (
        <HeadingTag key={index} className={classes[level] || classes[2]}>
          {node.content?.map((child: any, i: number) => renderTiptapNode(child, i))}
        </HeadingTag>
      );
    }

    case 'text': {
      let element: React.ReactNode = node.text;
      if (node.marks) {
        for (const mark of node.marks) {
          switch (mark.type) {
            case 'bold':
              element = <strong key={index}>{element}</strong>;
              break;
            case 'italic':
              element = <em key={index}>{element}</em>;
              break;
            case 'underline':
              element = <u key={index}>{element}</u>;
              break;
            case 'strike':
              element = <s key={index}>{element}</s>;
              break;
            case 'link':
              element = (
                <a key={index} href={mark.attrs?.href} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                  {element}
                </a>
              );
              break;
            case 'code':
              element = <code key={index} className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">{element}</code>;
              break;
          }
        }
      }
      return element;
    }

    case 'bulletList':
      return (
        <ul key={index} className="list-disc pl-6 mb-4 space-y-1 text-gray-700 dark:text-gray-300">
          {node.content?.map((child: any, i: number) => renderTiptapNode(child, i))}
        </ul>
      );

    case 'orderedList':
      return (
        <ol key={index} className="list-decimal pl-6 mb-4 space-y-1 text-gray-700 dark:text-gray-300">
          {node.content?.map((child: any, i: number) => renderTiptapNode(child, i))}
        </ol>
      );

    case 'listItem':
      return (
        <li key={index}>
          {node.content?.map((child: any, i: number) => renderTiptapNode(child, i))}
        </li>
      );

    case 'blockquote':
      return (
        <blockquote key={index} className="border-l-4 border-brand-primary pl-4 my-6 italic text-gray-600 dark:text-gray-400">
          {node.content?.map((child: any, i: number) => renderTiptapNode(child, i))}
        </blockquote>
      );

    case 'codeBlock':
      return (
        <pre key={index} className="bg-gray-900 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto">
          <code>{node.content?.map((child: any, i: number) => renderTiptapNode(child, i))}</code>
        </pre>
      );

    case 'image':
      return (
        <figure key={index} className="my-6">
          <div className="relative w-full aspect-video rounded-lg overflow-hidden">
            <Image
              src={node.attrs?.src}
              alt={node.attrs?.alt || ''}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 80vw"
            />
          </div>
          {node.attrs?.title && (
            <figcaption className="mt-2 text-sm text-gray-500 text-center">{node.attrs.title}</figcaption>
          )}
        </figure>
      );

    case 'horizontalRule':
      return <hr key={index} className="my-8 border-gray-200 dark:border-gray-700" />;

    case 'hardBreak':
      return <br key={index} />;

    default:
      return null;
  }
}

function ArticleSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto animate-pulse">
      <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
        <div className="h-96 bg-gray-200 dark:bg-gray-700" />
        <div className="p-6 space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="flex items-center space-x-4 pt-4 border-t">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            </div>
          </div>
          <div className="space-y-3 pt-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ArticleView({ slug }: { slug: string }) {
  const locale = useLocale();
  const t = useTranslations('article');

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => getArticleBySlug(slug),
  });

  const { data: relatedArticles = [] } = useQuery({
    queryKey: ['related-articles', slug],
    queryFn: () => getRelatedArticles(slug),
    enabled: !!article,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) return <ArticleSkeleton />;

  if (error || !article) {
    return (
      <div className="w-full max-w-4xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('articleNotFound')}</h1>
        <Link href="/" className="text-brand-primary hover:underline dark:text-white">
          {t('backToHome')}
        </Link>
      </div>
    );
  }

  const categoryName = article.category?.name || '';
  const categorySlug = article.category?.slug || '';
  const catColors = getCategoryColors(categorySlug);
  const parentCategory = article.category?.parent;
  const parentColors = parentCategory ? getCategoryColors(parentCategory.slug) : null;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center space-x-2 text-[var(--color-brand-primary)] hover:text-[var(--color-brand-secondary)] dark:text-white dark:hover:text-[var(--color-brand-accent)] transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>{t('backToHome')}</span>
        </Link>
      </div>

      {/* Sponsored Content Banner */}
      {article.isSponsored && (
        <div className="mb-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20">
            <span className="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-widest bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-400">
              $ Sponsored Content
            </span>
            {article.sponsoredBy && (
              <span className="text-sm text-amber-700 dark:text-amber-400">
                by <span className="font-semibold">{article.sponsoredBy}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Breaking News Banner */}
      {article.isBreaking && (!article.breakingUntil || new Date(article.breakingUntil) > new Date()) && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white animate-pulse-slow">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
          </span>
          <Zap className="h-4 w-4 shrink-0" />
          <span className="text-sm font-bold uppercase tracking-wider">BREAKING NEWS</span>
        </div>
      )}

      {/* Article */}
      <article className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
        {/* Hero Image */}
        <div className="relative h-96 md:h-[500px]">
          {article.thumbnail?.url ? (
            <Image src={article.thumbnail.url} alt={article.title} fill className="object-cover" priority />
          ) : article.isBreaking ? (
            <Image src="/breaking-news-banner.svg" alt="Breaking News" fill className="object-cover" priority />
          ) : (
            <div
              className="w-full h-full relative overflow-hidden"
              style={{
                background: `light-dark(
                  linear-gradient(145deg, ${catColors.backgroundColor}, #fff),
                  linear-gradient(145deg, rgba(0,49,83,0.4), #1f2937)
                )`,
              }}
            >
              <span className="absolute -bottom-6 -right-4 font-black select-none leading-none opacity-[0.07]" style={{ fontSize: '14rem' }}>
                {(categoryName || 'M')[0]}
              </span>
              <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: '#F59E0B' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Image src="/favicon.svg" alt="" width={80} height={80} className="object-contain opacity-50" />
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Category Badges */}
          {categoryName && (
            <div className="absolute top-6 left-6 flex flex-wrap items-center gap-2">
              {parentCategory && (
                <span
                  className="px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide"
                  style={parentColors!}
                >
                  {parentCategory.name}
                </span>
              )}
              <span
                className="px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide"
                style={catColors}
              >
                {categoryName}
              </span>
            </div>
          )}

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              {article.title}
            </h1>
          </div>
        </div>

        {/* Excerpt */}
        {article.excerpt && (
          <div className="px-6 pt-4">
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              {article.excerpt}
            </p>
          </div>
        )}

        {/* Sponsored by line */}
        {article.isSponsored && article.sponsoredBy && (
          <div className="px-6 pt-3 pb-1">
            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
              Sponsored by {article.sponsoredBy}
            </p>
          </div>
        )}

        {/* Article Meta */}
        <div className="p-6 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Author Info */}
            <Link href={article.author?.user?.slug ? `/${locale}/author/${article.author.user.slug}` : '#'} className="flex items-center space-x-4 group">
              {article.author?.avatar ? (
                <div className="relative w-12 h-12">
                  <Image
                    src={article.author.avatar}
                    alt={article.author.user?.fullName || ''}
                    fill
                    className="object-cover rounded-full"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors">
                  {article.author?.user?.fullName || 'Unknown Author'}
                </h3>
                {article.author?.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{article.author.bio}</p>
                )}
              </div>
            </Link>

            {/* Article Stats */}
            <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(article.createdAt)}</span>
              </div>
              {article.viewCount > 0 && (
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{article.viewCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Share — before content */}
        <div className="px-6 pt-4">
          <ShareButton title={article.title} excerpt={article.excerpt} slug={slug} />
        </div>

        {/* Article Content - Tiptap JSON */}
        <div className="p-6 md:p-8">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            {article.content && (
              typeof article.content === 'string'
                ? article.content.split('\n').map((paragraph: string, i: number) => (
                    paragraph.trim() ? <p key={i} className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">{paragraph}</p> : null
                  ))
                : renderTiptapNode(article.content, 0)
            )}
          </div>

          {/* Share — after content */}
          <div className="mt-6 mb-2">
            <ShareButton title={article.title} excerpt={article.excerpt} slug={slug} />
          </div>

          {/* In-Article Ad */}
          <div className="my-8 w-full max-w-[728px] mx-auto h-[90px] bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 relative overflow-hidden">
            <div className="text-center">
              <div className="text-xs font-medium mb-0.5">Advertisement</div>
              <span className="text-[10px]">728 × 90</span>
            </div>
          </div>

          {/* Tags */}
          {article.tags?.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <div className="flex flex-wrap gap-2">
                {article.tags.map((articleTag: any) => {
                  const tag = articleTag.tag || articleTag;
                  const label = tag.translations?.find((tr: any) => tr.language === locale)?.label || tag.name;
                  return (
                    <span
                      key={tag.id}
                      className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                    >
                      <Tag className="h-3 w-3" />
                      <span>{label}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Author Bio Card */}
      {article.author?.bio && (
        <Card className="mt-8">
          <CardContent className="p-6">
            <Link href={article.author?.user?.slug ? `/${locale}/author/${article.author.user.slug}` : '#'} className="flex items-start space-x-4 group">
              {article.author?.avatar ? (
                <div className="relative w-20 h-20 flex-shrink-0">
                  <Image
                    src={article.author.avatar}
                    alt={article.author.user?.fullName || ''}
                    fill
                    className="object-cover rounded-full"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 flex-shrink-0 bg-brand-primary rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-white" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors">
                  {article.author.user?.fullName}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{article.author.bio}</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {t('relatedArticles')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedArticles.slice(0, 4).map((related: any) => (
              <Link
                key={related.id}
                href={`/${locale}/article/${related.slug}`}
                className="group"
              >
                <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
                  <div className="relative h-40 overflow-hidden">
                    {related.thumbnail?.url ? (
                      <Image
                        src={related.thumbnail.url}
                        alt={related.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : related.isBreaking ? (
                      <Image
                        src="/breaking-news-banner.svg"
                        alt="Breaking News"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div
                        className="w-full h-full relative"
                        style={{
                          background: `light-dark(
                            linear-gradient(145deg, ${getCategoryColors(related.category?.slug || '').backgroundColor}, #fff),
                            linear-gradient(145deg, rgba(0,49,83,0.3), #1f2937)
                          )`,
                        }}
                      >
                        <span className="absolute -bottom-3 -right-1 font-black select-none leading-none opacity-[0.07]" style={{ fontSize: '8rem' }}>
                          {(related.category?.name || 'M')[0]}
                        </span>
                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: '#F59E0B' }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Image src="/favicon.svg" alt="" width={36} height={36} className="object-contain opacity-50" />
                        </div>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <div className="flex flex-wrap items-center gap-1 mb-2">
                      {related.category?.parent && (
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={getCategoryColors(related.category.parent.slug || '')}
                        >
                          {related.category.parent.name}
                        </span>
                      )}
                      {related.category?.name && (
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={getCategoryColors(related.category?.slug || '')}
                        >
                          {related.category.name}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors">
                      {related.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(related.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <CommentSection articleId={article.id} />
    </div>
  );
}
