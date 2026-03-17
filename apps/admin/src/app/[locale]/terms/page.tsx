'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminGetTerms, adminGetTermsById, adminCreateTerms, adminActivateTerms } from '@org/api';
import { AdminGuard } from '@/components/AdminGuard';
import { RichTextEditor } from '@/components/RichTextEditor';
import { toast } from 'sonner';
import { ScrollText, Plus, X, CheckCircle, Eye, Zap, Loader2 } from 'lucide-react';

export default function TermsPage() {
  const t = useTranslations('terms');
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [version, setVersion] = useState('');
  const [content, setContent] = useState('');

  // Viewing a version's content
  const [viewingId, setViewingId] = useState<string | null>(null);

  const { data: termsList = [], isLoading } = useQuery({
    queryKey: ['admin-terms'],
    queryFn: adminGetTerms,
  });

  const { data: viewContent, isLoading: isLoadingContent } = useQuery({
    queryKey: ['admin-terms-content', viewingId],
    queryFn: () => adminGetTermsById(viewingId!),
    enabled: !!viewingId,
  });

  const createMutation = useMutation({
    mutationFn: adminCreateTerms,
    onSuccess: () => {
      toast.success(t('created'));
      setVersion('');
      setContent('');
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['admin-terms'] });
    },
    onError: () => toast.error(t('failed')),
  });

  const activateMutation = useMutation({
    mutationFn: adminActivateTerms,
    onSuccess: () => {
      toast.success(t('activated'));
      queryClient.invalidateQueries({ queryKey: ['admin-terms'] });
    },
    onError: () => toast.error(t('activateFailed')),
  });

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <AdminGuard>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ScrollText className="h-7 w-7 text-[#003153] dark:text-[#F59E0B]" />
              {t('pageTitle')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('pageSubtitle')}</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center space-x-2 bg-[#003153] hover:bg-[#005F73] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>{t('newVersion')}</span>
            </button>
          )}
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('newVersion')}</h2>
              <button
                onClick={() => { setShowForm(false); setVersion(''); setContent(''); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate({ version: version.trim(), content: content.trim() });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('versionLabel')}
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder={t('versionPlaceholder')}
                  required
                  className="w-full sm:w-48 h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003153]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('contentLabel')}
                </label>
                <RichTextEditor
                  content={content}
                  onChange={(html) => setContent(html)}
                  placeholder={t('contentPlaceholder')}
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="h-9 px-4 text-sm font-medium text-white bg-[#003153] rounded-lg hover:opacity-90 disabled:opacity-60 transition-colors"
                >
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('create')}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setVersion(''); setContent(''); }}
                  className="h-9 px-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#003153] dark:text-[#F59E0B]" />
            </div>
          ) : termsList.length === 0 ? (
            <div className="text-center py-20">
              <ScrollText className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">{t('noTerms')}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('columnVersion')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('columnStatus')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                    {t('columnDate')}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('columnActions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {termsList.map((term: any) => (
                  <tr key={term.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                        v{term.version}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {term.isActive ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          <span>{t('active')}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                          {t('inactive')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {term.createdAt ? formatDate(term.createdAt) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setViewingId(term.id)}
                          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title={t('viewContent')}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {!term.isActive && (
                          <button
                            onClick={() => activateMutation.mutate(term.id)}
                            disabled={activateMutation.isPending}
                            className="p-1.5 rounded-lg text-[#003153] dark:text-[#F59E0B] hover:bg-[#003153]/10 dark:hover:bg-[#F59E0B]/10 transition-colors disabled:opacity-50"
                            title={t('activate')}
                          >
                            <Zap className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Content viewer modal */}
      {viewingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('contentTitle')}</h3>
              <button
                onClick={() => setViewingId(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {isLoadingContent ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-[#003153] dark:text-[#F59E0B]" />
                </div>
              ) : (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: viewContent?.content ?? '' }}
                />
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0 text-right">
              <button
                onClick={() => setViewingId(null)}
                className="h-9 px-4 text-sm font-medium text-white bg-[#003153] rounded-lg hover:opacity-90"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}
