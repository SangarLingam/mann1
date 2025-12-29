import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Award, Users, Shirt, Target } from 'lucide-react';

const values = [
  {
    icon: Award,
    title: 'Quality First',
    description: 'We source only the finest fabrics and employ skilled artisans to craft each piece.',
  },
  {
    icon: Users,
    title: 'Customer Focus',
    description: 'Your satisfaction drives everything we do. We listen, adapt, and deliver excellence.',
  },
  {
    icon: Shirt,
    title: 'Perfect Combos',
    description: 'Our unique combo sets are designed to make styling effortless and sophisticated.',
  },
  {
    icon: Target,
    title: 'Innovation',
    description: 'Constantly evolving our designs to match modern trends while maintaining timeless appeal.',
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-hero py-24">
          <div className="container mx-auto px-4 text-center">
            <span className="text-gold text-sm font-medium tracking-widest uppercase mb-4 block animate-fade-up">
              Our Story
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-cream mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Crafting Excellence
              <br />Since 2020
            </h1>
            <p className="text-cream/70 text-lg max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.2s' }}>
              MANN Clothing was born from a simple vision: to make every man feel confident 
              and stylish without the hassle of matching outfits.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                Our Mission
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                At MANN Clothing, we believe that looking good shouldn't be complicated. 
                Our carefully curated combo collections take the guesswork out of dressing well, 
                offering perfectly matched pant and shirt combinations that elevate your style 
                for every occasion. From boardroom meetings to weekend getaways, we've got you covered.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-secondary">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-12">
              What We Stand For
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div
                  key={value.title}
                  className="text-center p-6 bg-background rounded-xl hover-lift animate-fade-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-8 w-8 text-gold" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="animate-fade-up">
                <div className="font-display text-5xl font-bold text-gold mb-2">50+</div>
                <div className="text-muted-foreground">Combo Designs</div>
              </div>
              <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
                <div className="font-display text-5xl font-bold text-gold mb-2">10K+</div>
                <div className="text-muted-foreground">Happy Customers</div>
              </div>
              <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
                <div className="font-display text-5xl font-bold text-gold mb-2">15</div>
                <div className="text-muted-foreground">Cities Served</div>
              </div>
              <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
                <div className="font-display text-5xl font-bold text-gold mb-2">4.9★</div>
                <div className="text-muted-foreground">Customer Rating</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
