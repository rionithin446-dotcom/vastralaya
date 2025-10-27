import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const cartItemId = pathParts[pathParts.length - 1];

    switch (req.method) {
      case 'GET': {
        const { data: cartItems, error } = await supabase
          .from('cart_items')
          .select(`
            *,
            products (*)
          `)
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(
          JSON.stringify(cartItems || []),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'POST': {
        const { product_id, quantity, size, color } = await req.json();

        if (!product_id || !quantity) {
          return new Response(
            JSON.stringify({ error: 'Product ID and quantity are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: existingItem, error: checkError } = await supabase
          .from('cart_items')
          .select('*')
          .eq('customer_id', user.id)
          .eq('product_id', product_id)
          .eq('size', size || '')
          .eq('color', color || '')
          .maybeSingle();

        if (checkError) throw checkError;

        let result;
        if (existingItem) {
          const { data, error } = await supabase
            .from('cart_items')
            .update({ quantity: existingItem.quantity + quantity })
            .eq('id', existingItem.id)
            .select(`
              *,
              products (*)
            `)
            .single();

          if (error) throw error;
          result = data;
        } else {
          const { data, error } = await supabase
            .from('cart_items')
            .insert({
              customer_id: user.id,
              product_id,
              quantity,
              size: size || '',
              color: color || '',
            })
            .select(`
              *,
              products (*)
            `)
            .single();

          if (error) throw error;
          result = data;
        }

        return new Response(
          JSON.stringify(result),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'PUT': {
        if (!cartItemId || cartItemId === 'cart') {
          return new Response(
            JSON.stringify({ error: 'Cart item ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { quantity } = await req.json();

        if (!quantity || quantity < 1) {
          return new Response(
            JSON.stringify({ error: 'Valid quantity required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('id', cartItemId)
          .eq('customer_id', user.id)
          .select(`
            *,
            products (*)
          `)
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'DELETE': {
        if (!cartItemId || cartItemId === 'cart') {
          const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('customer_id', user.id);

          if (error) throw error;

          return new Response(
            JSON.stringify({ message: 'Cart cleared' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', cartItemId)
          .eq('customer_id', user.id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ message: 'Item removed from cart' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});