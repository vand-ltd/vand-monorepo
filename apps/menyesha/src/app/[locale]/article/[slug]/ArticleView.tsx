'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getArticleBySlug, getRelatedArticles } from '@org/api';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
function InArticleAd({ label }: { label: string }) {
  return (
    <div className="my-8 w-full max-w-[728px] mx-auto">
      <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 text-center mb-2">Advertisement</p>
      <div className="w-full h-[120px] sm:h-[200px] rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center text-center px-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500">300 × 250 · Medium Rectangle</p>
      </div>
    </div>
  );
}

function renderTiptapNode(node: any, index: number, onImageClick?: (src: string, caption?: string) => void, adLabel?: string): React.ReactNode {
  if (!node) return null;

  switch (node.type) {
    case 'doc': {
      // Inject in-article ads after 2nd and 6th paragraphs
      const children = node.content || [];
      let paragraphCount = 0;
      const result: React.ReactNode[] = [];
      children.forEach((child: any, i: number) => {
        result.push(renderTiptapNode(child, i, onImageClick, adLabel));
        if (child.type === 'paragraph') {
          paragraphCount++;
          if (paragraphCount === 2 || paragraphCount === 6) {
            result.push(<InArticleAd key={`ad-${i}`} label={adLabel || 'Ad space available'} />);
          }
        }
      });
      return result;
    }

    case 'paragraph':
      return (
        <p key={index} className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300" style={{ textAlign: node.attrs?.textAlign || undefined }}>
          {node.content?.map((child: any, i: number) => renderTiptapNode(child, i, onImageClick)) || <br />}
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
          {node.content?.map((child: any, i: number) => renderTiptapNode(child, i, onImageClick))}
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
                <a key={index} href={mark.attrs?.href} target="_blank" rel="noopener noreferrer" className="text-brand-secondary hover:text-brand-accent underline decoration-brand-secondary/40 hover:decoration-brand-accent transition-colors">
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
          {node.content?.map((child: any, i: number) => renderTiptapNode(child, i, onImageClick))}
        </ul>
      );

    case 'orderedList':
      return (
        <ol key={index} className="list-decimal pl-6 mb-4 space-y-1 text-gray-700 dark:text-gray-300">
          {node.content?.map((child: any, i: number) => renderTiptapNode(child, i, onImageClick))}
        </ol>
      );

    case 'listItem':
      return (
        <li key={index}>
          {node.content?.map((child: any, i: number) => renderTiptapNode(child, i, onImageClick))}
        </li>
      );

    case 'blockquote':
      return (
        <blockquote key={index} className="border-l-4 border-brand-primary pl-4 my-6 italic text-gray-600 dark:text-gray-400">
          {node.content?.map((child: any, i: number) => renderTiptapNode(child, i, onImageClick))}
        </blockquote>
      );

    case 'codeBlock':
      return (
        <pre key={index} className="bg-gray-900 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto">
          <code>{node.content?.map((child: any, i: number) => renderTiptapNode(child, i, onImageClick))}</code>
        </pre>
      );

    case 'image':
      return (
        <figure key={index} className="my-6">
          <div
            className="relative w-full aspect-video rounded-lg overflow-hidden cursor-zoom-in group"
            onClick={() => onImageClick?.(node.attrs?.src, node.attrs?.title)}
          >
            <Image
              src={node.attrs?.src}
              alt={node.attrs?.alt || ''}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 80vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                Click to expand
              </span>
            </div>
          </div>
          {node.attrs?.title && (
            <figcaption className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center italic">{node.attrs.title}</figcaption>
          )}
        </figure>
      );

    case 'horizontalRule':
      return <hr key={index} className="my-8 border-gray-200 dark:border-gray-700" />;

    case 'hardBreak':
      return <br key={index} />;

    case 'table':
      return (
        <div key={index} className="my-6 overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
            {node.content?.map((child: any, i: number) => renderTiptapNode(child, i, onImageClick))}
          </table>
        </div>
      );

    case 'tableRow':
      return (
        <tr key={index}>
          {node.content?.map((child: any, i: number) => renderTiptapNode(child, i, onImageClick))}
        </tr>
      );

    case 'tableHeader':
      return (
        <th key={index} className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 p-2 text-left text-sm font-semibold text-gray-900 dark:text-white" colSpan={node.attrs?.colspan} rowSpan={node.attrs?.rowspan}>
          {node.content?.map((child: any, i: number) => renderTiptapNode(child, i, onImageClick))}
        </th>
      );

    case 'tableCell':
      return (
        <td key={index} className="border border-gray-300 dark:border-gray-600 p-2 text-sm text-gray-700 dark:text-gray-300" colSpan={node.attrs?.colspan} rowSpan={node.attrs?.rowspan}>
          {node.content?.map((child: any, i: number) => renderTiptapNode(child, i, onImageClick))}
        </td>
      );

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
  const tSidebar = useTranslations('sidebar');
  const router = useRouter();
  const [lightbox, setLightbox] = useState<{ src: string; caption?: string } | null>(null);

  const openLightbox = useCallback((src: string, caption?: string) => {
    setLightbox({ src, caption });
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!lightbox) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightbox]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['article', slug, locale],
    queryFn: () => getArticleBySlug(slug, locale),
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
  const catSolid = (categoryColorMap[categorySlug] || { lightText: '#6b7280' }).lightText;
  const parentCategory = article.category?.parent;
  const parentSolid = parentCategory ? (categoryColorMap[parentCategory.slug] || { lightText: '#6b7280' }).lightText : null;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Back Navigation */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center space-x-2 text-[var(--color-brand-primary)] hover:text-[var(--color-brand-secondary)] dark:text-white dark:hover:text-[var(--color-brand-accent)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('backToHome')}</span>
        </button>
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
              {parentCategory && parentSolid && (
                <span
                  className="px-3 py-1.5 rounded-md text-xs font-bold shadow-md"
                  style={{ backgroundColor: parentSolid, color: '#ffffff' }}
                >
                  {parentCategory.name}
                </span>
              )}
              <span
                className="px-3 py-1.5 rounded-md text-xs font-bold shadow-md"
                style={{ backgroundColor: catSolid, color: '#ffffff' }}
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
              {article.readMin && (
                <span>{t('minRead', { count: article.readMin })}</span>
              )}
              {article.viewCount > 0 && (
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{article.viewCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Share & Follow — before content */}
        <div className="px-6 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <ShareButton title={article.title} excerpt={article.excerpt} slug={slug} />
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('followUs')}</span>
            <div className="flex items-center space-x-1.5">
              <a href="https://www.facebook.com/profile.php?id=61575594504264" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-1.5 rounded-md text-gray-400 hover:text-brand-primary dark:hover:text-brand-accent transition-colors">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"/></svg>
              </a>
              <a href="https://x.com/vandmenyesha" target="_blank" rel="noopener noreferrer" aria-label="X" className="p-1.5 rounded-md text-gray-400 hover:text-brand-primary dark:hover:text-brand-accent transition-colors">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://www.instagram.com/menyesha/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-1.5 rounded-md text-gray-400 hover:text-brand-primary dark:hover:text-brand-accent transition-colors">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://www.tiktok.com/@menyesha" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="p-1.5 rounded-md text-gray-400 hover:text-brand-primary dark:hover:text-brand-accent transition-colors">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
              </a>
              <a href="https://www.youtube.com/@VandMenyesha" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="p-1.5 rounded-md text-gray-400 hover:text-brand-primary dark:hover:text-brand-accent transition-colors">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="https://whatsapp.com/channel/0029VayajqXBKfi9j2KY1P15" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="p-1.5 rounded-md text-gray-400 hover:text-brand-primary dark:hover:text-brand-accent transition-colors">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            </div>
          </div>
        </div>

        {/* Article Content - Tiptap JSON */}
        <div className="p-6 md:p-8">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            {article.content && (
              typeof article.content === 'string'
                ? article.content.split('\n').map((paragraph: string, i: number) => (
                    paragraph.trim() ? <p key={i} className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">{paragraph}</p> : null
                  ))
                : renderTiptapNode(article.content, 0, openLightbox, tSidebar('adSpaceAvailable'))
            )}
          </div>

          {/* Share — after content */}
          <div className="mt-6 mb-2">
            <ShareButton title={article.title} excerpt={article.excerpt} slug={slug} />
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
                          className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold shadow-sm"
                          style={{ backgroundColor: (categoryColorMap[related.category.parent.slug] || { lightText: '#6b7280' }).lightText, color: '#ffffff' }}
                        >
                          {related.category.parent.name}
                        </span>
                      )}
                      {related.category?.name && (
                        <span
                          className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold shadow-sm"
                          style={{ backgroundColor: (categoryColorMap[related.category?.slug] || { lightText: '#6b7280' }).lightText, color: '#ffffff' }}
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

      {/* Image Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
          >
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="max-w-[90vw] max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox.src}
              alt={lightbox.caption || ''}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            {lightbox.caption && (
              <p className="text-center text-sm text-white/80 mt-3 italic max-w-2xl mx-auto">
                {lightbox.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
