import { redirect } from 'next/navigation';

type Props = { params: Promise<{ locale: string }> };

// Bare /football -> today's dated URL, so every scores view has a canonical
// date path. The day-scores page (/football/YYYY-MM-DD) is the football landing.
export default async function FootballIndex({ params }: Props) {
  const { locale } = await params;
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
  redirect(`/${locale}/football/${today}`);
}
