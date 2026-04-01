import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generatePassword(): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const digits = '0123456789'
  const special = '!@#$%&*'
  const all = upper + lower + digits + special

  let pw = ''
  pw += upper[Math.floor(Math.random() * upper.length)]
  pw += lower[Math.floor(Math.random() * lower.length)]
  pw += digits[Math.floor(Math.random() * digits.length)]
  pw += special[Math.floor(Math.random() * special.length)]

  for (let i = 4; i < 12; i++) {
    pw += all[Math.floor(Math.random() * all.length)]
  }

  return pw.split('').sort(() => Math.random() - 0.5).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing authorization' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verify caller is admin
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller } } = await anonClient.auth.getUser()
    if (!caller) return json({ error: 'Unauthorized' }, 401)

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'admin')
      .maybeSingle()
    if (!roleData) return json({ error: 'Forbidden: admin only' }, 403)

    const body = await req.json()
    const { action } = body

    if (action === 'create_org') {
      const { email, orgName } = body
      if (!email || !orgName) return json({ error: 'Email and orgName are required' }, 400)

      const password = generatePassword()

      const { data: newUser, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: 'organization',
          organization_name: orgName,
          password_changed: false,
        },
      })

      if (error) return json({ error: error.message }, 400)

      return json({ user: newUser.user, password })
    }

    if (action === 'delete_org') {
      const { userId, orgId } = body
      if (!userId || !orgId) return json({ error: 'userId and orgId required' }, 400)

      // Delete related data (service role bypasses RLS)
      await adminClient.from('report_attachments').delete().in(
        'report_id',
        (await adminClient.from('monthly_reports').select('id').eq('organization_id', orgId)).data?.map((r: any) => r.id) || []
      )
      await adminClient.from('monthly_reports').delete().eq('organization_id', orgId)
      await adminClient.from('notifications').delete().eq('user_id', userId)
      await adminClient.from('organizations').delete().eq('id', orgId)
      await adminClient.from('user_roles').delete().eq('user_id', userId)
      await adminClient.from('profiles').delete().eq('user_id', userId)

      const { error } = await adminClient.auth.admin.deleteUser(userId)
      if (error) return json({ error: error.message }, 400)

      return json({ success: true })
    }

    return json({ error: 'Invalid action' }, 400)
  } catch (e) {
    return json({ error: e.message }, 500)
  }
})
