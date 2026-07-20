import { redirect } from 'next/navigation';

type Props = { params: Promise<{ locale: string }> };

// Bare /football -> today's dated URL, so every view has a canonical date path.
export default async function FootballIndex({ params }: Props) {
  const { locale } = await params;
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
  redirect(`/${locale}/football/${today}`);
}
