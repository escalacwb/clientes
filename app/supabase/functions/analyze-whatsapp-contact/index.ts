type ContactAnalysis = {
  reason: string
  result: string
  temperature: string
  summary: string
  nextAction: string
  nextActionDays: number
  negotiationStatus: string
  detectedProducts: string[]
  detectedVehicles: string[]
  objections: string[]
  paymentTerms: string[]
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
    const conversation = String(body.conversation ?? '').trim()
    const clienteNome = String(body.clienteNome ?? 'Cliente').trim()

    if (!conversation || conversation.length < 20) {
      return json({ error: 'Cole uma conversa maior para analisar.' }, 400)
    }
    if (conversation.length > 18000) {
      return json({ error: 'Conversa muito longa. Envie apenas o trecho mais recente do atendimento.' }, 400)
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) return json({ error: 'OPENAI_API_KEY nao configurada na Edge Function.' }, 500)

    const model = Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini'
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
              'Voce analisa conversas de WhatsApp de um CRM B2B de pneus, pecas e servicos automotivos pesados.',
              'Responda somente JSON valido.',
              'Classifique a negociacao com foco comercial pratico para vendedor.',
              'Nao invente fatos: se nao houver informacao, use arrays vazios e campos conservadores.',
            ].join('\n'),
          },
          {
            role: 'user',
            content: [
              `Cliente: ${clienteNome}`,
              'Analise a conversa abaixo e devolva exatamente este formato JSON:',
              JSON.stringify({
                reason: 'prospeccao | reativacao | orcamento | follow-up | pos-venda | cobranca | cadastro',
                result: 'respondeu | pediu orcamento | nao respondeu | comprar depois | sem interesse | numero invalido | dados atualizados | reclamacao | fechou pedido',
                temperature: 'quente | morno | frio | bloqueado',
                summary: 'Resumo objetivo em portugues, pronto para salvar no historico do CRM.',
                nextAction: 'Proxima acao pratica para o vendedor.',
                nextActionDays: 1,
                negotiationStatus: 'Status curto da negociacao.',
                detectedProducts: ['produtos, medidas ou servicos citados'],
                detectedVehicles: ['placas, veiculos ou KM citados'],
                objections: ['objecoes ou travas citadas'],
                paymentTerms: ['condicoes de pagamento citadas'],
                confidence: 0.85,
              }),
              'Conversa:',
              conversation,
            ].join('\n\n'),
          },
        ],
      }),
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      return json({ error: payload?.error?.message ?? 'Falha ao chamar API da OpenAI.' }, response.status)
    }

    const content = payload?.choices?.[0]?.message?.content
    if (!content) return json({ error: 'A IA nao retornou conteudo analisavel.' }, 502)

    const parsed = JSON.parse(content) as Partial<ContactAnalysis>
    const analysis = normalizeAnalysis(parsed, clienteNome)
    return json({ ok: true, analysis, model })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Erro inesperado ao analisar conversa.' }, 500)
  }
})

function normalizeAnalysis(input: Partial<ContactAnalysis>, clienteNome: string): ContactAnalysis {
  return {
    reason: oneOf(input.reason, ['prospeccao', 'reativacao', 'orcamento', 'follow-up', 'pos-venda', 'cobranca', 'cadastro'], 'prospeccao'),
    result: oneOf(input.result, ['respondeu', 'pediu orcamento', 'nao respondeu', 'comprar depois', 'sem interesse', 'numero invalido', 'dados atualizados', 'reclamacao', 'fechou pedido'], 'respondeu'),
    temperature: oneOf(input.temperature, ['quente', 'morno', 'frio', 'bloqueado'], 'morno'),
    summary: String(input.summary || `Conversa WhatsApp com ${clienteNome}.`).slice(0, 2500),
    nextAction: String(input.nextAction || 'Continuar atendimento.').slice(0, 500),
    nextActionDays: clampInteger(input.nextActionDays, 1, 60, 2),
    negotiationStatus: String(input.negotiationStatus || 'Em atendimento').slice(0, 160),
    detectedProducts: stringArray(input.detectedProducts).slice(0, 12),
    detectedVehicles: stringArray(input.detectedVehicles).slice(0, 12),
    objections: stringArray(input.objections).slice(0, 8),
    paymentTerms: stringArray(input.paymentTerms).slice(0, 8),
    confidence: Math.max(0, Math.min(1, Number(input.confidence ?? 0.6))),
  }
}

function oneOf(value: unknown, allowed: string[], fallback: string) {
  const normalized = String(value ?? '').trim().toLowerCase()
  return allowed.includes(normalized) ? normalized : fallback
}

function clampInteger(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Math.round(Number(value))
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(min, Math.min(max, parsed))
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
