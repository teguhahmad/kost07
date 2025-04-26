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
      throw new Error('Only active superadmin users can create backoffice users');
    }

    const { email, password, name, role, status } = await req.json();

    // Create auth user
    const { data: authData, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError || !authData.user) {
      throw new Error(createError?.message || 'Failed to create user');
    }

    // Create backoffice user
    const { error: userError } = await supabaseClient
      .from('backoffice_users')
      .insert([{
        id: authData.user.id,
        email,
        name,
        role,
        status
      }]);

    if (userError) {
      // Cleanup: delete auth user if backoffice user creation fails
      await supabaseClient.auth.admin.deleteUser(authData.user.id);
      throw new Error('Failed to create backoffice user');
    }

    return new Response(
      JSON.stringify({ message: 'User created successfully' }),
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