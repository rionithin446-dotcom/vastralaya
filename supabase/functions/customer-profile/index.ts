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
    const resource = url.pathname.split('/').filter(Boolean).pop();

    if (resource === 'addresses' || url.pathname.includes('addresses')) {
      const pathParts = url.pathname.split('/').filter(Boolean);
      const addressId = pathParts[pathParts.length - 1] !== 'addresses' ? pathParts[pathParts.length - 1] : null;

      switch (req.method) {
        case 'GET': {
          if (addressId) {
            const { data, error } = await supabase
              .from('customer_addresses')
              .select('*')
              .eq('id', addressId)
              .eq('customer_id', user.id)
              .maybeSingle();

            if (error) throw error;
            if (!data) {
              return new Response(
                JSON.stringify({ error: 'Address not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }

            return new Response(
              JSON.stringify(data),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const { data, error } = await supabase
            .from('customer_addresses')
            .select('*')
            .eq('customer_id', user.id)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false });

          if (error) throw error;

          return new Response(
            JSON.stringify(data || []),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        case 'POST': {
          const address = await req.json();

          if (address.is_default) {
            await supabase
              .from('customer_addresses')
              .update({ is_default: false })
              .eq('customer_id', user.id);
          }

          const { data, error } = await supabase
            .from('customer_addresses')
            .insert({ ...address, customer_id: user.id })
            .select()
            .single();

          if (error) throw error;

          return new Response(
            JSON.stringify(data),
            { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        case 'PUT': {
          if (!addressId) {
            return new Response(
              JSON.stringify({ error: 'Address ID required' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const updates = await req.json();

          if (updates.is_default) {
            await supabase
              .from('customer_addresses')
              .update({ is_default: false })
              .eq('customer_id', user.id);
          }

          const { data, error } = await supabase
            .from('customer_addresses')
            .update(updates)
            .eq('id', addressId)
            .eq('customer_id', user.id)
            .select()
            .single();

          if (error) throw error;

          return new Response(
            JSON.stringify(data),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        case 'DELETE': {
          if (!addressId) {
            return new Response(
              JSON.stringify({ error: 'Address ID required' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const { error } = await supabase
            .from('customer_addresses')
            .delete()
            .eq('id', addressId)
            .eq('customer_id', user.id);

          if (error) throw error;

          return new Response(
            JSON.stringify({ message: 'Address deleted' }),
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

    switch (req.method) {
      case 'GET': {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'POST': {
        const profile = await req.json();

        const { data: existingProfile } = await supabase
          .from('customers')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (existingProfile) {
          return new Response(
            JSON.stringify({ error: 'Profile already exists' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabase
          .from('customers')
          .insert({ ...profile, id: user.id })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify(data),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'PUT': {
        const updates = await req.json();

        const { data, error } = await supabase
          .from('customers')
          .update(updates)
          .eq('id', user.id)
          .select()
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
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});