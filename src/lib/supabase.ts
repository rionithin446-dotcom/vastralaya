import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      retailer_auth: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          created_at: string;
          updated_at: string;
        };
      };
      customers: {
        Row: {
          id: string;
          phone_number: string | null;
          full_name: string;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      customer_addresses: {
        Row: {
          id: string;
          customer_id: string;
          address_line1: string;
          address_line2: string;
          city: string;
          state: string;
          pincode: string;
          phone: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string;
          category: string;
          price: number;
          stock_quantity: number;
          image_url: string;
          additional_images: string[];
          size_options: string[];
          color_options: string[];
          material: string;
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string;
          address_id: string;
          total_amount: number;
          payment_status: string;
          payment_method: string;
          payment_screenshot_url: string | null;
          order_status: string;
          tracking_number: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          price_at_purchase: number;
          size: string;
          color: string;
          created_at: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          customer_id: string;
          product_id: string;
          quantity: number;
          size: string;
          color: string;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};
