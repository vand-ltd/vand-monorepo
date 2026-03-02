import Image from "next/image";
import Link from "next/link";
import {
  Users,
  Globe,
  Award,
  Clock,
  Target,
  Mail,
  MapPin,
  Phone,
  ArrowRight,
  CheckCircle,
  Star,
  TrendingUp,
  Shield,
  Zap
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const teamMembers = [
  {
    name: "Sarah Johnson",
    role: "Editor-in-Chief",
    bio: "Award-winning journalist with 15+ years covering international affairs and climate policy.",
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=300&h=300&fit=crop&crop=face",
    experience: "15+ years",
    articles: "1,200+"
  },
  {
    name: "Michael Chen",
    role: "Technology Editor",
    bio: "Former Silicon Valley correspondent specializing in AI, cybersecurity, and emerging technologies.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
    experience: "12+ years",
    articles: "850+"
  },
  {
    name: "Elena Rodriguez",
    role: "Political Correspondent",
    bio: "Political analyst and investigative reporter covering global politics and policy developments.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face",
    experience: "10+ years",
    articles: "950+"
  },
  {
    name: "David Kim",
    role: "Business Reporter",
    bio: "Financial markets expert covering economic trends, startup ecosystems, and corporate developments.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
    experience: "8+ years",
    articles: "650+"
  }
];

const milestones = [
  {
    year: "2019",
    title: "Vand News Founded",
    description: "Started as an independent digital news platform with a focus on quality journalism"
  },
  {
    year: "2020",
    title: "1M Monthly Readers",
    description: "Reached our first million monthly readers during the global pandemic coverage"
  },
  {
    year: "2022",
    title: "Journalism Awards",
    description: "Won three major journalism awards for investigative reporting and climate coverage"
  },
  {
    year: "2023",
    title: "Global Expansion",
    description: "Launched international bureaus in London, Tokyo, and São Paulo"
  },
  {
    year: "2024",
    title: "5M Global Audience",
    description: "Became one of the fastest-growing independent news platforms worldwide"
  }
];

const values = [
  {
    icon: Shield,
    title: "Editorial Independence",
    description: "We maintain complete editorial independence, free from corporate or political influence."
  },
  {
    icon: CheckCircle,
    title: "Fact-Based Reporting",
    description: "Every story is thoroughly fact-checked and verified by our experienced editorial team."
  },
  {
    icon: Globe,
    title: "Global Perspective",
    description: "We cover stories from around the world with local insight and global context."
  },
  {
    icon: Zap,
    title: "Real-Time Updates",
    description: "Breaking news and live updates delivered as events unfold across the globe."
  },
  {
    icon: Users,
    title: "Community Focus",
    description: "We believe in fostering informed discussions and building engaged communities."
  },
  {
    icon: Target,
    title: "Transparency",
    description: "We're open about our sources, methodology, and commitment to ethical journalism."
  }
];

const stats = [
  { number: "5M+", label: "Monthly Readers", icon: Users },
  { number: "50+", label: "Countries Covered", icon: Globe },
  { number: "15+", label: "Expert Journalists", icon: Award },
  { number: "24/7", label: "News Coverage", icon: Clock }
];

export default function AboutPage() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="relative bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-accent rounded-2xl p-8 md:p-12 lg:p-16 text-white">
          <div className="relative z-10 max-w-4xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              About Vand News
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-100 leading-relaxed">
              Independent journalism for a connected world. We deliver accurate, 
              unbiased news that matters to global citizens.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-white text-brand-primary hover:bg-gray-100 font-semibold px-8 py-3"
              >
                <Mail className="h-5 w-5 mr-2" />
                Contact Us
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white/10 font-semibold px-8 py-3"
              >
                <TrendingUp className="h-5 w-5 mr-2" />
                Our Impact
              </Button>
            </div>
          </div>
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-32 -translate-x-16"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow duration-300">
              <CardContent className="space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-accent/10 rounded-full">
                  <stat.icon className="h-6 w-6 text-brand-accent" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-brand-primary">{stat.number}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Mission & Values Section */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Our Mission & Values
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            We&apos;re committed to delivering trustworthy journalism that empowers people
            to make informed decisions about their world.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6 space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-primary/10 rounded-lg group-hover:bg-brand-primary/20 transition-colors">
                  <value.icon className="h-6 w-6 text-brand-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {value.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Timeline Section */}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Our Journey
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            From a small startup to a global news platform trusted by millions.
          </p>
        </div>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-4 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-brand-primary/20"></div>
          
          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="relative flex items-center">
                {/* Timeline Dot */}
                <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 w-3 h-3 bg-brand-accent rounded-full border-4 border-white dark:border-gray-900 shadow-lg z-10"></div>
                
                {/* Content */}
                <div className={`ml-12 md:ml-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8 md:ml-auto'}`}>
                  <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="space-y-3">
                      <div className="text-2xl font-bold text-brand-primary">{milestone.year}</div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {milestone.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {milestone.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Meet Our Team
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Our diverse team of experienced journalists and editors from around the world.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardContent className="p-6 text-center space-y-4">
                <div className="relative w-24 h-24 mx-auto">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    {member.name}
                  </h3>
                  <p className="text-brand-primary font-medium mb-3">{member.role}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                    {member.bio}
                  </p>
                  <div className="flex justify-center space-x-4 text-xs text-gray-500">
                    <span>{member.experience}</span>
                    <span>•</span>
                    <span>{member.articles} articles</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8 md:p-12">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Get in Touch
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Have a story tip, press inquiry, or want to collaborate? 
              We&apos;d love to hear from you.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                  <Mail className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Email</div>
                  <div className="text-gray-600 dark:text-gray-400">news@vandnews.com</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                  <Phone className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Phone</div>
                  <div className="text-gray-600 dark:text-gray-400">+1 (555) 123-4567</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Headquarters</div>
                  <div className="text-gray-600 dark:text-gray-400">New York, NY • London, UK</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <Card className="p-6">
              <CardContent className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Quick Contact
                </h3>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Your Name" 
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                  <input 
                    type="email" 
                    placeholder="Your Email" 
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                  <textarea 
                    placeholder="Your Message" 
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
                  ></textarea>
                  <Button className="w-full bg-brand-primary hover:bg-brand-secondary text-white">
                    Send Message
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center space-y-8 py-12">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Stay Informed
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join millions of readers who trust Vand News for accurate, timely reporting 
            on the stories that shape our world.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/subscribe">
            <Button size="lg" className="bg-brand-accent hover:bg-brand-secondary text-white px-8 py-3">
              <Star className="h-5 w-5 mr-2" />
              Subscribe to Newsletter
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="lg" className="px-8 py-3">
              <Globe className="h-5 w-5 mr-2" />
              Read Latest News
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: "About Us | Vand News - Independent Global Journalism",
    description: "Learn about Vand News, our mission for independent journalism, our expert team, and our commitment to delivering accurate, unbiased news from around the world.",
    keywords: "about vand news, independent journalism, news team, editorial mission, global news coverage",
    openGraph: {
      title: "About Vand News - Independent Global Journalism",
      description: "Discover our mission, values, and the expert team behind Vand News - your trusted source for independent global journalism.",
      type: "website",
    },
  };
}