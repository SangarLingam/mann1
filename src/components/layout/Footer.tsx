import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-charcoal text-cream">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl font-bold tracking-tight text-cream">
                MANN
              </span>
              <span className="text-gold font-display text-sm tracking-widest">
                CLOTHING
              </span>
            </div>
            <p className="text-cream/70 text-sm leading-relaxed">
              Elevating men's fashion with premium combo collections. 
              Experience sophistication in every thread.
            </p>
            <div className="flex gap-4 pt-4">
              <a href="#" className="text-cream/60 hover:text-gold transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-cream/60 hover:text-gold transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-cream/60 hover:text-gold transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold">Quick Links</h4>
            <nav className="flex flex-col gap-3">
              <Link to="/collection" className="text-cream/70 hover:text-gold transition-colors text-sm">
                Our Collection
              </Link>
              <Link to="/about" className="text-cream/70 hover:text-gold transition-colors text-sm">
                About Us
              </Link>
              <Link to="/contact" className="text-cream/70 hover:text-gold transition-colors text-sm">
                Contact
              </Link>
              <Link to="/admin" className="text-cream/70 hover:text-gold transition-colors text-sm">
                Admin Portal
              </Link>
            </nav>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold">Customer Service</h4>
            <nav className="flex flex-col gap-3">
              <a href="#" className="text-cream/70 hover:text-gold transition-colors text-sm">
                Shipping & Returns
              </a>
              <a href="#" className="text-cream/70 hover:text-gold transition-colors text-sm">
                Size Guide
              </a>
              <a href="#" className="text-cream/70 hover:text-gold transition-colors text-sm">
                FAQs
              </a>
              <a href="#" className="text-cream/70 hover:text-gold transition-colors text-sm">
                Track Order
              </a>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-cream/70 text-sm">
                <MapPin className="h-4 w-4 text-gold" />
                <span>123 Fashion Street, Mumbai, India</span>
              </div>
              <div className="flex items-center gap-3 text-cream/70 text-sm">
                <Phone className="h-4 w-4 text-gold" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-3 text-cream/70 text-sm">
                <Mail className="h-4 w-4 text-gold" />
                <span>hello@mannclothing.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-cream/10 mt-12 pt-8 text-center">
          <p className="text-cream/50 text-sm">
            © {new Date().getFullYear()} MANN Clothing. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
