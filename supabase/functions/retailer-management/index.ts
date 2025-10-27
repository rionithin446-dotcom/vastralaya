import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function verifyRetailerToken(authHeader: string | null): any {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Invalid authorization header');
  }

  const token = authHeader.substring(7);
  try {
    const decoded = JSON.parse(atob(token));
    
    if (decoded.role !== 'retailer') {
      throw new Error('Not a retailer token');
    }
    
    if (decoded.exp < Date.now()) {
      throw new Error('Token expired');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    const retailer = verifyRetailerToken(authHeader);

    const url = new URL(req.url);
    const resource = url.pathname.split('/').filter(Boolean).pop();

    if (resource === 'orders' || url.pathname.includes('orders')) {
      const pathParts = url.pathname.split('/').filter(Boolean);
      const orderId = pathParts[pathParts.length - 1] !== 'orders' ? pathParts[pathParts.length - 1] : null;

      switch (req.method) {
        case 'GET': {
          if (orderId) {
            const { data, error } = await supabase
              .from('orders')
              .select(`
                *,
                customers (*),
                customer_addresses (*),
                order_items (
                  *,
                  products (*)
                )
              `)
              .eq('id', orderId)
              .single();

            if (error) throw error;

            return new Response(
              JSON.stringify(data),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const status = url.searchParams.get('status');
          let query = supabase
            .from('orders')
            .select(`
              *,
              customers (*),
              customer_addresses (*),
              order_items (
                *,
                products (*)
              )
            `);

          if (status) {
            query = query.eq('order_status', status);
          }

          query = query.order('created_at', { ascending: false });

          const { data, error } = await query;

          if (error) throw error;

          return new Response(
            JSON.stringify(data || []),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        case 'PUT': {
          if (!orderId) {
            return new Response(
              JSON.stringify({ error: 'Order ID required' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const updates = await req.json();
          const { data, error } = await supabase
            .from('orders')
            .update(updates)
            .eq('id', orderId)
            .select(`
              *,
              customers (*),
              customer_addresses (*),
              order_items (
                *,
                products (*)
              )
            `)
            .single();

          if (error) throw error;

          return new Response(
            JSON.stringify(data),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        default:
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }
    }

    if (resource === 'products' || url.pathname.includes('products')) {
      const pathParts = url.pathname.split('/').filter(Boolean);
      const productId = pathParts[pathParts.length - 1] !== 'products' ? pathParts[pathParts.length - 1] : null;

      switch (req.method) {
        case 'GET': {
          if (productId) {
            const { data, error } = await supabase
              .from('products')
              .select('*')
              .eq('id', productId)
              .single();

            if (error) throw error;

            return new Response(
              JSON.stringify(data),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;

          return new Response(
            JSON.stringify(data || []),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        case 'POST': {
          const product = await req.json();
          const { data, error } = await supabase
            .from('products')
            .insert([product])
            .select()
            .single();

          if (error) throw error;

          return new Response(
            JSON.stringify(data),
            { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        case 'PUT': {
          if (!productId) {
            return new Response(
              JSON.stringify({ error: 'Product ID required' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const updates = await req.json();
          const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', productId)
            .select()
            .single();

          if (error) throw error;

          return new Response(
            JSON.stringify(data),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        case 'DELETE': {
          if (!productId) {
            return new Response(
              JSON.stringify({ error: 'Product ID required' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const { error } = await supabase
            .from('products')
            .update({ is_active: false })
            .eq('id', productId);

          if (error) throw error;

          return new Response(
            JSON.stringify({ message: 'Product deactivated' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        default:
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }
    }

    if (resource === 'stats' || url.pathname.includes('stats')) {
      const { data: orderStats } = await supabase
        .from('orders')
        .select('order_status, total_amount');

      const { data: productStats } = await supabase
        .from('products')
        .select('stock_quantity, is_active');

      const stats = {
        totalOrders: orderStats?.length || 0,
        pendingOrders: orderStats?.filter(o => o.order_status === 'placed').length || 0,
        completedOrders: orderStats?.filter(o => o.order_status === 'delivered').length || 0,
        totalRevenue: orderStats?.reduce((sum, o) => sum + parseFloat(o.total_amount), 0) || 0,
        activeProducts: productStats?.filter(p => p.is_active).length || 0,
        totalProducts: productStats?.length || 0,
        lowStockProducts: productStats?.filter(p => p.is_active && p.stock_quantity < 10).length || 0,
      };

      return new Response(
        JSON.stringify(stats),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Resource not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});