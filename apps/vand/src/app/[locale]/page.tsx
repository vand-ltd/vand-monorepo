import { SiteHeader } from '@/components/SiteHeader';
import { Hero } from '@/components/Hero';
import { Services } from '@/components/Services';
import { ProductSpotlight } from '@/components/ProductSpotlight';
import { About } from '@/components/About';
import { Contact } from '@/components/Contact';
import { SiteFooter } from '@/components/SiteFooter';

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Services />
        <ProductSpotlight />
        <About />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
