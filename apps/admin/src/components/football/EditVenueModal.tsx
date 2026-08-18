'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateVenue, type Venue } from '@org/api';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import { inputClass, labelClass, primaryBtn } from './styles';

function errMessage(error: any, fallback: string) {
  const m = error?.response?.data?.message || fallback;
  return Array.isArray(m) ? m.join(', ') : m;
}

export function EditVenueModal({ venue, onClose }: { venue: Venue; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(venue.name ?? '');
  const [city, setCity] = useState(venue.city ?? '');
  const [country, setCountry] = useState(venue.country ?? '');
  const [capacity, setCapacity] = useState(venue.capacity != null ? String(venue.capacity) : '');

  const saveMut = useMutation({
    mutationFn: () =>
      updateVenue(venue.id, {
        name: name.trim(),
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        capacity: capacity.trim() ? Number(capacity) : undefined,
      }),
    onSuccess: () => {
      toast.success('Venue updated');
      qc.invalidateQueries({ queryKey: ['football', 'venues'] });
      onClose();
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to update venue')),
  });

  const canSave = !!name.trim() && !saveMut.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Edit venue</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className={labelClass}>Venue name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Country</label>
              <input value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Capacity</label>
            <input
              type="number"
              min="0"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="e.g. 30000"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Cancel
          </button>
          <button type="button" disabled={!canSave} onClick={() => saveMut.mutate()} className={primaryBtn}>
            {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
