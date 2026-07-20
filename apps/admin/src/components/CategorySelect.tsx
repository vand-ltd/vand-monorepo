'use client';

import { ChevronDown, Loader2 } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Category = any;

// Resolve the full path of a selection, e.g. ["Sports", "Football"].
export function categoryPath(categories: Category[], id: string): string[] {
  if (!id) return [];
  for (const c of categories) {
    if (c.id === id) return [c.name];
    for (const child of c.children ?? []) {
      if (child.id === id) return [c.name, child.name];
    }
  }
  return [];
}

/**
 * Category picker. A native <select> collapsed shows only the chosen option's
 * text, so an <optgroup> parent label disappears once you pick a subcategory —
 * the breadcrumb under the field keeps the parent visible.
 */
export function CategorySelect({
  categories,
  value,
  onChange,
  loading,
  placeholder,
  className,
}: {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
  loading?: boolean;
  placeholder: string;
  className?: string;
}) {
  const path = categoryPath(categories, value);

  return (
    <div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={
            className ??
            'w-full h-10 px-3 pr-8 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003153] appearance-none'
          }
        >
          <option value="">{placeholder}</option>
          {categories.map((cat: Category) =>
            cat.children?.length > 0 ? (
              <optgroup key={cat.id} label={cat.name}>
                {cat.children.map((sub: Category) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </optgroup>
            ) : (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            )
          )}
        </select>
        {loading && (
          <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Keeps the parent visible once the dropdown is closed */}
      {path.length > 0 && (
        <p className="mt-1.5 flex flex-wrap items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          {path.map((name, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-300 dark:text-gray-600">›</span>}
              <span className={i === path.length - 1 ? 'font-medium text-gray-700 dark:text-gray-200' : ''}>
                {name}
              </span>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
