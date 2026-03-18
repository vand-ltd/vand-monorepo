'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, updateProfile, uploadMedia } from '@org/api';
import { AuthGuard } from '@/components/AuthGuard';
import { toast } from 'sonner';
import { Camera, Loader2, User } from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
  const t = useTranslations('editProfile');
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [xLink, setXLink] = useState('');
  const [linkedinLink, setLinkedinLink] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });

  // Populate form once data loads
  useEffect(() => {
    if (!me) return;
    const p = me.internalProfile ?? me;
    setDisplayName(p.displayName ?? me.fullName ?? '');
    setBio(p.bio ?? '');
    setXLink(p.xLink ?? '');
    setLinkedinLink(p.linkedinLink ?? '');
    setAvatarUrl(p.avatar ?? '');
  }, [me]);

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      toast.success(t('saved'));
      if (avatarUrl) localStorage.setItem('avatarUrl', avatarUrl);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: () => toast.error(t('failed')),
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadMedia(file);
      setAvatarUrl(uploaded.url);
    } catch {
      toast.error(t('failed'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutation.mutate({
      displayName: displayName || undefined,
      avatar: avatarUrl || undefined,
      bio: bio || undefined,
      xLink: xLink || undefined,
      linkedinLink: linkedinLink || undefined,
    });
  };

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {t('pageTitle')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('pageSubtitle')}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#003153] dark:text-[#F59E0B]" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                {t('avatarLabel')}
              </label>
              <div className="flex items-center gap-5">
                <div className="relative w-20 h-20 shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt="Avatar"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#003153] dark:bg-[#F59E0B] rounded-full flex items-center justify-center shadow-md hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {uploading ? (
                      <Loader2 className="h-3.5 w-3.5 text-white dark:text-gray-900 animate-spin" />
                    ) : (
                      <Camera className="h-3.5 w-3.5 text-white dark:text-gray-900" />
                    )}
                  </button>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="text-sm text-[#003153] dark:text-[#F59E0B] hover:opacity-80 font-medium disabled:opacity-50"
                  >
                    {uploading ? t('uploading') : t('avatarHint')}
                  </button>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP · max 5MB</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* Info fields */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
              {/* Display name */}
              <div className="space-y-2">
                <label htmlFor="displayName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('displayNameLabel')}
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t('displayNamePlaceholder')}
                  className="w-full h-11 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003153]"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label htmlFor="bio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('bioLabel')}
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t('bioPlaceholder')}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003153] resize-none"
                />
              </div>
            </div>

            {/* Social links */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
              <div className="space-y-2">
                <label htmlFor="xLink" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('xLinkLabel')}
                </label>
                <input
                  id="xLink"
                  type="url"
                  value={xLink}
                  onChange={(e) => setXLink(e.target.value)}
                  placeholder={t('xLinkPlaceholder')}
                  className="w-full h-11 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003153]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="linkedinLink" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('linkedinLinkLabel')}
                </label>
                <input
                  id="linkedinLink"
                  type="url"
                  value={linkedinLink}
                  onChange={(e) => setLinkedinLink(e.target.value)}
                  placeholder={t('linkedinLinkPlaceholder')}
                  className="w-full h-11 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003153]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={mutation.isPending || uploading}
                className="h-11 px-6 bg-[#003153] hover:bg-[#005F73] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {mutation.isPending ? t('saving') : t('save')}
              </button>
            </div>
          </form>
        )}
      </div>
    </AuthGuard>
  );
}
