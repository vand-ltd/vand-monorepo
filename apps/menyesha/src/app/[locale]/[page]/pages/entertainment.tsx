import Article from "@/components/layouts/Article";

export default function EntertainmentPage() {
  return (
    <div className="w-full max-w-full bg-gray-50 dark:bg-gray-900">
      <section className="py-8">
        <div className="max-w-screen-xl mx-auto px-4">
          <Article categorySlug="entertainment" />
        </div>
      </section>
    </div>
  );
}
