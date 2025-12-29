import { Truck, Shield, RefreshCcw, Headphones } from 'lucide-react';

const features = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'Complimentary delivery on all orders above ₹2999',
  },
  {
    icon: Shield,
    title: 'Quality Assured',
    description: 'Premium fabrics with meticulous craftsmanship',
  },
  {
    icon: RefreshCcw,
    title: 'Easy Returns',
    description: '7-day hassle-free return and exchange policy',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Dedicated customer service at your fingertips',
  },
];

export function Features() {
  return (
    <section className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="flex flex-col items-center text-center p-6 rounded-xl bg-background/50 hover-lift animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-gold" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
