import Link from "next/link";
import Image from "next/image";
import { Youtube, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='bg-gray-900 text-gray-300 border-t'>
      {/* Top Advertisement */}
      <div className="border-b border-gray-800 py-6">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="w-full max-w-[728px] mx-auto h-[120px] bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-lg flex items-center justify-center text-sm text-gray-400 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20"></div>
            <div className="relative text-center">
              <div className="text-base font-semibold text-gray-300 mb-1">Footer Advertisement</div>
              <span className="text-xs">728 × 90 (Desktop) / 320 × 100 (Mobile)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="mb-4">
              <Image
                src="/menyesha-logo.svg"
                alt="Vand News"
                width={120}
                height={40}
                className="h-10 w-auto object-contain brightness-0 invert"
              />
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Delivering accurate, unbiased news and in-depth analysis from around the world.
              Your trusted source for breaking news and expert commentary.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="bg-gray-800 hover:bg-brand-accent dark:hover:bg-brand-accent p-2 rounded-lg transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"/>
                </svg>
              </a>
              <a href="#" className="bg-gray-800 hover:bg-brand-accent dark:hover:bg-brand-accent p-2 rounded-lg transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="bg-gray-800 hover:bg-brand-accent dark:hover:bg-brand-accent p-2 rounded-lg transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.083.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-12C24.007 5.367 18.641.001 12.017.001z" clipRule="evenodd"/>
                </svg>
              </a>
              <a href="#" className="bg-gray-800 hover:bg-brand-accent dark:hover:bg-brand-accent p-2 rounded-lg transition-colors">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {['Home', 'Politics', 'Business', 'Technology', 'Sports', 'World', 'Opinion'].map((link) => (
                <li key={link}>
                  <Link href="#" className="text-sm hover:text-brand-accent dark:hover:text-brand-accent transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">About</h4>
            <ul className="space-y-2">
              {['About Us', 'Editorial Team', 'Press Releases', 'Careers', 'Contact', 'Advertise', 'RSS Feeds'].map((link) => (
                <li key={link}>
                  <Link href="#" className="text-sm hover:text-brand-accent dark:hover:text-brand-accent transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Stay Connected</h4>
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>news@vandnews.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>+250 788 123 456</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>Kigali, Rwanda</span>
              </div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg">
              <h5 className="font-semibold text-white mb-2">Newsletter</h5>
              <p className="text-xs text-gray-400 mb-3">Get daily news updates</p>
              <div className="flex space-x-2">
                <input 
                  type="email" 
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
                <button className="bg-brand-accent text-white hover:bg-brand-secondary dark:hover:bg-brand-accent px-3 py-2 rounded text-sm font-bold transition-colors">
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 bg-gray-950">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="text-sm text-gray-400">
              © {currentYear} Vand News. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="#" className="hover:text-brand-primary dark:hover:text-brand-accent transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-brand-primary dark:hover:text-brand-accent transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-brand-primary dark:hover:text-brand-accent transition-colors">Cookie Policy</Link>
              <Link href="#" className="hover:text-brand-primary dark:hover:text-brand-accent transition-colors">Ethics Guidelines</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
