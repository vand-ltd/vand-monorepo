'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createAdvertiser,
  updateAdvertiser,
  deleteAdvertiser,
  type Advertiser,
} from '@org/api';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { cardClass, inputClass, labelClass, primaryBtn } from '@/components/football/styles';

function errMessage(error: any, fallback: string) {
  const m = error?.response?.data?.message || fallback;
  return Array.isArray(m) ? m.join(', ') : m;
}

export function AdvertisersPanel({ advertisers }: { advertisers: Advertiser[] }) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['advertisers'] });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [removeTarget, setRemoveTarget] = useState<Advertiser | null>(null);

  const createMut = useMutation({
    mutationFn: () =>
      createAdvertiser({
        name: name.trim(),
        contactEmail: email.trim() || null,
        phone: phone.trim() || null,
      }),
    onSuccess: () => {
      toast.success('Advertiser added');
      setName('');
      setEmail('');
      setPhone('');
      invalidate();
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to add advertiser')),
  });

  const renameMut = useMutation({
    mutationFn: (a: Advertiser) => updateAdvertiser(a.id, { name: editName.trim() }),
    onSuccess: () => {
      toast.success('Advertiser updated');
      setEditId(null);
      invalidate();
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to update advertiser')),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => deleteAdvertiser(id),
    onSuccess: () => {
      toast.success('Advertiser removed');
      setRemoveTarget(null);
      invalidate();
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to remove advertiser')),
  });

  return (
    <section className={`${cardClass} p-5`}>
      <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Advertisers</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        The businesses running ads. Assign one to an ad for per-advertiser reporting.
      </p>

      {/* Add */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-4">
        <div>
          <label className={labelClass}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email (optional)</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Phone (optional)</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            disabled={!name.trim() || createMut.isPending}
            onClick={() => createMut.mutate()}
            className={primaryBtn}
          >
            {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </button>
        </div>
      </div>

      {advertisers.length === 0 ? (
        <p className="text-sm text-gray-400">No advertisers yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {advertisers.map((a) => (
            <div
              key={a.id}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5"
            >
              {editId === a.id ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => editName.trim() && renameMut.mutate(a)}
                    className="text-emerald-600 hover:text-emerald-700"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setEditId(null)} className="text-gray-400">
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-900 dark:text-white">{a.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditId(a.id);
                      setEditName(a.name);
                    }}
                    className="text-gray-400 hover:text-[#003153] dark:hover:text-[#F59E0B]"
                    aria-label="Rename"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemoveTarget(a)}
                    className="text-gray-400 hover:text-red-600"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove advertiser?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {removeTarget?.name}? Ads assigned to them keep running but lose the link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeTarget && removeMut.mutate(removeTarget.id)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
