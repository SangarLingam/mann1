import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{
          backgroundImage: `linear-gradient(hsl(var(--gold) / 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--gold) / 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-8 animate-fade-up">
            <Sparkles className="h-4 w-4 text-gold" />
            <span className="text-gold text-sm font-medium tracking-wide">New Collection 2024</span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-cream leading-tight mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Redefine Your
            <span className="block text-gradient-gold">Style Statement</span>
          </h1>

          {/* Subheading */}
          <p className="text-cream/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            Premium combo collections crafted for the modern gentleman. 
            Experience the perfect harmony of pant and shirt ensembles.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/collection">
              <Button variant="hero" size="xl" className="group">
                Explore Collection
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="gold-outline" size="xl">
                Our Story
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-20 pt-10 border-t border-cream/10 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <div className="text-center">
              <div className="font-display text-4xl font-bold text-gold mb-1">50+</div>
              <div className="text-cream/60 text-sm">Combo Designs</div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl font-bold text-gold mb-1">10K+</div>
              <div className="text-cream/60 text-sm">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl font-bold text-gold mb-1">5★</div>
              <div className="text-cream/60 text-sm">Customer Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-cream/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-gold rounded-full" />
        </div>
      </div>
    </section>
  );
}
