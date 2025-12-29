export interface Product {
  id: string;
  name: string;
  description: string;
  pantDetails: string;
  shirtDetails: string;
  price: number;
  originalPrice?: number;
  image: string;
  sizes: SizeStock[];
  category: string;
  featured?: boolean;
}

export interface SizeStock {
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  quantity: number;
}

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  type: 'online' | 'offline';
  createdAt: Date;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
}
