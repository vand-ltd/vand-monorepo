'use client';

import { useState, useRef } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getComments, getCommentCount, createComment, getMe } from '@org/api';
import { useTranslations } from 'next-intl';
import { MessageCircle, Send, User, Smile, ChevronDown, Loader2 } from 'lucide-react';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function CommentSection({ articleId }: { articleId: string }) {
  const t = useTranslations('comments');
  const queryClient = useQueryClient();

  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emojiData.emoji + content.slice(end);
      setContent(newContent);
      // Restore cursor position after emoji
      requestAnimationFrame(() => {
        const newPos = start + emojiData.emoji.length;
        textarea.setSelectionRange(newPos, newPos);
        textarea.focus();
      });
    } else {
      setContent((prev) => prev + emojiData.emoji);
    }
  };

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    retry: false,
  });

  const isLoggedIn = !!user;

  // Fetch total comment count
  const { data: totalCount = 0 } = useQuery({
    queryKey: ['comment-count', articleId],
    queryFn: () => getCommentCount(articleId),
  });

  // Fetch comments with cursor pagination
  const {
    data: commentsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['comments', articleId],
    queryFn: ({ pageParam }) => getComments(articleId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta?.hasMore ? lastPage.meta.nextCursor : undefined,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const comments: any[] = commentsData?.pages.flatMap((page) => page.comments) ?? [];

  const { mutate: submitComment, isPending } = useMutation({
    mutationFn: () =>
      createComment(articleId, {
        content,
        ...(!isLoggedIn && { authorName, authorEmail }),
      }),
    onSuccess: () => {
      setContent('');
      setAuthorName('');
      setAuthorEmail('');
      queryClient.invalidateQueries({ queryKey: ['comments', articleId] });
      queryClient.invalidateQueries({ queryKey: ['comment-count', articleId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (!isLoggedIn && (!authorName.trim() || !authorEmail.trim())) return;
    submitComment();
  };

  const formatRelativeTime = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t('justNow');
    if (minutes < 60) return t('minutesAgo', { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('hoursAgo', { count: hours });
    const days = Math.floor(hours / 24);
    return t('daysAgo', { count: days });
  };

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <MessageCircle className="h-6 w-6" />
        {t('title')}
        {totalCount > 0 && (
          <span className="text-base font-normal text-gray-500">
            ({totalCount})
          </span>
        )}
      </h2>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          {!isLoggedIn && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder={t('namePlaceholder')}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 dark:focus:ring-brand-accent/50"
              />
              <input
                type="email"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 dark:focus:ring-brand-accent/50"
              />
            </div>
          )}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('commentPlaceholder')}
              required
              rows={3}
              className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary/50 dark:focus:ring-brand-accent/50"
            />
            <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-brand-primary dark:hover:text-brand-accent transition-colors"
                  aria-label="Emoji picker"
                >
                  <Smile className="h-5 w-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                side="top"
                className="w-auto p-0 border-none shadow-xl"
              >
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  theme={Theme.AUTO}
                  width={320}
                  height={400}
                  searchPlaceHolder="Search emoji..."
                  lazyLoadEmojis
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending || !content.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              {isPending ? t('submitting') : t('submit')}
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">{t('noComments')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment: any) => (
            <div
              key={comment.id}
              className="flex gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="w-10 h-10 rounded-full bg-brand-primary/10 dark:bg-brand-accent/10 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-brand-primary dark:text-brand-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {comment.authorName}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}

          {/* Load More */}
          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-brand-primary dark:text-brand-accent hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
              >
                {isFetchingNextPage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                {t('viewMore', { count: totalCount - comments.length })}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
