import Article from "@/components/layouts/Article";
import { HomeDiscover } from "@/components/layouts/HomeDiscover";
import { HomeTrending } from "@/components/layouts/HomeTrending";

export default function HomePage() {
  return (
    <div className="w-full max-w-full space-y-0 overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Articles Feed */}
      <section className="bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-screen-xl mx-auto px-4">
          <Article />
        </div>
      </section>

      {/* Discovery: trending / most-read → deepens sessions ("more to click"). */}
      <HomeTrending />

      {/* Server-rendered internal links (matches, competitions, latest news) —
          crawlable discovery paths into the deep archive from the homepage. */}
      <HomeDiscover />
    </div>
  );
}
