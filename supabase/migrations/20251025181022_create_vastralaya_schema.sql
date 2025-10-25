/*
  # Vastralaya E-Commerce Platform Database Schema

  1. New Tables
    - `retailer_auth`
      - `id` (uuid, primary key)
      - `email` (text, unique) - Retailer login email
      - `password_hash` (text) - Hashed password
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `customers`
      - `id` (uuid, primary key, references auth.users)
      - `phone_number` (text, unique)
      - `full_name` (text)
      - `email` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `customer_addresses`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, references customers)
      - `address_line1` (text)
      - `address_line2` (text)
      - `city` (text)
      - `state` (text)
      - `pincode` (text)
      - `phone` (text)
      - `is_default` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `category` (text) - saree, kurti, mysore_silk, crepe_silk, etc.
      - `price` (decimal)
      - `stock_quantity` (integer)
      - `image_url` (text)
      - `additional_images` (text array)
      - `size_options` (text array)
      - `color_options` (text array)
      - `material` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `is_active` (boolean)
    
    - `orders`
      - `id` (uuid, primary key)
      - `order_number` (text, unique)
      - `customer_id` (uuid, references customers)
      - `address_id` (uuid, references customer_addresses)
      - `total_amount` (decimal)
      - `payment_status` (text) - pending, completed, failed
      - `payment_method` (text) - phonepe_qr
      - `payment_screenshot_url` (text)
      - `order_status` (text) - placed, confirmed, shipped, delivered, cancelled
      - `tracking_number` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `product_id` (uuid, references products)
      - `quantity` (integer)
      - `price_at_purchase` (decimal)
      - `size` (text)
      - `color` (text)
      - `created_at` (timestamptz)
    
    - `cart_items`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, references customers)
      - `product_id` (uuid, references products)
      - `quantity` (integer)
      - `size` (text)
      - `color` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Retailer can access all products and orders
    - Customers can only access their own data
    - Public can view active products
    
  3. Important Notes
    - Retailer authentication uses custom table (not auth.users)
    - Customer authentication uses Supabase Auth (auth.users)
    - All sensitive data protected with RLS policies
    - Payment screenshots stored for order verification
*/

-- Create retailer_auth table
CREATE TABLE IF NOT EXISTS retailer_auth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number text UNIQUE,
  full_name text NOT NULL,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customer_addresses table
CREATE TABLE IF NOT EXISTS customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text DEFAULT '',
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  phone text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  price decimal(10,2) NOT NULL,
  stock_quantity integer DEFAULT 0,
  image_url text NOT NULL,
  additional_images text[] DEFAULT '{}',
  size_options text[] DEFAULT '{}',
  color_options text[] DEFAULT '{}',
  material text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  address_id uuid REFERENCES customer_addresses(id) NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  payment_status text DEFAULT 'pending',
  payment_method text DEFAULT 'phonepe_qr',
  payment_screenshot_url text,
  order_status text DEFAULT 'placed',
  tracking_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) NOT NULL,
  quantity integer NOT NULL,
  price_at_purchase decimal(10,2) NOT NULL,
  size text DEFAULT '',
  color text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity integer DEFAULT 1,
  size text DEFAULT '',
  color text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(customer_id, product_id, size, color)
);

-- Enable Row Level Security
ALTER TABLE retailer_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for retailer_auth
CREATE POLICY "Retailer can view own auth data"
  ON retailer_auth FOR SELECT
  TO authenticated
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Retailer can update own password"
  ON retailer_auth FOR UPDATE
  TO authenticated
  USING (email = current_setting('request.jwt.claims', true)::json->>'email')
  WITH CHECK (email = current_setting('request.jwt.claims', true)::json->>'email');

-- RLS Policies for customers
CREATE POLICY "Customers can view own profile"
  ON customers FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Customers can insert own profile"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Customers can update own profile"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for customer_addresses
CREATE POLICY "Customers can view own addresses"
  ON customer_addresses FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can insert own addresses"
  ON customer_addresses FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update own addresses"
  ON customer_addresses FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can delete own addresses"
  ON customer_addresses FOR DELETE
  TO authenticated
  USING (customer_id = auth.uid());

-- RLS Policies for products
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage products"
  ON products FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for orders
CREATE POLICY "Customers can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Service role can view all orders"
  ON orders FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can update orders"
  ON orders FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for order_items
CREATE POLICY "Customers can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = auth.uid()
    )
  );

CREATE POLICY "Customers can create order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = auth.uid()
    )
  );

CREATE POLICY "Service role can view all order items"
  ON order_items FOR SELECT
  TO service_role
  USING (true);

-- RLS Policies for cart_items
CREATE POLICY "Customers can view own cart"
  ON cart_items FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can add to own cart"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update own cart"
  ON cart_items FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can delete from own cart"
  ON cart_items FOR DELETE
  TO authenticated
  USING (customer_id = auth.uid());

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_customer_id ON cart_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);

-- Insert the retailer credentials (password: Rio_vr_446)
-- Using crypt function with bcrypt for secure password hashing
INSERT INTO retailer_auth (email, password_hash)
VALUES ('rionithin446@gmail.com', crypt('Rio_vr_446', gen_salt('bf')))
ON CONFLICT (email) DO NOTHING;