-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'user');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin or staff
CREATE OR REPLACE FUNCTION public.is_admin_or_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'staff')
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add RLS policies for products table to allow admin management
CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
WITH CHECK (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
USING (public.is_admin_or_staff(auth.uid()));

-- Add RLS policies for product_stock table to allow admin management
CREATE POLICY "Admins can insert product stock"
ON public.product_stock
FOR INSERT
WITH CHECK (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins can update product stock"
ON public.product_stock
FOR UPDATE
USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins can delete product stock"
ON public.product_stock
FOR DELETE
USING (public.is_admin_or_staff(auth.uid()));

-- Allow admins to update orders
CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
USING (public.is_admin_or_staff(auth.uid()));