'use client';

import { useQuery } from '@tanstack/react-query';
import { getArticleBySlug } from '@org/api';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  Eye,
  ArrowLeft,
  Calendar,
  Tag,
  User,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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

export default function ArticlePage() {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations('article');
  const slug = params.slug as string;

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => getArticleBySlug(slug),
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

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center space-x-2 text-[var(--color-brand-primary)] hover:text-[var(--color-brand-secondary)] dark:text-white dark:hover:text-[var(--color-brand-accent)] transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>{t('backToHome')}</span>
        </Link>
      </div>

      {/* Article */}
      <article className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
        {/* Hero Image */}
        <div className="relative h-96 md:h-[500px]">
          <Image
            src={article.thumbnail?.url || '/favicon.svg'}
            alt={article.title}
            fill
            className={article.thumbnail?.url ? 'object-cover' : 'object-contain p-16 bg-gray-100 dark:bg-gray-800'}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Category Badge */}
          {categoryName && (
            <div className="absolute top-6 left-6">
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

        {/* Article Meta */}
        <div className="p-6 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Author Info */}
            <div className="flex items-center space-x-4">
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
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {article.author?.user?.fullName || 'Unknown Author'}
                </h3>
                {article.author?.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{article.author.bio}</p>
                )}
              </div>
            </div>

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

        {/* Article Content - Tiptap JSON */}
        <div className="p-6 md:p-8">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            {article.content && renderTiptapNode(article.content, 0)}
          </div>

          {/* Tags */}
          {article.tags?.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag: any) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                  >
                    <Tag className="h-3 w-3" />
                    <span>{tag.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Author Bio Card */}
      {article.author?.bio && (
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
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
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {article.author.user?.fullName}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{article.author.bio}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
