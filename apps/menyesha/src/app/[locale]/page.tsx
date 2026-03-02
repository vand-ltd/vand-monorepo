import Image from "next/image";
import Link from "next/link";
import Article from "@/components/layouts/Article";
import { TrendingUp, Clock, Eye } from "lucide-react";

export default function HomePage() {
  return (
    <div className="w-full max-w-full space-y-0 overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Main News Grid */}
      <section className="bg-white dark:bg-gray-800 py-6 sm:py-8">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

            {/* Main Story - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Lead Story */}
              <Link href="/article/1" className="group block">
                <article>
                  <div className="relative aspect-[16/9] mb-4 overflow-hidden rounded-xl shadow-lg">
                    <Image
                      src="https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&h=450&fit=crop"
                      alt="Climate Summit"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      priority
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-error text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide flex items-center space-x-1.5 shadow-lg">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                        <span>Breaking</span>
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 sm:p-6">
                      <h1 className="text-white text-xl sm:text-2xl lg:text-3xl font-bold leading-tight mb-2 group-hover:text-brand-accent transition-colors duration-300">
                        Global Climate Summit Reaches Historic Environmental Agreement
                      </h1>
                      <p className="text-gray-200 text-sm sm:text-base line-clamp-2">
                        World leaders unite on unprecedented climate action plan for the next decade, setting new environmental standards for 195 countries.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>2 hours ago</span>
                    </span>
                    <span className="text-brand-primary dark:text-brand-accent font-medium">Environment</span>
                    <span className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>15.2K</span>
                    </span>
                  </div>
                </article>
              </Link>

              {/* Secondary Stories Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <Link href="/article/2" className="group block">
                  <article>
                    <div className="relative aspect-[4/3] mb-3 overflow-hidden rounded-lg shadow-sm">
                      <Image
                        src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop"
                        alt="Tech News"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 left-2.5">
                        <span className="bg-brand-primary text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm">Tech</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors mb-1.5 line-clamp-2 leading-snug">
                      AI Revolution: Tech Giants Form Unprecedented Alliance
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-2">
                      Major technology companies collaborate on next-generation artificial intelligence breakthrough.
                    </p>
                    <div className="flex items-center space-x-3 text-xs text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>45 min ago</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>8.7K</span>
                      </span>
                    </div>
                  </article>
                </Link>

                <Link href="/article/3" className="group block">
                  <article>
                    <div className="relative aspect-[4/3] mb-3 overflow-hidden rounded-lg shadow-sm">
                      <Image
                        src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop"
                        alt="Business News"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 left-2.5">
                        <span className="bg-success text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm">Business</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors mb-1.5 line-clamp-2 leading-snug">
                      Global Markets Show Strong Recovery Signs
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-2">
                      Financial markets demonstrate resilience amid challenging economic conditions worldwide.
                    </p>
                    <div className="flex items-center space-x-3 text-xs text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>1 hour ago</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>12.1K</span>
                      </span>
                    </div>
                  </article>
                </Link>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Most Read Section */}
              <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="bg-brand-primary text-white px-4 py-3 flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-bold text-base">Most Read</span>
                </div>
                <div className="bg-white dark:bg-gray-800">
                  {[
                    {
                      id: 1,
                      title: "Major breakthrough in quantum computing research announced",
                      category: "Technology",
                      time: "2h ago",
                      image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=80&h=60&fit=crop"
                    },
                    {
                      id: 2,
                      title: "Global markets surge as inflation rates drop worldwide",
                      category: "Business",
                      time: "3h ago",
                      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=80&h=60&fit=crop"
                    },
                    {
                      id: 3,
                      title: "New archaeological discovery rewrites ancient history",
                      category: "Science",
                      time: "5h ago",
                      image: "https://images.unsplash.com/photo-1594736797933-d0f06ba42718?w=80&h=60&fit=crop"
                    },
                    {
                      id: 4,
                      title: "Championship final breaks television viewing records",
                      category: "Sports",
                      time: "6h ago",
                      image: "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=80&h=60&fit=crop"
                    },
                    {
                      id: 5,
                      title: "Renewable energy project powers entire city sustainably",
                      category: "Environment",
                      time: "8h ago",
                      image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=80&h=60&fit=crop"
                    }
                  ].map((item) => (
                    <Link
                      key={item.id}
                      href={`/article/${item.id}`}
                      className="flex items-start space-x-3 group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                    >
                      <span className="text-brand-accent font-bold text-lg flex-shrink-0 w-6 text-center leading-tight">{item.id}</span>
                      <div className="relative w-14 h-10 flex-shrink-0 rounded overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors line-clamp-2 leading-tight">
                          {item.title}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                          <span className="text-brand-secondary dark:text-brand-accent font-medium">{item.category}</span>
                          <span>·</span>
                          <span>{item.time}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More Stories Section */}
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
