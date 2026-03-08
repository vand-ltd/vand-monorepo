import Article from "@/components/layouts/Article";

export default function HomePage() {
  return (
    <div className="w-full max-w-full space-y-0 overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Articles Feed */}
      <section className="bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-screen-xl mx-auto px-4">
          <Article />
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="bg-brand-primary text-white py-16">
        <div className="max-w-screen-xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Stay Informed</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto text-lg">
            Get breaking news and exclusive stories delivered to your inbox every morning
          </p>
          <div className="max-w-lg mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="flex-1">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full px-6 py-4 bg-white text-gray-900 placeholder-gray-500 rounded-lg border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition-all duration-200 text-base font-medium shadow-sm"
                />
              </div>
              <button className="bg-brand-accent hover:bg-amber-500 text-white font-bold px-8 py-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-primary">
                Subscribe Now
              </button>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              Join 150,000+ readers · No spam · Unsubscribe anytime
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
