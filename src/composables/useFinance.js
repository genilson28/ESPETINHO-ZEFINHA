// composables/useFinance.js
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'

/**
 * 🏦 Composable para gerenciar operações financeiras
 * Gerencia transações, fechamento de caixa e relatórios
 */
export function useFinance() {
  // ========================================
  // ESTADOS
  // ========================================
  
  const transacoes = ref([])
  const resumoDiario = ref(null)
  const pagamentosHoje = ref([])
  const ultimoFechamento = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // ========================================
  // COMPUTED PROPERTIES
  // ========================================

  /**
   * Totais do dia atual
   */
  const totaisHoje = computed(() => {
    if (!resumoDiario.value) {
      return {
        entradas: 0,
        saidas: 0,
        saldo: 0,
        qtdEntradas: 0,
        qtdSaidas: 0
      }
    }

    return {
      entradas: parseFloat(resumoDiario.value.total_entradas || 0),
      saidas: parseFloat(resumoDiario.value.total_saidas || 0),
      saldo: parseFloat(resumoDiario.value.saldo_dia || 0),
      qtdEntradas: parseInt(resumoDiario.value.qtd_entradas || 0),
      qtdSaidas: parseInt(resumoDiario.value.qtd_saidas || 0)
    }
  })

  /**
   * Verifica se o caixa já foi fechado hoje
   */
  const caixaFechadoHoje = computed(() => {
    if (!ultimoFechamento.value) return false
    
    const dataFechamento = new Date(ultimoFechamento.value.data_fechamento)
    const hoje = new Date()
    
    return dataFechamento.toDateString() === hoje.toDateString()
  })

  /**
   * Formas de pagamento formatadas
   */
  const pagamentosFormatados = computed(() => {
    return pagamentosHoje.value.map(p => ({
      id: p.payment_method,
      name: getNomeFormaPagamento(p.payment_method),
      quantidade: parseInt(p.quantidade || 0),
      total: parseFloat(p.total || 0)
    }))
  })

  // ========================================
  // FUNÇÕES AUXILIARES
  // ========================================

  /**
   * Retorna nome amigável da forma de pagamento
   */
  function getNomeFormaPagamento(metodo) {
    const nomes = {
      'dinheiro': 'Dinheiro',
      'pix': 'PIX',
      'credito': 'Cartão de Crédito',
      'debito': 'Cartão de Débito',
      'transferencia': 'Transferência'
    }
    return nomes[metodo] || metodo
  }

  /**
   * Formata data para exibição
   */
  function formatarData(data) {
    const d = new Date(data)
    const hoje = new Date()
    
    if (d.toDateString() === hoje.toDateString()) {
      return `Hoje às ${d.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`
    }
    
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Formata valor monetário
   */
  function formatarValor(valor) {
    return parseFloat(valor || 0).toFixed(2).replace('.', ',')
  }

  // ========================================
  // BUSCAR DADOS
  // ========================================

  /**
   * Busca resumo financeiro de hoje
   */
  async function buscarResumoDiario() {
    try {
      loading.value = true
      error.value = null

      const { data, error: err } = await supabase
        .from('vw_resumo_financeiro_diario')
        .select('*')
        .eq('data', new Date().toISOString().split('T')[0])
        .single()

      if (err && err.code !== 'PGRST116') throw err
      
      resumoDiario.value = data || {
        data: new Date().toISOString().split('T')[0],
        total_entradas: 0,
        total_saidas: 0,
        saldo_dia: 0,
        qtd_entradas: 0,
        qtd_saidas: 0
      }

    } catch (err) {
      console.error('Erro ao buscar resumo diário:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  /**
   * Busca formas de pagamento de hoje
   */
  async function buscarPagamentosHoje() {
    try {
      loading.value = true
      error.value = null

      const { data, error: err } = await supabase
        .from('vw_pagamentos_hoje')
        .select('*')

      if (err) throw err
      
      pagamentosHoje.value = data || []

    } catch (err) {
      console.error('Erro ao buscar pagamentos:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  /**
   * Busca últimas transações
   */
  async function buscarTransacoes(limite = 20) {
    try {
      loading.value = true
      error.value = null

      const { data, error: err } = await supabase
        .from('pwa_transacoes_financeiras')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limite)

      if (err) throw err
      
      transacoes.value = data || []

    } catch (err) {
      console.error('Erro ao buscar transações:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  /**
   * Busca transações de hoje
   */
  async function buscarTransacoesHoje() {
    try {
      loading.value = true
      error.value = null

      const hoje = new Date().toISOString().split('T')[0]

      const { data, error: err } = await supabase
        .from('pwa_transacoes_financeiras')
        .select('*')
        .gte('created_at', `${hoje}T00:00:00`)
        .lte('created_at', `${hoje}T23:59:59`)
        .order('created_at', { ascending: false })

      if (err) throw err
      
      transacoes.value = data || []

    } catch (err) {
      console.error('Erro ao buscar transações de hoje:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  /**
   * Busca último fechamento de caixa
   */
  async function buscarUltimoFechamento() {
    try {
      loading.value = true
      error.value = null

      const { data, error: err } = await supabase
        .from('pwa_fechamentos_caixa')
        .select('*')
        .order('fechado_em', { ascending: false })
        .limit(1)
        .single()

      if (err && err.code !== 'PGRST116') throw err
      
      ultimoFechamento.value = data

    } catch (err) {
      console.error('Erro ao buscar último fechamento:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // ========================================
  // ADICIONAR TRANSAÇÕES
  // ========================================

  /**
   * Adiciona nova transação de entrada (receita)
   */
  async function adicionarEntrada(dados) {
    try {
      loading.value = true
      error.value = null

      const { data: userData } = await supabase.auth.getUser()

      const transacao = {
        titulo: dados.titulo,
        descricao: dados.descricao || null,
        valor: parseFloat(dados.valor),
        tipo: 'entrada',
        categoria: dados.categoria,
        payment_method: dados.payment_method,
        created_by: userData?.user?.id || null
      }

      const { data, error: err } = await supabase
        .from('pwa_transacoes_financeiras')
        .insert(transacao)
        .select()
        .single()

      if (err) throw err

      // Atualizar dados locais
      await Promise.all([
        buscarResumoDiario(),
        buscarPagamentosHoje(),
        buscarTransacoesHoje()
      ])

      return { success: true, data }

    } catch (err) {
      console.error('Erro ao adicionar entrada:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Adiciona nova transação de saída (despesa)
   */
  async function adicionarSaida(dados) {
    try {
      loading.value = true
      error.value = null

      const { data: userData } = await supabase.auth.getUser()

      const transacao = {
        titulo: dados.titulo,
        descricao: dados.descricao || null,
        valor: parseFloat(dados.valor),
        tipo: 'saida',
        categoria: dados.categoria,
        payment_method: dados.payment_method,
        created_by: userData?.user?.id || null
      }

      const { data, error: err } = await supabase
        .from('pwa_transacoes_financeiras')
        .insert(transacao)
        .select()
        .single()

      if (err) throw err

      // Atualizar dados locais
      await Promise.all([
        buscarResumoDiario(),
        buscarTransacoesHoje()
      ])

      return { success: true, data }

    } catch (err) {
      console.error('Erro ao adicionar saída:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // ========================================
  // FECHAMENTO DE CAIXA
  // ========================================

  /**
   * Realiza fechamento de caixa
   */
  async function fecharCaixa(observacoes = null) {
    try {
      loading.value = true
      error.value = null

      // Verificar se já foi fechado hoje
      if (caixaFechadoHoje.value) {
        throw new Error('Caixa já foi fechado hoje!')
      }

      const { data: userData } = await supabase.auth.getUser()
      const hoje = new Date().toISOString().split('T')[0]

      // Chamar função do banco para fechar caixa
      const { data, error: err } = await supabase
        .rpc('fechar_caixa', {
          p_data: hoje,
          p_observacoes: observacoes,
          p_usuario_id: userData?.user?.id || null
        })

      if (err) throw err

      // Atualizar dados
      await buscarUltimoFechamento()

      return { success: true, data }

    } catch (err) {
      console.error('Erro ao fechar caixa:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Busca histórico de fechamentos
   */
  async function buscarHistoricoFechamentos(limite = 10) {
    try {
      loading.value = true
      error.value = null

      const { data, error: err } = await supabase
        .from('pwa_fechamentos_caixa')
        .select('*')
        .order('data_fechamento', { ascending: false })
        .limit(limite)

      if (err) throw err
      
      return { success: true, data: data || [] }

    } catch (err) {
      console.error('Erro ao buscar histórico de fechamentos:', err)
      error.value = err.message
      return { success: false, error: err.message, data: [] }
    } finally {
      loading.value = false
    }
  }

  // ========================================
  // EXPORTAR RELATÓRIO
  // ========================================

  /**
   * Exporta relatório financeiro em JSON
   */
  async function exportarRelatorio() {
    try {
      const hoje = new Date().toISOString().split('T')[0]

      const relatorio = {
        data: hoje,
        gerado_em: new Date().toISOString(),
        resumo: totaisHoje.value,
        formas_pagamento: pagamentosFormatados.value,
        transacoes: transacoes.value,
        caixa_fechado: caixaFechadoHoje.value,
        ultimo_fechamento: ultimoFechamento.value
      }

      const dataStr = JSON.stringify(relatorio, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      const link = document.createElement('a')
      link.href = URL.createObjectURL(dataBlob)
      link.download = `relatorio-financeiro-${hoje}.json`
      link.click()

      return { success: true }

    } catch (err) {
      console.error('Erro ao exportar relatório:', err)
      error.value = err.message
      return { success: false, error: err.message }
    }
  }

  // ========================================
  // INICIALIZAÇÃO
  // ========================================

  /**
   * Carrega todos os dados necessários
   */
  async function inicializar() {
    await Promise.all([
      buscarResumoDiario(),
      buscarPagamentosHoje(),
      buscarTransacoesHoje(),
      buscarUltimoFechamento()
    ])
  }

  // ========================================
  // RETURN
  // ========================================

  return {
    // Estados
    transacoes,
    resumoDiario,
    pagamentosHoje,
    ultimoFechamento,
    loading,
    error,
    
    // Computed
    totaisHoje,
    caixaFechadoHoje,
    pagamentosFormatados,
    
    // Funções de busca
    buscarResumoDiario,
    buscarPagamentosHoje,
    buscarTransacoes,
    buscarTransacoesHoje,
    buscarUltimoFechamento,
    buscarHistoricoFechamentos,
    
    // Funções de adicionar
    adicionarEntrada,
    adicionarSaida,
    
    // Fechamento
    fecharCaixa,
    
    // Utilidades
    formatarData,
    formatarValor,
    getNomeFormaPagamento,
    exportarRelatorio,
    inicializar
  }
}
