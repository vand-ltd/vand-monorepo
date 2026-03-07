'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  FileText,
  Eye,
  Save,
  Send,
  ChevronDown,
  ImagePlus,
  X,
  Globe,
  Tag,
  Clock,
} from 'lucide-react';
import { RichTextEditor } from '@/components/RichTextEditor';

type ArticleStatus = 'draft' | 'published';

export default function CreateArticlePage() {
  const t = useTranslations('createArticle');

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [status, setStatus] = useState<ArticleStatus>('draft');
  const [isPreview, setIsPreview] = useState(false);
  const [language, setLanguage] = useState('en');

  const categories = [
    'politics', 'business', 'technology', 'sports',
    'entertainment', 'health', 'science', 'world',
  ];

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleCoverImage = () => {
    const url = window.prompt(t('coverImagePrompt'));
    if (url) setCoverImage(url);
  };

  const handleSubmit = (articleStatus: ArticleStatus) => {
    setStatus(articleStatus);
    const articleData = {
      title,
      subtitle,
      content,
      category,
      tags,
      coverImage,
      status: articleStatus,
      language,
    };
    console.log('Article data:', articleData);
    // TODO: call API to save article
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      {/* Top bar */}
      <div className="sticky top-16 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#003153] to-[#005F73] rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t('pageTitle')}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {status === 'draft' ? t('statusDraft') : t('statusPublished')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPreview(!isPreview)}
                className="flex items-center gap-1.5 px-3 h-9 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <Eye className="w-4 h-4" />
                {isPreview ? t('editMode') : t('preview')}
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('draft')}
                className="flex items-center gap-1.5 px-3 h-9 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <Save className="w-4 h-4" />
                {t('saveDraft')}
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('published')}
                className="flex items-center gap-1.5 px-4 h-9 text-sm font-semibold text-white bg-gradient-to-r from-[#003153] to-[#005F73] rounded-lg hover:opacity-90 transition-all shadow-sm"
              >
                <Send className="w-4 h-4" />
                {t('publish')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-6">
            {isPreview ? (
              /* Preview mode */
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                {coverImage && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img src={coverImage} alt={title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-8">
                  {category && (
                    <span className="inline-block px-3 py-1 text-xs font-semibold text-[#003153] dark:text-[#F59E0B] bg-[#003153]/10 dark:bg-[#F59E0B]/10 rounded-full mb-4 uppercase tracking-wide">
                      {t(`categories.${category}`)}
                    </span>
                  )}
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                    {title || t('untitled')}
                  </h1>
                  {subtitle && (
                    <p className="text-xl text-gray-500 dark:text-gray-400 mb-6">{subtitle}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {new Date().toLocaleDateString()}
                    </span>
                    {tags.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-4 h-4" />
                        {tags.join(', ')}
                      </div>
                    )}
                  </div>
                  <div
                    className="prose prose-lg dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: content || `<p class="text-gray-400">${t('noContent')}</p>` }}
                  />
                </div>
              </div>
            ) : (
              /* Editor mode */
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
                      <img src={coverImage} alt="Cover" className="w-full h-full object-cover rounded-xl" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                        <p className="text-white font-medium">{t('changeCover')}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setCoverImage(null); }}
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

                {/* Rich Text Editor */}
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder={t('contentPlaceholder')}
                />
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Article settings card */}
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
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {t(`categories.${cat}`)}
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
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder={t('tagsPlaceholder')}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003153]"
                  />
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[#003153]/10 dark:bg-[#F59E0B]/10 text-[#003153] dark:text-[#F59E0B] rounded-full"
                        >
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Publishing tips */}
            <div className="bg-gradient-to-br from-[#003153]/5 to-[#005F73]/5 dark:from-[#003153]/20 dark:to-[#005F73]/20 rounded-xl border border-[#003153]/10 dark:border-[#003153]/30 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                {t('tipsTitle')}
              </h3>
              <ul className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#003153] dark:bg-[#F59E0B] mt-1.5 shrink-0" />
                    {t(`tips.${i}`)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
