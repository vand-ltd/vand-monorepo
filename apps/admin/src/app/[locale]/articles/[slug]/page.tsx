'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  FileText,
  Eye,
  Save,
  ChevronDown,
  ImagePlus,
  X,
  Globe,
  Tag,
  Clock,
  Loader2,
  ArrowLeft,
  Star,
} from 'lucide-react';
import { RichTextEditor } from '@/components/RichTextEditor';
import { AuthGuard } from '@/components/AuthGuard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getArticleBySlug,
  getCategories,
  updateArticle,
  uploadMedia,
  getTags,
} from '@org/api';
import { Link } from '@/i18n/navigation';
import { toast } from 'sonner';

type ArticleStatus = 'Draft' | 'InReview' | 'Published' | 'Rejected' | 'Archived';
const FEATURED_TYPES = ['Hero', 'Secondary', 'Spotlight'] as const;

export default function EditArticlePage() {
  const t = useTranslations('editArticle');
  const params = useParams();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const slug = params.slug as string;

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState<string | object>('');
  const [contentHtml, setContentHtml] = useState('');
  const [contentJson, setContentJson] = useState<object | null>(null);
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<{ id: string; label: string }[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [thumbnailId, setThumbnailId] = useState<string | null>(null);
  const [status, setStatus] = useState<ArticleStatus>('Draft');

  const [featuredType, setFeaturedType] = useState<string>('');
  const [isPreview, setIsPreview] = useState(false);
  const [language, setLanguage] = useState(locale);
  const [initialized, setInitialized] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole') || '');
  }, []);

  const { data: article, isLoading: articleLoading } = useQuery({
    queryKey: ['article', slug, locale],
    queryFn: () => getArticleBySlug(slug, locale),
    enabled: !!slug,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', language],
    queryFn: () => getCategories(language),
  });

  const { data: availableTags = [] } = useQuery({
    queryKey: ['tags', language],
    queryFn: () => getTags(language),
  });

  const tagDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setShowTagDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTags = availableTags.filter(
    (tag: any) =>
      tag.label.toLowerCase().includes(tagInput.toLowerCase()) &&
      !tags.some((t) => t.id === tag.id)
  );

  // Populate form when article loads
  useEffect(() => {
    if (article && !initialized) {
      setTitle(article.title || '');
      setSubtitle(article.excerpt || '');
      setCategory(article.category?.id || article.categoryId || '');
      setStatus(article.status || 'Draft');
      setFeaturedType(article.featuredType || '');
      setLanguage(article.language || locale);
      setCoverImage(article.thumbnail?.url || null);
      setThumbnailId(article.thumbnail?.id || article.thumbnailId || null);
      setTags(article.tags?.map((t: any) => ({
        id: t.tag.id,
        label: t.tag.translations?.find((tr: any) => tr.language === (article.language || locale))?.label || t.tag.name,
      })) || []);

      // Set content from article (RichTextEditor accepts both string and object)
      if (article.content) {
        setContent(article.content);
        if (typeof article.content !== 'string') {
          setContentJson(article.content);
        }
      }

      setInitialized(true);
    }
  }, [article, initialized, locale]);

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateArticle>[1]) =>
      updateArticle(article.id, data),
    onSuccess: (_data, variables) => {
      if (variables.status) {
        setStatus(variables.status as ArticleStatus);
      }
      toast.success(t('articleUpdated'));
      queryClient.invalidateQueries({ queryKey: ['article', slug] });
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('articleUpdateFailed');
      toast.error(message);
    },
  });

  const addTag = (tag: { id: string; label: string }) => {
    if (!tags.some((t) => t.id === tag.id)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tagId: string) => {
    setTags(tags.filter((tag) => tag.id !== tagId));
  };

  const handleCoverImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const media = await uploadMedia(file);
        setCoverImage(media.url);
        setThumbnailId(media.id);
      } catch (error) {
        console.error('Failed to upload cover image:', error);
      }
    };
    input.click();
  };

  const handleSubmit = () => {
    updateMutation.mutate({
      title,
      excerpt: subtitle,
      language,
      categoryId: category,
      content: contentJson || {},
      ...(thumbnailId ? { thumbnailId } : {}),
      ...(tags.length > 0 ? { tagIds: tags.map((t) => t.id) } : {}),
      ...(featuredType ? { featuredType } : { featuredType: null }),
    });
  };

  if (articleLoading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-[#003153] dark:text-[#F59E0B]" />
        </div>
      </AuthGuard>
    );
  }

  const isReporterReadOnly = userRole === 'reporter' && (status === 'InReview' || status === 'Published');

  if (!article) {
    return (
      <AuthGuard>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">{t('articleNotFound')}</p>
          <Link
            href="/articles"
            className="inline-flex items-center space-x-2 mt-4 text-[#003153] dark:text-[#F59E0B] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('backToArticles')}</span>
          </Link>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
        {/* Top bar */}
        <div className="sticky top-16 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                <Link
                  href={isReporterReadOnly ? '/' : '/articles'}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </Link>
                <div className="w-8 h-8 bg-gradient-to-br from-[#003153] to-[#005F73] rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t('pageTitle')}
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t(`status${status}`)}
                    {featuredType && ` · ${featuredType}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isReporterReadOnly ? (
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-3 h-9 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg cursor-default"
                  >
                    <Eye className="w-4 h-4" />
                    {t('preview')}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsPreview(!isPreview)}
                      className="flex items-center gap-1.5 px-3 h-9 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      {isPreview ? t('editMode') : t('preview')}
                    </button>
                    {/* Save as draft */}
                    <button
                      type="button"
                      onClick={() => handleSubmit()}
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-1.5 px-3 h-9 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {t('saveDraft')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content area */}
            <div className="lg:col-span-2 space-y-6">
              {(isPreview || isReporterReadOnly) ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  {coverImage && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={coverImage}
                        alt={title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                      {title || t('untitled')}
                    </h1>
                    {subtitle && (
                      <p className="text-xl text-gray-500 dark:text-gray-400 mb-6">
                        {subtitle}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {new Date(article.createdAt).toLocaleDateString()}
                      </span>
                      {tags.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-4 h-4" />
                          {tags.map((t) => t.label).join(', ')}
                        </div>
                      )}
                    </div>
                    <div
                      className="prose prose-lg dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{
                        __html:
                          contentHtml ||
                          `<p class="text-gray-400">${t('noContent')}</p>`,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {/* Cover image */}
                  <div
                    onClick={handleCoverImage}
                    className={`relative group cursor-pointer rounded-xl border-2 border-dashed transition-all overflow-hidden ${
                      coverImage
                        ? 'border-transparent'
                        : 'border-gray-300 dark:border-gray-600 hover:border-[#003153] dark:hover:border-[#F59E0B]'
                    }`}
                  >
                    {coverImage ? (
                      <div className="relative aspect-video">
                        <img
                          src={coverImage}
                          alt="Cover"
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                          <p className="text-white font-medium">
                            {t('changeCover')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCoverImage(null);
                            setThumbnailId(null);
                          }}
                          className="absolute top-3 right-3 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500 group-hover:text-[#003153] dark:group-hover:text-[#F59E0B] transition-colors">
                        <ImagePlus className="w-10 h-10 mb-3" />
                        <p className="text-sm font-medium">{t('addCover')}</p>
                        <p className="text-xs mt-1">{t('coverHint')}</p>
                      </div>
                    )}
                  </div>

                  {/* Title & Subtitle */}
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t('titlePlaceholder')}
                      className="w-full text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 bg-transparent border-none outline-none leading-tight"
                    />
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder={t('subtitlePlaceholder')}
                      className="w-full text-xl text-gray-500 dark:text-gray-400 placeholder-gray-300 dark:placeholder-gray-600 bg-transparent border-none outline-none"
                    />
                  </div>

                  {/* Rich Text Editor — key forces remount after article loads */}
                  {initialized && (
                    <RichTextEditor
                      key={`editor-${article.id}`}
                      content={content}
                      onChange={(html, json) => {
                        setContentHtml(html);
                        setContentJson(json);
                      }}
                      placeholder={t('contentPlaceholder')}
                    />
                  )}
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {isReporterReadOnly ? null : (
              <>
              {/* Article settings */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t('articleSettings')}
                  </h3>
                </div>

                <div className="p-5 space-y-5">
                  {/* Category */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('categoryLabel')}
                    </label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full h-10 px-3 pr-8 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003153] appearance-none"
                      >
                        <option value="">{t('selectCategory')}</option>
                        {categories.map(
                          (cat: { id: string; name: string }) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          )
                        )}
                      </select>
                      {categoriesLoading && (
                        <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                      )}
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Featured Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Star className="w-4 h-4" />
                      {t('featuredLabel')}
                    </label>
                    <div className="relative">
                      <select
                        value={featuredType}
                        onChange={(e) => setFeaturedType(e.target.value)}
                        className="w-full h-10 px-3 pr-8 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003153] appearance-none"
                      >
                        <option value="">{t('noneFeatured')}</option>
                        {FEATURED_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {t(`featuredType.${type}`)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Globe className="w-4 h-4" />
                      {t('languageLabel')}
                    </label>
                    <div className="relative">
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full h-10 px-3 pr-8 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003153] appearance-none"
                      >
                        <option value="en">{t('languages.en')}</option>
                        <option value="fr">{t('languages.fr')}</option>
                        <option value="rw">{t('languages.rw')}</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Tag className="w-4 h-4" />
                      {t('tagsLabel')}
                    </label>
                    <div className="relative" ref={tagDropdownRef}>
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => {
                          setTagInput(e.target.value);
                          setShowTagDropdown(true);
                        }}
                        onFocus={() => setShowTagDropdown(true)}
                        placeholder={t('tagsPlaceholder')}
                        className="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003153]"
                      />
                      {showTagDropdown && filteredTags.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {filteredTags.map((tag: any) => (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => addTag({ id: tag.id, label: tag.label })}
                              className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors first:rounded-t-lg last:rounded-b-lg"
                            >
                              {tag.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[#003153]/10 dark:bg-[#F59E0B]/10 text-[#003153] dark:text-[#F59E0B] rounded-full"
                          >
                            {tag.label}
                            <button
                              type="button"
                              onClick={() => removeTag(tag.id)}
                              className="hover:text-red-500 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Article info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t('articleInfo')}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{t('created')}</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date(article.createdAt).toLocaleDateString(locale, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  {article.updatedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">{t('lastUpdated')}</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(article.updatedAt).toLocaleDateString(locale, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{t('views')}</span>
                    <span className="text-gray-900 dark:text-white">{article.viewCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{t('author')}</span>
                    <span className="text-gray-900 dark:text-white">
                      {article.author?.user?.fullName || '—'}
                    </span>
                  </div>
                </div>
              </div>
              </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
