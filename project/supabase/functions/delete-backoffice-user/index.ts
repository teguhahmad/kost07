import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the requester is a superadmin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is superadmin
    const { data: adminUser, error: adminError } = await supabaseClient
      .from('backoffice_users')
      .select('role, status')
      .eq('id', user.id)
      .single();

    if (adminError || !adminUser || adminUser.role !== 'superadmin' || adminUser.status !== 'active') {
      throw new Error('Only active superadmin users can delete backoffice users');
    }

    const { id } = await req.json();

    // Check if target user exists and is not a superadmin
    const { data: targetUser, error: targetError } = await supabaseClient
      .from('backoffice_users')
      .select('role')
      .eq('id', id)
      .single();

    if (targetError || !targetUser) {
      throw new Error('User not found');
    }

    if (targetUser.role === 'superadmin') {
      throw new Error('Cannot delete superadmin users');
    }

    // Delete auth user
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(id);

    if (deleteError) {
      throw new Error('Failed to delete user');
    }

    return new Response(
      JSON.stringify({ message: 'User deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ message: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});