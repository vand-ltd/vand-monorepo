import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  Globe,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const contactInfo = [
  {
    icon: Mail,
    title: "Email Us",
    detail: "news@vandnews.com",
    description: "For general inquiries and press releases",
  },
  {
    icon: Phone,
    title: "Call Us",
    detail: "+250 788 123 456",
    description: "Mon-Fri, 8:00 AM - 6:00 PM CAT",
  },
  {
    icon: MapPin,
    title: "Visit Us",
    detail: "Kigali, Rwanda",
    description: "KG 7 Ave, Kigali Innovation City",
  },
  {
    icon: Clock,
    title: "Business Hours",
    detail: "24/7 Newsroom",
    description: "Editorial team available around the clock",
  },
];

const departments = [
  {
    name: "Editorial",
    email: "editorial@vandnews.com",
    description: "Story tips, corrections, and editorial feedback",
  },
  {
    name: "Advertising",
    email: "ads@vandnews.com",
    description: "Ad placements, sponsored content, and partnerships",
  },
  {
    name: "Careers",
    email: "careers@vandnews.com",
    description: "Job opportunities and internship programs",
  },
  {
    name: "Technical Support",
    email: "support@vandnews.com",
    description: "Website issues and technical assistance",
  },
];

export default function ContactPage() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="relative bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-accent rounded-2xl p-8 md:p-12 lg:p-16 text-white">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-medium">Get in Touch</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Contact Us
            </h1>
            <p className="text-xl md:text-2xl text-gray-100 leading-relaxed">
              Have a story tip, feedback, or inquiry? We&apos;d love to hear from you.
              Our team is ready to assist you.
            </p>
          </div>

          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-32 -translate-x-16"></div>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactInfo.map((item, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300 group">
              <CardContent className="p-6 space-y-4">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-primary/10 rounded-xl group-hover:bg-brand-primary/20 transition-colors">
                  <item.icon className="h-7 w-7 text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-brand-primary font-medium text-sm mb-1">
                    {item.detail}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact Form & Departments */}
      <section>
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Send Us a Message
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Fill out the form below and we&apos;ll get back to you within 24 hours.
            </p>

            <form className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-colors"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  id="contactEmail"
                  type="email"
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject
                </label>
                <select
                  id="subject"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-colors"
                  required
                >
                  <option value="">Select a topic</option>
                  <option value="story-tip">Story Tip</option>
                  <option value="feedback">Feedback</option>
                  <option value="advertising">Advertising</option>
                  <option value="partnership">Partnership</option>
                  <option value="correction">Correction Request</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  placeholder="Tell us more about your inquiry..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none transition-colors"
                  required
                ></textarea>
              </div>

              <Button
                type="submit"
                className="w-full bg-brand-primary hover:bg-brand-secondary text-white py-3 text-base font-semibold"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </form>
          </div>

          {/* Departments & Additional Info */}
          <div className="space-y-8">
            {/* Map Placeholder */}
            <Card className="overflow-hidden">
              <div className="relative h-64 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary/10 rounded-full">
                      <Globe className="h-8 w-8 text-brand-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Kigali, Rwanda</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">KG 7 Ave, Kigali Innovation City</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Departments */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Departments
              </h3>
              <div className="space-y-3">
                {departments.map((dept, index) => (
                  <Card key={index} className="group hover:shadow-md transition-shadow duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {dept.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {dept.description}
                          </p>
                          <p className="text-sm text-brand-primary font-medium mt-1">
                            {dept.email}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-brand-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Story Tip Callout */}
            <Card className="bg-brand-primary text-white">
              <CardContent className="p-6 text-center space-y-3">
                <MessageSquare className="h-8 w-8 mx-auto opacity-80" />
                <h3 className="text-lg font-bold">Have a Story Tip?</h3>
                <p className="text-sm text-gray-200">
                  Got a lead on a breaking story? Our editorial team reviews every tip submitted.
                  Your identity will be kept confidential.
                </p>
                <Button className="bg-brand-accent hover:bg-brand-secondary text-white mt-2">
                  <Send className="h-4 w-4 mr-2" />
                  Submit a Tip
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: "Contact Us | Vand News",
    description: "Get in touch with Vand News. Send us story tips, feedback, or business inquiries. Our team is available 24/7.",
    openGraph: {
      title: "Contact Vand News",
      description: "Reach out to our editorial team for story tips, feedback, and inquiries.",
      type: "website",
    },
  };
}
