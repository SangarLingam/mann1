import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

const categories = [
  {
    name: 'Formal',
    description: 'Boardroom ready elegance',
    image: '/placeholder.svg',
    gradient: 'from-charcoal to-charcoal-light',
  },
  {
    name: 'Business Casual',
    description: 'Smart meets comfortable',
    image: '/placeholder.svg',
    gradient: 'from-gold/80 to-gold',
  },
  {
    name: 'Casual',
    description: 'Weekend style essentials',
    image: '/placeholder.svg',
    gradient: 'from-charcoal-light to-charcoal',
  },
];

export function CategoryShowcase() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-gold text-sm font-medium tracking-widest uppercase mb-4 block">
            Shop By Style
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Find Your Perfect Look
          </h2>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <Link
              key={category.name}
              to={`/collection?category=${category.name}`}
              className="group relative aspect-[4/5] rounded-2xl overflow-hidden animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient}`} />
              
              {/* Content */}
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <div className="space-y-2">
                  <h3 className="font-display text-3xl font-bold text-cream">
                    {category.name}
                  </h3>
                  <p className="text-cream/70">
                    {category.description}
                  </p>
                </div>
                
                {/* Arrow */}
                <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-cream/10 backdrop-blur-sm flex items-center justify-center transition-all duration-300 group-hover:bg-gold group-hover:scale-110">
                  <ArrowUpRight className="h-5 w-5 text-cream transition-colors group-hover:text-charcoal" />
                </div>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gold/0 transition-colors duration-300 group-hover:bg-gold/10" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
