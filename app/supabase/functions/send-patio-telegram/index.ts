import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Atendimento = {
  patio_execucao_id: number
  patio_veiculo_id: number | null
  placa_snapshot: string | null
  cliente_nome_snapshot: string | null
  nome_motorista: string | null
  quilometragem: number | null
  box_id: number | null
  funcionario_id: number | null
  raw_data: Record<string, unknown> | null
}

type Item = {
  area: string | null
  servico_nome: string | null
  quantidade: number | null
  funcionario_id: number | null
  status: string | null
}

type Funcionario = {
  patio_funcionario_id: number
  nome: string | null
}

async function sendTelegram(token: string, chatId: string, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Telegram ${response.status}: ${detail}`)
  }
}

function serviceLines(items: Item[], funcionariosById: Map<number, string>, includeMechanic = false) {
  if (items.length === 0) return 'Nenhum servico executado.'
  return items.map((item) => {
    const nome = item.servico_nome || item.area || 'Servico'
    const qtd = item.quantidade ?? 1
    const funcionario = item.funcionario_id ? funcionariosById.get(item.funcionario_id) : undefined
    return `- ${nome} (Qtd: ${qtd})${includeMechanic ? ` - *Mecanico:* ${funcionario || 'N/A'}` : ''}`
  }).join('\n')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { patioExecucaoId, finalizadoPor, observacaoFinal } = await req.json().catch(() => ({}))
    if (!patioExecucaoId) {
      return Response.json({ ok: false, error: 'patioExecucaoId obrigatorio.' }, { status: 400, headers: corsHeaders })
    }

    const token = Deno.env.get('TELEGRAM_TOKEN')
    const chatOperacional = Deno.env.get('TELEGRAM_CHAT_ID')
    const chatFaturamento = Deno.env.get('TELEGRAM_FATURAMENTO_CHAT_ID')
    if (!token || (!chatOperacional && !chatFaturamento)) {
      return Response.json({ ok: true, skipped: true, reason: 'Telegram nao configurado.' }, { headers: corsHeaders })
    }

    const url = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !serviceKey) {
      return Response.json({ ok: false, error: 'Supabase service role nao configurado.' }, { status: 500, headers: corsHeaders })
    }

    const supabase = createClient(url, serviceKey)
    const { data: atendimento, error: atendimentoError } = await supabase
      .from('patio_atendimentos')
      .select('patio_execucao_id,patio_veiculo_id,placa_snapshot,cliente_nome_snapshot,nome_motorista,quilometragem,box_id,funcionario_id,raw_data')
      .eq('patio_execucao_id', patioExecucaoId)
      .maybeSingle()

    if (atendimentoError) throw atendimentoError
    if (!atendimento) {
      return Response.json({ ok: false, error: 'Atendimento nao encontrado.' }, { status: 404, headers: corsHeaders })
    }

    const { data: items, error: itemsError } = await supabase
      .from('patio_atendimento_itens')
      .select('area,servico_nome,quantidade,funcionario_id,status')
      .eq('patio_execucao_id', patioExecucaoId)
      .eq('status', 'finalizado')
      .order('area', { ascending: true })
      .order('servico_nome', { ascending: true })

    if (itemsError) throw itemsError

    const funcionarioIds = Array.from(new Set((items ?? []).map((item: Item) => item.funcionario_id).filter(Boolean) as number[]))
    if ((atendimento as Atendimento).funcionario_id) funcionarioIds.push((atendimento as Atendimento).funcionario_id!)

    const funcionariosById = new Map<number, string>()
    if (funcionarioIds.length > 0) {
      const { data: funcionarios } = await supabase
        .from('patio_funcionarios_snapshot')
        .select('patio_funcionario_id,nome')
        .in('patio_funcionario_id', funcionarioIds)
      ;(funcionarios ?? []).forEach((funcionario: Funcionario) => {
        funcionariosById.set(funcionario.patio_funcionario_id, funcionario.nome || 'N/A')
      })
    }

    const current = atendimento as Atendimento
    const rows = (items ?? []) as Item[]
    const finalizador = finalizadoPor || 'Sistema'
    const obs = String(observacaoFinal ?? current.raw_data?.observacao_final ?? '').trim()

    const mecanico = current.funcionario_id ? funcionariosById.get(current.funcionario_id) : undefined
    let mensagemOp = [
      '*Etapa concluida!*',
      '',
      `*Servicos realizados no Box ${current.box_id ?? 'N/A'}:*`,
      serviceLines(rows, funcionariosById),
      '',
      `*Veiculo:* \`${current.placa_snapshot ?? 'N/A'}\``,
      `*Mecanico:* ${mecanico || 'N/A'}`,
      `*Finalizado por:* ${finalizador}`,
    ].join('\n')
    if (obs) mensagemOp += `\n\n*Observacao:* _${obs}_`

    const { count: pendentesRestantes, error: pendentesError } = await supabase
      .from('patio_atendimento_itens')
      .select('id', { count: 'exact', head: true })
      .eq('patio_execucao_id', patioExecucaoId)
      .eq('status', 'pendente')
    if (pendentesError) throw pendentesError

    const sent: string[] = []
    if (Number(pendentesRestantes ?? 0) === 0) {
      mensagemOp += '\n\n*TODOS OS SERVICOS CONCLUIDOS. Encaminhar para faturamento.*'
      if (chatFaturamento) {
        const mensagemFat = [
          '*VEICULO LIBERADO PARA FATURAMENTO!*',
          '',
          `*Placa:* \`${current.placa_snapshot ?? 'N/A'}\``,
          `*Empresa:* ${current.cliente_nome_snapshot ?? 'N/A'}`,
          `*Motorista:* ${current.nome_motorista || 'N/A'}`,
          `*KM:* ${current.quilometragem ?? 'N/A'}`,
          `*Finalizado por:* ${finalizador}`,
          '',
          '*Resumo de todos os servicos:*',
          serviceLines(rows, funcionariosById, true),
          '',
          '*ACAO:* Alterar venda e deixar pronto para assinar ou pagar!',
        ].join('\n')
        await sendTelegram(token, chatFaturamento, mensagemFat)
        sent.push('faturamento')
      }
    }

    if (chatOperacional) {
      await sendTelegram(token, chatOperacional, mensagemOp)
      sent.push('operacional')
    }

    return Response.json({ ok: true, sent }, { headers: corsHeaders })
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Nao foi possivel enviar notificacao.' },
      { status: 500, headers: corsHeaders },
    )
  }
})
