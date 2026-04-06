import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(null, { status: 405 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return new Response(null, { status: 400 })
  }

  if (!body.instanceId || !body.version) {
    return new Response(null, { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { error } = await supabase.from('telemetry_heartbeats').insert({
    instance_id: String(body.instanceId),
    version: String(body.version),
    configured_count: Number(body.configuredCount) || 0,
    uptime_seconds: Number(body.uptimeSeconds) || 0,
    node_version: body.nodeVersion ? String(body.nodeVersion) : null,
    platform: body.platform ? String(body.platform) : null,
  })

  if (error) {
    return new Response(null, { status: 500 })
  }

  return new Response(null, { status: 204 })
})
