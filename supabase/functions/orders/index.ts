import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
}

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
    const orderId = pathParts[pathParts.length - 1];

    switch (req.method) {
      case 'GET': {
        if (orderId && orderId !== 'orders') {
          const { data: order, error } = await supabase
            .from('orders')
            .select(`
              *,
              customer_addresses (*),
              order_items (
                *,
                products (*)
              )
            `)
            .eq('id', orderId)
            .eq('customer_id', user.id)
            .maybeSingle();

          if (error) throw error;
          if (!order) {
            return new Response(
              JSON.stringify({ error: 'Order not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify(order),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          const { data: orders, error } = await supabase
            .from('orders')
            .select(`
              *,
              customer_addresses (*),
              order_items (
                *,
                products (*)
              )
            `)
            .eq('customer_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          return new Response(
            JSON.stringify(orders || []),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'POST': {
        const { address_id, items, payment_screenshot_url } = await req.json();

        if (!address_id || !items || items.length === 0) {
          return new Response(
            JSON.stringify({ error: 'Address and items are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let totalAmount = 0;
        const productIds = items.map((item: any) => item.product_id);
        
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, price, stock_quantity')
          .in('id', productIds);

        if (productsError) throw productsError;

        const productMap = new Map(products.map(p => [p.id, p]));

        for (const item of items) {
          const product = productMap.get(item.product_id);
          if (!product) {
            return new Response(
              JSON.stringify({ error: `Product ${item.product_id} not found` }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          if (product.stock_quantity < item.quantity) {
            return new Response(
              JSON.stringify({ error: `Insufficient stock for product ${item.product_id}` }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          totalAmount += product.price * item.quantity;
        }

        const orderNumber = generateOrderNumber();

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            customer_id: user.id,
            address_id,
            total_amount: totalAmount,
            payment_status: payment_screenshot_url ? 'pending' : 'pending',
            payment_screenshot_url: payment_screenshot_url || null,
            order_status: 'placed',
          })
          .select()
          .single();

        if (orderError) throw orderError;

        const orderItems = items.map((item: any) => {
          const product = productMap.get(item.product_id);
          return {
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price_at_purchase: product.price,
            size: item.size || '',
            color: item.color || '',
          };
        });

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        for (const item of items) {
          const product = productMap.get(item.product_id);
          await supabase
            .from('products')
            .update({ stock_quantity: product.stock_quantity - item.quantity })
            .eq('id', item.product_id);
        }

        await supabase
          .from('cart_items')
          .delete()
          .eq('customer_id', user.id);

        const { data: fullOrder } = await supabase
          .from('orders')
          .select(`
            *,
            customer_addresses (*),
            order_items (
              *,
              products (*)
            )
          `)
          .eq('id', order.id)
          .single();

        return new Response(
          JSON.stringify(fullOrder),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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