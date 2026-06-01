type TireImage = {
  name?: string
  mimeType?: string
  dataUrl?: string
}

type TireInspection = {
  summary: string
  severity: 'baixa' | 'media' | 'alta' | 'critica'
  immediateRisk: string
  likelyCauses: string[]
  recommendedActions: string[]
  commercialOpportunity: string
  whatsappMessage: string
  confidence: number
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return json({ ok: true })
  if (request.method !== 'POST') return json({ error: 'Metodo nao permitido.' }, 405)

  try {
    const body = await request.json().catch(() => ({}))
    const placa = String(body.placa ?? '').trim().toUpperCase()
    const clienteNome = String(body.clienteNome ?? '').trim()
    const observacao = String(body.observacao ?? '').trim().slice(0, 1200)
    const images = sanitizeImages(body.images)

    if (!placa && !clienteNome) return json({ error: 'Informe placa ou cliente para contextualizar a analise.' }, 400)
    if (images.length === 0) return json({ error: 'Envie ao menos uma foto do pneu.' }, 400)

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) return json({ error: 'OPENAI_API_KEY nao configurada na Edge Function.' }, 500)

    const model = Deno.env.get('OPENAI_VISION_MODEL') || Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini'
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: [
              'Voce e um consultor tecnico/comercial de pneus de carga, caminhonetes e servicos de patio.',
              'Analise as fotos com cautela. Nao invente medidas, marcas ou danos invisiveis.',
              'Responda somente JSON valido no formato solicitado.',
              'O objetivo e ajudar a loja a orientar o cliente e identificar oportunidade comercial pratica.',
            ].join('\n'),
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: [
                  `Placa: ${placa || 'nao informada'}`,
                  `Cliente: ${clienteNome || 'nao informado'}`,
                  `Observacao do atendente: ${observacao || 'sem observacao'}`,
                  'Analise as fotos e devolva exatamente este JSON:',
                  JSON.stringify({
                    summary: 'Resumo tecnico objetivo em portugues.',
                    severity: 'baixa | media | alta | critica',
                    immediateRisk: 'Risco imediato percebido ou "Sem risco imediato claro pela foto".',
                    likelyCauses: ['causas provaveis, sem inventar'],
                    recommendedActions: ['acoes praticas: alinhar, balancear, revisar suspensao, substituir, acompanhar etc.'],
                    commercialOpportunity: 'Como o vendedor deve transformar isso em atendimento/proposta.',
                    whatsappMessage: 'Mensagem curta, profissional e pronta para WhatsApp ao cliente.',
                    confidence: 0.7,
                  }),
                ].join('\n\n'),
              },
              ...images.map((image) => ({
                type: 'image_url',
                image_url: {
                  url: image.dataUrl,
                  detail: 'low',
                },
              })),
            ],
          },
        ],
      }),
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) return json({ error: payload?.error?.message ?? 'Falha ao chamar API da OpenAI.' }, response.status)

    const content = payload?.choices?.[0]?.message?.content
    if (!content) return json({ error: 'A IA nao retornou conteudo analisavel.' }, 502)

    const parsed = JSON.parse(content) as Partial<TireInspection>
    return json({ ok: true, analysis: normalizeInspection(parsed), model })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Erro inesperado ao analisar pneus.' }, 500)
  }
})

function sanitizeImages(value: unknown): TireImage[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => ({
      name: String(item?.name ?? '').slice(0, 120),
      mimeType: String(item?.mimeType ?? ''),
      dataUrl: String(item?.dataUrl ?? ''),
    }))
    .filter((item) => item.dataUrl.startsWith('data:image/'))
    .slice(0, 6)
}

function normalizeInspection(input: Partial<TireInspection>): TireInspection {
  return {
    summary: String(input.summary || 'Analise tecnica de pneu registrada.').slice(0, 1200),
    severity: oneOf(input.severity, ['baixa', 'media', 'alta', 'critica'], 'media') as TireInspection['severity'],
    immediateRisk: String(input.immediateRisk || 'Sem risco imediato claro pela foto.').slice(0, 600),
    likelyCauses: stringArray(input.likelyCauses).slice(0, 8),
    recommendedActions: stringArray(input.recommendedActions).slice(0, 10),
    commercialOpportunity: String(input.commercialOpportunity || 'Registrar contato e oferecer avaliacao tecnica presencial.').slice(0, 700),
    whatsappMessage: String(input.whatsappMessage || 'Posso te ajudar a avaliar esse pneu com mais detalhes e montar a melhor solucao.').slice(0, 900),
    confidence: Math.max(0, Math.min(1, Number(input.confidence ?? 0.6))),
  }
}

function oneOf(value: unknown, allowed: string[], fallback: string) {
  const normalized = String(value ?? '').trim().toLowerCase()
  return allowed.includes(normalized) ? normalized : fallback
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item).trim()).filter(Boolean)
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}
