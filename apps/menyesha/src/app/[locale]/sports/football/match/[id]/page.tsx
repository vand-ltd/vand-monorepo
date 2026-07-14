import { MatchDetail } from '@/components/layouts/MatchDetail';

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function MatchPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="w-full max-w-full bg-gray-50 dark:bg-gray-900 min-h-screen">
      <section className="py-8">
        <div className="max-w-3xl mx-auto px-4">
          <MatchDetail id={id} />
        </div>
      </section>
    </div>
  );
}
