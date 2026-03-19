'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, getAuthorArticles, updateArticle, getTags, assignArticleTags } from '@org/api';
import { toast } from 'sonner';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import {
  User,
  Mail,
  Phone,
  Shield,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Archive,
  Clock,
  Loader2,
  Eye,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Tag,
  X,
  Pencil,
  ExternalLink,
} from 'lucide-react';
import { AuthGuard } from '@/components/AuthGuard';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

type ArticleStatus = 'Draft' | 'InReview' | 'Published' | 'Rejected' | 'Archived';

const STATUS_COLORS: Record<ArticleStatus, string> = {
  Draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  InReview: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Archived: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

const STATUS_LABELS: Record<ArticleStatus, string> = {
  Draft: 'draftArticles',
  InReview: 'inReviewArticles',
  Published: 'publishedArticles',
  Rejected: 'rejectedArticles',
  Archived: 'archivedArticles',
};

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const u = useTranslations('user');
  const locale = useLocale();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState('');
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagDialogArticleId, setTagDialogArticleId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<{ id: string; name: string; label: string; translations: { label: string; language: string }[] }[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [assigningTags, setAssigningTags] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string>('InReview');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null);

  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole') || '');
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setShowTagDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: availableTags = [] } = useQuery({
    queryKey: ['tags', locale],
    queryFn: () => getTags(locale),
    enabled: tagDialogOpen,
  });

  const filteredTags = availableTags.filter(
    (tag: any) =>
      tag.label.toLowerCase().includes(tagInput.toLowerCase()) &&
      !selectedTags.some((t) => t.id === tag.id)
  );

  // Close status dropdown on outside click
  useEffect(() => {
    if (!statusDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (tableRef.current && !tableRef.current.contains(e.target as Node)) {
        setStatusDropdownOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [statusDropdownOpen]);

  function getTransitions(currentStatus: ArticleStatus, role: string): ArticleStatus[] {
    if (role === 'reporter') {
      if (currentStatus === 'Draft') return ['InReview'];
      return [];
    }
    switch (currentStatus) {
      case 'Draft': return ['InReview', 'Published'];
      case 'InReview': return ['Published', 'Draft', 'Rejected'];
      case 'Rejected': return ['Draft', 'InReview'];
      case 'Published': return ['Archived'];
      case 'Archived': return [];
      default: return [];
    }
  }

  const submitWithStatus = useMutation({
    mutationFn: ({ articleId, status }: { articleId: string; status: string }) =>
      updateArticle(articleId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-articles'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success(t('statusUpdated'));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('submitFailed');
      toast.error(Array.isArray(message) ? message.join(', ') : message);
    },
  });

  const handleStatusChange = (article: any, targetStatus: string) => {
    if ((targetStatus === 'InReview' || targetStatus === 'Published') && (!article.tags || article.tags.length === 0)) {
      setTagDialogArticleId(article.id);
      setPendingStatus(targetStatus);
      setSelectedTags([]);
      setTagInput('');
      setTagDialogOpen(true);
    } else {
      submitWithStatus.mutate({ articleId: article.id, status: targetStatus });
    }
  };

  const handleAssignTagsAndSubmit = async () => {
    if (!tagDialogArticleId || selectedTags.length === 0) return;
    setAssigningTags(true);
    try {
      const tagsPayload = selectedTags.map((tag) => ({
        name: tag.name,
        translations: tag.translations,
      }));
      await assignArticleTags(tagDialogArticleId, tagsPayload);
      submitWithStatus.mutate({ articleId: tagDialogArticleId, status: pendingStatus });
      setTagDialogOpen(false);
    } catch (error: any) {
      const message = error?.response?.data?.message || t('submitFailed');
      toast.error(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setAssigningTags(false);
    }
  };

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });

  const slug = me?.slug;
  const stats = me?.articleStats;

  const { data: articlesData, isLoading: articlesLoading } = useQuery({
    queryKey: ['my-articles', slug, locale, page, limit, statusFilter],
    queryFn: () =>
      getAuthorArticles(slug, {
        language: locale,
        page,
        limit,
        ...(statusFilter ? { status: statusFilter } : {}),
      }),
    enabled: !!slug,
  });

  const articles = articlesData?.articles ?? articlesData ?? [];
  const meta = articlesData?.meta ?? { total: 0, page: 1, totalPages: 1 };
  const totalPages = meta.totalPages || Math.ceil((meta.total || 0) / limit);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredArticles = searchQuery
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? articles.filter((a: any) =>
        a.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : articles;

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('title')}
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {t('welcome')}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#003153] dark:text-[#F59E0B]" />
          </div>
        ) : me ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-brand px-6 py-8 text-center relative">
                  <Link href="/profile" className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" title={u('editProfile')}>
                    <Pencil className="h-4 w-4 text-white" />
                  </Link>
                  <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center mx-auto mb-4 border-2 border-white/30 relative">
                    {me.internalProfile?.avatar ? (
                      <Image
                        src={me.internalProfile.avatar}
                        alt={me.fullName}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/20 flex items-center justify-center">
                        <User className="h-10 w-10 text-white" />
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {me.internalProfile?.displayName || me.fullName}
                  </h2>
                  {me.internalProfile?.role?.displayName && (
                    <div className="flex items-center justify-center space-x-2 mt-2">
                      <Shield className="h-4 w-4 text-[#F59E0B]" />
                      <span className="text-sm text-gray-200">
                        {me.internalProfile.role.displayName}
                      </span>
                    </div>
                  )}
                </div>

                <div className="px-6 py-6 space-y-4">
                  {/* Bio */}
                  {me.internalProfile?.bio && (
                    <div className="relative rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 px-4 py-3">
                      <span className="absolute -top-2.5 left-3 text-3xl leading-none text-[#003153]/20 dark:text-[#F59E0B]/20 font-serif select-none">&ldquo;</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pt-1 italic">
                        {me.internalProfile.bio}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-medium uppercase tracking-wide">
                        {u('bio')}
                      </p>
                    </div>
                  )}

                  {me.internalProfile?.displayName && me.internalProfile.displayName !== me.fullName && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#003153]/10 dark:bg-[#003153]/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-[#003153] dark:text-[#F59E0B]" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          {u('fullName')}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {me.fullName}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#003153]/10 dark:bg-[#003153]/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5 text-[#003153] dark:text-[#F59E0B]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {u('email')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {me.email}
                      </p>
                    </div>
                  </div>

                  {me.phone && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#003153]/10 dark:bg-[#003153]/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="h-5 w-5 text-[#003153] dark:text-[#F59E0B]" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          {u('phone')}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {me.phone}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#003153]/10 dark:bg-[#003153]/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ExternalLink className="h-5 w-5 text-[#003153] dark:text-[#F59E0B]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {u('xLink')}
                      </p>
                      {me.internalProfile?.xLink ? (
                        <a href={me.internalProfile.xLink} target="_blank" rel="noopener noreferrer"
                          className="text-sm font-semibold text-[#003153] dark:text-[#F59E0B] hover:underline truncate block">
                          {me.internalProfile.xLink}
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">—</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#003153]/10 dark:bg-[#003153]/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ExternalLink className="h-5 w-5 text-[#003153] dark:text-[#F59E0B]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {u('linkedinLink')}
                      </p>
                      {me.internalProfile?.linkedinLink ? (
                        <a href={me.internalProfile.linkedinLink} target="_blank" rel="noopener noreferrer"
                          className="text-sm font-semibold text-[#003153] dark:text-[#F59E0B] hover:underline truncate block">
                          {me.internalProfile.linkedinLink}
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">—</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-[#3CB371]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {u('status')}
                      </p>
                      <p className="text-sm font-semibold text-[#3CB371]">
                        {u('active')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Article Stats */}
              {stats && (
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    {t('articleStats')}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <StatCard
                      icon={FileText}
                      label={t('totalArticles')}
                      value={stats.total}
                      color="bg-[#003153]/10 dark:bg-[#003153]/30"
                      iconColor="text-[#003153] dark:text-[#F59E0B]"
                    />
                    <StatCard
                      icon={Clock}
                      label={t('draftArticles')}
                      value={stats.draft}
                      color="bg-yellow-50 dark:bg-yellow-900/20"
                      iconColor="text-yellow-600 dark:text-yellow-400"
                    />
                    <StatCard
                      icon={CheckCircle}
                      label={t('publishedArticles')}
                      value={stats.published}
                      color="bg-green-50 dark:bg-green-900/20"
                      iconColor="text-green-600 dark:text-green-400"
                    />
                    <StatCard
                      icon={Send}
                      label={t('inReviewArticles')}
                      value={stats.inReview}
                      color="bg-blue-50 dark:bg-blue-900/20"
                      iconColor="text-blue-600 dark:text-blue-400"
                    />
                    <StatCard
                      icon={XCircle}
                      label={t('rejectedArticles')}
                      value={stats.rejected}
                      color="bg-red-50 dark:bg-red-900/20"
                      iconColor="text-red-600 dark:text-red-400"
                    />
                    <StatCard
                      icon={Archive}
                      label={t('archivedArticles')}
                      value={stats.archived}
                      color="bg-gray-50 dark:bg-gray-700/50"
                      iconColor="text-gray-600 dark:text-gray-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* My Articles */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {t('myArticles')}
              </h3>

              {/* Filters */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t('searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#003153] dark:focus:ring-[#F59E0B] text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                      }}
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003153]"
                    >
                      <option value="">{t('allStatuses')}</option>
                      <option value="Draft">{t('draftArticles')}</option>
                      <option value="InReview">{t('inReviewArticles')}</option>
                      <option value="Published">{t('publishedArticles')}</option>
                      <option value="Rejected">{t('rejectedArticles')}</option>
                      <option value="Archived">{t('archivedArticles')}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Articles Table */}
              <div ref={tableRef} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {articlesLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-[#003153] dark:text-[#F59E0B]" />
                  </div>
                ) : filteredArticles.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('noArticles')}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('columnTitle')}
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                            {t('columnCategory')}
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('columnStatus')}
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                            {t('columnViews')}
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                            {t('columnDate')}
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('columnActions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {filteredArticles.map((article: any) => (
                          <tr
                            key={article.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-9 flex-shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                                  {article.thumbnail?.url ? (
                                    <img
                                      src={article.thumbnail.url}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                      —
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-[300px]">
                                  {article.title}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                                {article.category?.name || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="relative">
                                <button
                                  onClick={() => {
                                    const transitions = getTransitions(article.status as ArticleStatus, userRole);
                                    if (transitions.length === 0) return;
                                    setStatusDropdownOpen(
                                      statusDropdownOpen === article.id ? null : article.id
                                    );
                                  }}
                                  disabled={submitWithStatus.isPending}
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-opacity hover:opacity-80 ${
                                    STATUS_COLORS[article.status as ArticleStatus] || STATUS_COLORS.Draft
                                  } ${getTransitions(article.status as ArticleStatus, userRole).length > 0 ? 'cursor-pointer' : 'cursor-default'}`}
                                >
                                  {t(STATUS_LABELS[article.status as ArticleStatus] || 'draftArticles')}
                                  {getTransitions(article.status as ArticleStatus, userRole).length > 0 && (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                </button>
                                {statusDropdownOpen === article.id && getTransitions(article.status as ArticleStatus, userRole).length > 0 && (
                                  <div className="absolute z-20 mt-1 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[140px]">
                                    {getTransitions(article.status as ArticleStatus, userRole).map((targetStatus) => (
                                      <button
                                        key={targetStatus}
                                        onClick={() => {
                                          setStatusDropdownOpen(null);
                                          handleStatusChange(article, targetStatus);
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                                      >
                                        <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[targetStatus].split(' ')[0]}`} />
                                        <span className="text-gray-700 dark:text-gray-300">
                                          {t(STATUS_LABELS[targetStatus])}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <Eye className="h-3.5 w-3.5" />
                                <span>{article.viewCount || 0}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(article.createdAt)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <Link
                                  href={`/articles/${article.slug}`}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#003153] dark:hover:text-[#F59E0B] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors inline-flex"
                                  title={t('viewArticle')}
                                >
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('pageInfo', { current: page, total: totalPages })}
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                              page === pageNum
                                ? 'bg-[#003153] text-white dark:bg-[#F59E0B] dark:text-gray-900'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Tag Assignment Dialog */}
      <AlertDialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('assignTagsTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('assignTagsDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            <div className="relative" ref={tagDropdownRef}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setShowTagDropdown(true);
                }}
                onFocus={() => setShowTagDropdown(true)}
                placeholder={t('searchTags')}
                className="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003153]"
              />
              {showTagDropdown && (tagInput.length > 0 || filteredTags.length > 0) && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredTags.map((tag: any) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        setSelectedTags([...selectedTags, { id: tag.id, name: tag.name, label: tag.label, translations: tag.translations }]);
                        setTagInput('');
                        setShowTagDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      {tag.label}
                    </button>
                  ))}
                  {filteredTags.length === 0 && tagInput.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const name = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
                        const label = tagInput.trim();
                        setSelectedTags([...selectedTags, {
                          id: `new-${Date.now()}`,
                          name,
                          label,
                          translations: [{ label, language: locale }],
                        }]);
                        setTagInput('');
                        setShowTagDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-[#003153] dark:text-[#F59E0B] hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                    >
                      <span className="text-xs">+</span>
                      {t('createTag', { name: tagInput.trim() })}
                    </button>
                  )}
                </div>
              )}
            </div>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[#003153]/10 dark:bg-[#F59E0B]/10 text-[#003153] dark:text-[#F59E0B] rounded-full"
                  >
                    {tag.label}
                    <button
                      type="button"
                      onClick={() => setSelectedTags(selectedTags.filter((t) => t.id !== tag.id))}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <button
              onClick={handleAssignTagsAndSubmit}
              disabled={selectedTags.length === 0 || assigningTags}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#003153] px-4 py-2 text-sm font-medium text-white hover:bg-[#003153]/90 focus:outline-none focus:ring-2 focus:ring-[#003153] focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-colors"
            >
              {assigningTags ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Tag className="w-4 h-4 mr-2" />
              )}
              {t('assignAndSubmit')}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthGuard>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  iconColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center space-x-3">
        <div
          className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center flex-shrink-0`}
        >
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
