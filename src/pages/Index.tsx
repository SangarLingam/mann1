import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { Features } from '@/components/home/Features';
import { CategoryShowcase } from '@/components/home/CategoryShowcase';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <Features />
        <FeaturedProducts />
        <CategoryShowcase />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
