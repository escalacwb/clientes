const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function cleanPlate(value: unknown) {
  return String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))
    const placa = cleanPlate(body.placa)
    if (!placa || placa.length < 6) {
      return Response.json({ ok: false, error: 'Informe uma placa valida.' }, { status: 400, headers: corsHeaders })
    }

    const token = Deno.env.get('PLACA_API_TOKEN')
    if (!token) {
      return Response.json({ ok: false, error: 'PLACA_API_TOKEN nao configurado.' }, { status: 500, headers: corsHeaders })
    }

    const response = await fetch(`https://wdapi2.com.br/consulta/${placa}/${token}`, {
      signal: AbortSignal.timeout(15000),
    })
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return Response.json(
        { ok: false, error: data?.message ?? `Erro na API de placas (${response.status}).` },
        { status: response.status, headers: corsHeaders },
      )
    }

    let modelo = data?.marcaModelo ?? data?.MODELO ?? data?.modelo ?? 'Nao encontrado'
    const fipeRows = Array.isArray(data?.fipe?.dados) ? data.fipe.dados : []
    if (fipeRows.length > 0) {
      const [best] = [...fipeRows].sort((a, b) => Number(b?.score ?? 0) - Number(a?.score ?? 0))
      modelo = best?.texto_modelo ?? modelo
    }

    return Response.json(
      {
        ok: true,
        vehicle: {
          placa,
          modelo,
          anoModelo: data?.anoModelo ?? data?.ano_modelo ?? null,
        },
        raw: data,
      },
      { headers: corsHeaders },
    )
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Nao foi possivel consultar a placa.' },
      { status: 500, headers: corsHeaders },
    )
  }
})
