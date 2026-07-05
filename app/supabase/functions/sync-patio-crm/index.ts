const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sync-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve((request) => {
  if (request.method === 'OPTIONS') return json({ ok: true })

  return json({
    ok: false,
    error: 'sync_patio_crm_disabled',
    message: 'Sincronizacao Patio -> CRM desativada. O Supabase do CRM e a base definitiva do patio.',
  }, 410)
})

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}
