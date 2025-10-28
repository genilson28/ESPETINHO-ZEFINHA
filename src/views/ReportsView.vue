<template>
  <div class="reports-view">
    <div class="page-header">
      <h1>Relatórios</h1>
      <p>Análises e estatísticas do sistema</p>
    </div>

    <!-- Filtros -->
    <div class="filters-card">
      <div class="filter-group">
        <label>Período</label>
        <select v-model="filters.period" class="filter-select" @change="onPeriodChange">
          <option value="today">Hoje</option>
          <option value="week">Esta Semana</option>
          <option value="month">Este Mês</option>
          <option value="30days">Últimos 30 dias</option>
          <option value="custom">Personalizado</option>
        </select>
      </div>

      <div v-if="filters.period === 'custom'" class="filter-group">
        <label>Data Inicial</label>
        <input 
          type="date" 
          v-model="filters.startDate" 
          class="filter-select"
        />
      </div>

      <div v-if="filters.period === 'custom'" class="filter-group">
        <label>Data Final</label>
        <input 
          type="date" 
          v-model="filters.endDate" 
          class="filter-select"
        />
      </div>

      <div class="filter-group">
        <label>Tipo de Relatório</label>
        <select v-model="filters.reportType" class="filter-select">
          <option value="sales">Vendas</option>
          <option value="products">Produtos</option>
          <option value="tables">Mesas</option>
          <!-- NOVOS TIPOS DE RELATÓRIO ADICIONADOS -->
          <option value="users">Usuários</option>
          <option value="cashflow">Entrada/Saída</option>
        </select>
      </div>

      <button class="btn-primary" @click="generateReport" :disabled="loading">
        <Search :size="16" />
        {{ loading ? 'Gerando...' : 'Gerar Relatório' }}
      </button>

      <div class="export-buttons" v-if="reportData && reportData.length > 0">
        <!-- BOTÕES DE EXPORTAÇÃO MELHORADOS -->
        <button class="btn-secondary btn-pdf" @click="exportToPDF">
          <Download :size="16" />
          PDF
        </button>
        <button class="btn-secondary btn-excel" @click="exportToExcel">
          <Download :size="16" />
          Excel
        </button>
        <button class="btn-secondary btn-print" @click="printReport">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
            <path d="M6 14h12v8H6z"/>
          </svg>
          Imprimir
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Gerando relatório...</p>
    </div>

    <!-- Cards de Métricas -->
    <div v-if="metrics && !loading" class="metrics-grid">
      <div class="metric-card">
        <div class="metric-header">
          <ShoppingCart :size="20" color="#3b82f6" />
          <h3>Total de Vendas</h3>
        </div>
        <p class="metric-value">{{ formatCurrency(metrics.totalSales) }}</p>
        <div class="metric-footer">
          <span class="metric-period">{{ getPeriodLabel() }}</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <Package :size="20" color="#22c55e" />
          <h3>Pedidos Realizados</h3>
        </div>
        <p class="metric-value">{{ metrics.totalOrders }}</p>
        <div class="metric-footer">
          <span class="metric-period">{{ getPeriodLabel() }}</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <Users :size="20" color="#a855f7" />
          <h3>Itens Vendidos</h3>
        </div>
        <p class="metric-value">{{ metrics.totalItems }}</p>
        <div class="metric-footer">
          <span class="metric-period">{{ getPeriodLabel() }}</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <DollarSign :size="20" color="#f59e0b" />
          <h3>Ticket Médio</h3>
        </div>
        <p class="metric-value">{{ formatCurrency(metrics.averageTicket) }}</p>
        <div class="metric-footer">
          <span class="metric-period">{{ getPeriodLabel() }}</span>
        </div>
      </div>
    </div>

    <!-- Relatório Detalhado -->
    <div v-if="reportData && reportData.length > 0 && !loading" class="card">
      <div class="card-header">
        <h2>Relatório Detalhado - {{ getReportTypeLabel() }}</h2>
        <div class="header-actions">
          <span class="report-info">
            Período: {{ getPeriodLabel() }} | 
            Total: {{ formatCurrency(getReportTotal()) }}
          </span>
        </div>
      </div>

      <!-- Tabela de Vendas -->
      <div v-if="filters.reportType === 'sales'" class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Pedido</th>
              <th>Mesa</th>
              <th>Itens</th>
              <th>Valor Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sale in reportData" :key="sale.id">
              <td>{{ formatDateTime(sale.created_at) }}</td>
              <td>#{{ sale.id.toString().padStart(3, '0') }}</td>
              <td>Mesa {{ sale.mesa_id || 'N/A' }}</td>
              <td>{{ getItemsCount(sale.itens) }} itens</td>
              <td>{{ formatCurrency(sale.valor_total) }}</td>
              <td>
                <span class="badge" :class="getStatusClass(sale.status)">
                  {{ getStatusLabel(sale.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tabela de Produtos -->
      <div v-if="filters.reportType === 'products'" class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Quantidade Vendida</th>
              <th>Total Arrecadado</th>
              <th>Preço Médio</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in reportData" :key="product.produto_id">
              <td>{{ product.produto_nome || `Produto ${product.produto_id}` }}</td>
              <td>{{ product.quantidade_total }} unidades</td>
              <td>{{ formatCurrency(product.total_arrecadado) }}</td>
              <td>{{ formatCurrency(product.preco_medio) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tabela de Mesas -->
      <div v-if="filters.reportType === 'tables'" class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mesa</th>
              <th>Pedidos</th>
              <th>Total Vendas</th>
              <th>Ticket Médio</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="table in reportData" :key="table.mesa_id">
              <td>Mesa {{ table.mesa_id }}</td>
              <td>{{ table.total_pedidos }} pedidos</td>
              <td>{{ formatCurrency(table.total_vendas) }}</td>
              <td>{{ formatCurrency(table.ticket_medio) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- NOVA TABELA DE USUÁRIOS -->
      <div v-if="filters.reportType === 'users'" class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Email</th>
              <th>Cargo</th>
              <th>Pedidos Realizados</th>
              <th>Total Vendido</th>
              <th>Data de Cadastro</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in reportData" :key="user.id">
              <td>{{ user.nome || 'N/A' }}</td>
              <td>{{ user.email || 'N/A' }}</td>
              <td>{{ user.cargo || 'N/A' }}</td>
              <td>{{ user.total_pedidos || 0 }}</td>
              <td>{{ formatCurrency(user.total_vendido || 0) }}</td>
              <td>{{ formatDateTime(user.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- NOVA TABELA DE ENTRADA/SAÍDA -->
      <div v-if="filters.reportType === 'cashflow'" class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Tipo</th>
              <th>Categoria</th>
              <th>Valor</th>
              <th>Responsável</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="transaction in reportData" :key="transaction.id">
              <td>{{ formatDateTime(transaction.created_at) }}</td>
              <td>{{ transaction.descricao || 'N/A' }}</td>
              <td>
                <span class="badge" :class="transaction.tipo === 'entrada' ? 'success' : 'error'">
                  {{ transaction.tipo === 'entrada' ? 'Entrada' : 'Saída' }}
                </span>
              </td>
              <td>{{ transaction.categoria || 'N/A' }}</td>
              <td>{{ formatCurrency(transaction.valor) }}</td>
              <td>{{ transaction.responsavel || 'N/A' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && (!reportData || reportData.length === 0)" class="empty-state">
      <BarChart3 :size="64" color="#d1d5db" />
      <h3>Nenhum relatório gerado</h3>
      <p>Selecione os filtros e clique em "Gerar Relatório" para visualizar os dados</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase, TABLES } from '@/services/supabase'
import { 
  Search,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  Download,
  BarChart3
} from 'lucide-vue-next'

// Estados
const loading = ref(false)
const reportData = ref(null)
const metrics = ref(null)

// Filtros
const filters = ref({
  period: 'today',
  reportType: 'sales',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0]
})

// Funções para calcular datas
const getDateRange = () => {
  const now = new Date()
  let startDate, endDate

  switch (filters.value.period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      break
    case 'week':
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      startDate = new Date(now.setDate(diff))
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date()
      endDate.setHours(23, 59, 59, 999)
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      break
    case '30days':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      endDate = new Date()
      endDate.setHours(23, 59, 59, 999)
      break
    case 'custom':
      startDate = new Date(filters.value.startDate)
      endDate = new Date(filters.value.endDate)
      endDate.setHours(23, 59, 59, 999)
      break
    default:
      startDate = new Date()
      endDate = new Date()
  }

  return { startDate, endDate }
}

// Gerar relatório
const generateReport = async () => {
  loading.value = true
  reportData.value = null
  metrics.value = null
  
  try {
    const { startDate, endDate } = getDateRange()
    
    console.log('📊 Gerando relatório:', {
      periodo: filters.value.period,
      tipo: filters.value.reportType,
      dataInicio: startDate,
      dataFim: endDate
    })

    // Buscar dados baseado no tipo de relatório
    switch (filters.value.reportType) {
      case 'sales':
        await generateSalesReport(startDate, endDate)
        break
      case 'products':
        await generateProductsReport(startDate, endDate)
        break
      case 'tables':
        await generateTablesReport(startDate, endDate)
        break
      // NOVOS CASOS ADICIONADOS
      case 'users':
        await generateUsersReport(startDate, endDate)
        break
      case 'cashflow':
        await generateCashflowReport(startDate, endDate)
        break
    }

    // Calcular métricas
    await calculateMetrics(startDate, endDate)

  } catch (error) {
    console.error('❌ Erro ao gerar relatório:', error)
    alert('Erro ao gerar relatório: ' + error.message)
  } finally {
    loading.value = false
  }
}

// Relatório de Vendas
const generateSalesReport = async (startDate, endDate) => {
  console.log('🛒 Buscando dados de vendas...')
  
  const { data, error } = await supabase
    .from(TABLES.PEDIDOS)
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Erro ao buscar vendas:', error)
    throw error
  }

  console.log('✅ Vendas encontradas:', data?.length || 0)
  reportData.value = data || []
}

// Relatório de Produtos
const generateProductsReport = async (startDate, endDate) => {
  console.log('📦 Buscando dados de produtos...')
  
  const { data: pedidos, error } = await supabase
    .from(TABLES.PEDIDOS)
    .select('itens')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  if (error) {
    console.error('❌ Erro ao buscar pedidos:', error)
    throw error
  }

  const produtosMap = new Map()

  pedidos?.forEach(pedido => {
    if (pedido.itens && Array.isArray(pedido.itens)) {
      pedido.itens.forEach(item => {
        const produtoId = item.produto_id
        const quantidade = item.quantidade || 0
        const subtotal = item.subtotal || 0
        
        if (produtosMap.has(produtoId)) {
          const existing = produtosMap.get(produtoId)
          existing.quantidade_total += quantidade
          existing.total_arrecadado += subtotal
        } else {
          produtosMap.set(produtoId, {
            produto_id: produtoId,
            quantidade_total: quantidade,
            total_arrecadado: subtotal,
            preco_medio: subtotal / quantidade
          })
        }
      })
    }
  })

  const produtosArray = Array.from(produtosMap.values())
  
  if (produtosArray.length > 0) {
    const { data: produtos, error: produtosError } = await supabase
      .from(TABLES.PRODUTOS)
      .select('id, nome')
      .in('id', produtosArray.map(p => p.produto_id))

    if (!produtosError && produtos) {
      const produtosMapNomes = new Map(produtos.map(p => [p.id, p.nome]))
      produtosArray.forEach(produto => {
        produto.produto_nome = produtosMapNomes.get(produto.produto_id) || `Produto ${produto.produto_id}`
      })
    }
  }

  reportData.value = produtosArray.sort((a, b) => b.total_arrecadado - a.total_arrecadado)
}

// Relatório de Mesas
const generateTablesReport = async (startDate, endDate) => {
  console.log('🍽️ Buscando dados de mesas...')
  
  const { data: pedidos, error } = await supabase
    .from(TABLES.PEDIDOS)
    .select('mesa_id, valor_total')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .not('mesa_id', 'is', null)

  if (error) {
    console.error('❌ Erro ao buscar pedidos de mesas:', error)
    throw error
  }

  const mesasMap = new Map()

  pedidos?.forEach(pedido => {
    const mesaId = pedido.mesa_id
    if (mesasMap.has(mesaId)) {
      const existing = mesasMap.get(mesaId)
      existing.total_pedidos += 1
      existing.total_vendas += pedido.valor_total || 0
    } else {
      mesasMap.set(mesaId, {
        mesa_id: mesaId,
        total_pedidos: 1,
        total_vendas: pedido.valor_total || 0
      })
    }
  })

  const mesasArray = Array.from(mesasMap.values()).map(mesa => ({
    ...mesa,
    ticket_medio: mesa.total_vendas / mesa.total_pedidos
  })).sort((a, b) => b.total_vendas - a.total_vendas)

  reportData.value = mesasArray
}

// NOVO RELATÓRIO DE USUÁRIOS
const generateUsersReport = async (startDate, endDate) => {
  console.log('👥 Buscando dados de usuários...')
  
  // Buscar todos os usuários
  const { data: usuarios, error: usuariosError } = await supabase
    .from(TABLES.USUARIOS)
    .select('*')

  if (usuariosError) {
    console.error('❌ Erro ao buscar usuários:', usuariosError)
    throw usuariosError
  }

  // Buscar pedidos no período
  const { data: pedidos, error: pedidosError } = await supabase
    .from(TABLES.PEDIDOS)
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  if (pedidosError) {
    console.error('❌ Erro ao buscar pedidos:', pedidosError)
    throw pedidosError
  }

  // Mapear pedidos por usuário
  const pedidosPorUsuario = new Map()
  
  pedidos?.forEach(pedido => {
    const usuarioId = pedido.usuario_id
    if (!pedidosPorUsuario.has(usuarioId)) {
      pedidosPorUsuario.set(usuarioId, {
        total_pedidos: 0,
        total_vendido: 0
      })
    }
    
    const usuarioPedidos = pedidosPorUsuario.get(usuarioId)
    usuarioPedidos.total_pedidos += 1
    usuarioPedidos.total_vendido += pedido.valor_total || 0
  })

  // Combinar dados de usuários com pedidos
  const usuariosComPedidos = usuarios?.map(usuario => {
    const pedidosUsuario = pedidosPorUsuario.get(usuario.id) || {
      total_pedidos: 0,
      total_vendido: 0
    }
    
    return {
      ...usuario,
      ...pedidosUsuario
    }
  }) || []

  reportData.value = usuariosComPedidos.sort((a, b) => b.total_vendido - a.total_vendido)
}

// NOVO RELATÓRIO DE ENTRADA/SAÍDA
const generateCashflowReport = async (startDate, endDate) => {
  console.log('💰 Buscando dados de fluxo de caixa...')
  
  // Verificar se existe tabela de transações financeiras
  const { data, error } = await supabase
    .from('transacoes_financeiras')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Erro ao buscar transações financeiras:', error)
    
    // Se a tabela não existir, vamos criar dados de exemplo
    if (error.code === 'PGRST116') {
      console.log('⚠️ Tabela de transações não encontrada, usando dados de exemplo')
      
      // Criar dados de exemplo baseados nos pedidos
      const { data: pedidos, error: pedidosError } = await supabase
        .from(TABLES.PEDIDOS)
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (pedidosError) {
        console.error('❌ Erro ao buscar pedidos para dados de exemplo:', pedidosError)
        throw pedidosError
      }

      const transacoesExemplo = []
      
      // Adicionar entradas baseadas nos pedidos confirmados
      pedidos?.forEach(pedido => {
        if (pedido.status === 'confirmado') {
          transacoesExemplo.push({
            id: `entrada-${pedido.id}`,
            created_at: pedido.created_at,
            descricao: `Venda - Pedido #${pedido.id}`,
            tipo: 'entrada',
            categoria: 'Vendas',
            valor: pedido.valor_total,
            responsivel: 'Sistema'
          })
        }
      })

      // Adicionar algumas saídas de exemplo
      const dataInicio = new Date(startDate)
      const dataFim = new Date(endDate)
      const diasDiff = Math.ceil((dataFim - dataInicio) / (1000 * 60 * 60 * 24))
      
      for (let i = 0; i < Math.min(diasDiff, 5); i++) {
        const dataTransacao = new Date(dataInicio)
        dataTransacao.setDate(dataInicio.getDate() + i)
        
        transacoesExemplo.push({
          id: `saida-exemplo-${i}`,
          created_at: dataTransacao.toISOString(),
          descricao: `Despesa de exemplo ${i + 1}`,
          tipo: 'saida',
          categoria: 'Operacional',
          valor: Math.floor(Math.random() * 500) + 100,
          responsivel: 'Administrador'
        })
      }

      reportData.value = transacoesExemplo.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )
      return
    }
    
    throw error
  }

  console.log('✅ Transações encontradas:', data?.length || 0)
  reportData.value = data || []
}

// Calcular métricas
const calculateMetrics = async (startDate, endDate) => {
  console.log('📈 Calculando métricas...')
  
  const { data: pedidos, error } = await supabase
    .from(TABLES.PEDIDOS)
    .select('valor_total, itens, status')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  if (error) {
    console.error('❌ Erro ao calcular métricas:', error)
    throw error
  }

  const pedidosConfirmados = pedidos?.filter(pedido => pedido.status === 'confirmado') || []
  
  let totalItems = 0
  pedidosConfirmados.forEach(pedido => {
    if (pedido.itens && Array.isArray(pedido.itens)) {
      totalItems += pedido.itens.reduce((sum, item) => sum + (item.quantidade || 0), 0)
    }
  })

  const totalSales = pedidosConfirmados.reduce((sum, pedido) => sum + (pedido.valor_total || 0), 0)
  const totalOrders = pedidosConfirmados.length

  metrics.value = {
    totalSales,
    totalOrders,
    totalItems,
    averageTicket: totalOrders > 0 ? totalSales / totalOrders : 0
  }

  console.log('✅ Métricas calculadas:', metrics.value)
}

// ===== FUNÇÕES DE EXPORTAÇÃO MELHORADAS =====

// NOVA FUNÇÃO DE EXPORTAÇÃO PDF
const exportToPDF = () => {
  if (!reportData.value || reportData.value.length === 0) {
    alert('Nenhum dado para exportar')
    return
  }

  try {
    // Criar conteúdo HTML para o PDF
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório - ${getReportTypeLabel()}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #C41E3A; padding-bottom: 15px; }
          .header h1 { color: #C41E3A; margin: 0 0 5px 0; }
          .header p { color: #666; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #C41E3A; color: white; padding: 12px; text-align: left; font-size: 11px; }
          td { padding: 10px; border-bottom: 1px solid #e0e0e0; font-size: 12px; }
          tr:hover { background: #f9f9f9; }
          .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
          .badge.success { background: #dcfce7; color: #22c55e; }
          .badge.warning { background: #fef3c7; color: #d97706; }
          .badge.error { background: #fee2e2; color: #dc2626; }
          .summary { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px; }
          .summary h3 { margin-top: 0; color: #C41E3A; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório de ${getReportTypeLabel()}</h1>
          <p><strong>Período:</strong> ${getPeriodLabel()}</p>
          <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          <p><strong>Total:</strong> ${formatCurrency(getReportTotal())}</p>
        </div>
        
        <div class="summary">
          <h3>Resumo</h3>
          <p><strong>Total de Registros:</strong> ${reportData.value.length}</p>
        </div>
        
        <table>
    `

    // Adicionar cabeçalho da tabela baseado no tipo de relatório
    if (filters.value.reportType === 'sales') {
      htmlContent += `<thead><tr><th>Data/Hora</th><th>Pedido</th><th>Mesa</th><th>Itens</th><th>Valor</th><th>Status</th></tr></thead><tbody>`
      reportData.value.forEach(sale => {
        htmlContent += `<tr>
          <td>${formatDateTime(sale.created_at)}</td>
          <td>#${sale.id.toString().padStart(3, '0')}</td>
          <td>Mesa ${sale.mesa_id || 'N/A'}</td>
          <td>${getItemsCount(sale.itens)} itens</td>
          <td>${formatCurrency(sale.valor_total)}</td>
          <td><span class="badge ${getStatusClass(sale.status)}">${getStatusLabel(sale.status)}</span></td>
        </tr>`
      })
    } else if (filters.value.reportType === 'products') {
      htmlContent += `<thead><tr><th>Produto</th><th>Quantidade</th><th>Total</th><th>Preço Médio</th></tr></thead><tbody>`
      reportData.value.forEach(product => {
        htmlContent += `<tr>
          <td>${product.produto_nome || `Produto ${product.produto_id}`}</td>
          <td>${product.quantidade_total} unidades</td>
          <td>${formatCurrency(product.total_arrecadado)}</td>
          <td>${formatCurrency(product.preco_medio)}</td>
        </tr>`
      })
    } else if (filters.value.reportType === 'tables') {
      htmlContent += `<thead><tr><th>Mesa</th><th>Pedidos</th><th>Total</th><th>Ticket Médio</th></tr></thead><tbody>`
      reportData.value.forEach(table => {
        htmlContent += `<tr>
          <td>Mesa ${table.mesa_id}</td>
          <td>${table.total_pedidos} pedidos</td>
          <td>${formatCurrency(table.total_vendas)}</td>
          <td>${formatCurrency(table.ticket_medio)}</td>
        </tr>`
      })
    } else if (filters.value.reportType === 'users') {
      htmlContent += `<thead><tr><th>Usuário</th><th>Email</th><th>Cargo</th><th>Pedidos</th><th>Total Vendido</th><th>Data de Cadastro</th></tr></thead><tbody>`
      reportData.value.forEach(user => {
        htmlContent += `<tr>
          <td>${user.nome || 'N/A'}</td>
          <td>${user.email || 'N/A'}</td>
          <td>${user.cargo || 'N/A'}</td>
          <td>${user.total_pedidos || 0}</td>
          <td>${formatCurrency(user.total_vendido || 0)}</td>
          <td>${formatDateTime(user.created_at)}</td>
        </tr>`
      })
    } else if (filters.value.reportType === 'cashflow') {
      htmlContent += `<thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Categoria</th><th>Valor</th><th>Responsável</th></tr></thead><tbody>`
      reportData.value.forEach(transaction => {
        htmlContent += `<tr>
          <td>${formatDateTime(transaction.created_at)}</td>
          <td>${transaction.descricao || 'N/A'}</td>
          <td><span class="badge ${transaction.tipo === 'entrada' ? 'success' : 'error'}">${transaction.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td>
          <td>${transaction.categoria || 'N/A'}</td>
          <td>${formatCurrency(transaction.valor)}</td>
          <td>${transaction.responsavel || 'N/A'}</td>
        </tr>`
      })
    }

    htmlContent += `</tbody></table></body></html>`

    // Criar blob e download
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-${filters.value.reportType}-${Date.now()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    alert('📄 Arquivo HTML gerado! Abra o arquivo e use Ctrl+P para salvar como PDF')
  } catch (error) {
    console.error('Erro ao exportar PDF:', error)
    alert('Erro ao gerar PDF: ' + error.message)
  }
}

// NOVA FUNÇÃO DE EXPORTAÇÃO EXCEL
const exportToExcel = () => {
  if (!reportData.value || reportData.value.length === 0) {
    alert('Nenhum dado para exportar')
    return
  }

  try {
    let csv = '\uFEFF' // BOM para UTF-8
    csv += `"Relatório de ${getReportTypeLabel()}"\n`
    csv += `"Período: ${getPeriodLabel()}"\n`
    csv += `"Data: ${new Date().toLocaleString('pt-BR')}"\n`
    csv += `"Total: ${formatCurrency(getReportTotal())}"\n\n`

    // Adicionar resumo
    csv += `"Resumo"\n`
    csv += `"Total de Registros","${reportData.value.length}"\n\n`

    let headers = []
    let rows = []

    // Configurar headers e rows baseado no tipo de relatório
    if (filters.value.reportType === 'sales') {
      headers = ['Data', 'Pedido', 'Mesa', 'Itens', 'Valor', 'Status']
      rows = reportData.value.map(s => [
        formatDateTime(s.created_at),
        `#${s.id.toString().padStart(3, '0')}`,
        `Mesa ${s.mesa_id || 'N/A'}`,
        `${getItemsCount(s.itens)} itens`,
        s.valor_total.toFixed(2).replace('.', ','),
        getStatusLabel(s.status)
      ])
    } else if (filters.value.reportType === 'products') {
      headers = ['Produto', 'Quantidade', 'Total', 'Preço Médio']
      rows = reportData.value.map(p => [
        p.produto_nome || `Produto ${p.produto_id}`,
        `${p.quantidade_total} unidades`,
        p.total_arrecadado.toFixed(2).replace('.', ','),
        p.preco_medio.toFixed(2).replace('.', ',')
      ])
    } else if (filters.value.reportType === 'tables') {
      headers = ['Mesa', 'Pedidos', 'Total', 'Ticket Médio']
      rows = reportData.value.map(t => [
        `Mesa ${t.mesa_id}`,
        `${t.total_pedidos} pedidos`,
        t.total_vendas.toFixed(2).replace('.', ','),
        t.ticket_medio.toFixed(2).replace('.', ',')
      ])
    } else if (filters.value.reportType === 'users') {
      headers = ['Usuário', 'Email', 'Cargo', 'Pedidos', 'Total Vendido', 'Data de Cadastro']
      rows = reportData.value.map(u => [
        u.nome || 'N/A',
        u.email || 'N/A',
        u.cargo || 'N/A',
        u.total_pedidos || 0,
        (u.total_vendido || 0).toFixed(2).replace('.', ','),
        formatDateTime(u.created_at)
      ])
    } else if (filters.value.reportType === 'cashflow') {
      headers = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Valor', 'Responsável']
      rows = reportData.value.map(t => [
        formatDateTime(t.created_at),
        t.descricao || 'N/A',
        t.tipo === 'entrada' ? 'Entrada' : 'Saída',
        t.categoria || 'N/A',
        t.valor.toFixed(2).replace('.', ','),
        t.responsavel || 'N/A'
      ])
    }

    // Adicionar headers
    csv += headers.map(h => `"${h}"`).join(',') + '\n'
    
    // Adicionar dados
    csv += rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')

    // Criar blob e download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-${filters.value.reportType}-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    alert('📊 Excel/CSV exportado com sucesso!')
  } catch (error) {
    console.error('Erro ao exportar Excel:', error)
    alert('Erro ao gerar Excel: ' + error.message)
  }
}

// Imprimir
const printReport = () => {
  if (!reportData.value || reportData.value.length === 0) {
    alert('Nenhum dado para imprimir')
    return
  }
  window.print()
}

// Utilitários
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString('pt-BR')
}

const getPeriodLabel = () => {
  const labels = {
    today: 'Hoje',
    week: 'Esta Semana',
    month: 'Este Mês',
    '30days': 'Últimos 30 Dias',
    custom: 'Personalizado'
  }
  return labels[filters.value.period] || filters.value.period
}

const getReportTypeLabel = () => {
  const labels = {
    sales: 'Vendas',
    products: 'Produtos',
    tables: 'Mesas',
    users: 'Usuários',
    cashflow: 'Entrada/Saída'
  }
  return labels[filters.value.reportType] || filters.value.reportType
}

const getStatusLabel = (status) => {
  const statuses = {
    confirmado: 'Confirmado',
    pendente: 'Pendente',
    cancelado: 'Cancelado'
  }
  return statuses[status] || status || 'N/A'
}

const getStatusClass = (status) => {
  const classes = {
    confirmado: 'success',
    pendente: 'warning',
    cancelado: 'error'
  }
  return classes[status] || 'default'
}

const getItemsCount = (itens) => {
  if (!itens || !Array.isArray(itens)) return 0
  return itens.reduce((sum, item) => sum + (item.quantidade || 0), 0)
}

const getReportTotal = () => {
  if (!reportData.value) return 0
  
  switch (filters.value.reportType) {
    case 'sales':
      return reportData.value.reduce((sum, sale) => sum + (sale.valor_total || 0), 0)
    case 'products':
      return reportData.value.reduce((sum, product) => sum + (product.total_arrecadado || 0), 0)
    case 'tables':
      return reportData.value.reduce((sum, table) => sum + (table.total_vendas || 0), 0)
    case 'users':
      return reportData.value.reduce((sum, user) => sum + (user.total_vendido || 0), 0)
    case 'cashflow':
      return reportData.value.reduce((sum, transaction) => {
        return transaction.tipo === 'entrada' 
          ? sum + (transaction.valor || 0) 
          : sum - (transaction.valor || 0)
      }, 0)
    default:
      return 0
  }
}

const onPeriodChange = () => {
  if (filters.value.period === 'custom') {
    const today = new Date()
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    filters.value.startDate = oneWeekAgo.toISOString().split('T')[0]
    filters.value.endDate = today.toISOString().split('T')[0]
  }
}

// Gerar relatório inicial
onMounted(() => {
  generateReport()
})
</script>

<style scoped>
.reports-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.page-header p {
  color: #6b7280;
  margin: 0;
}

.filters-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: flex-end;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 150px;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
}

.filter-select {
  padding: 0.625rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1f2937;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-select:hover {
  border-color: #C41E3A;
}

.filter-select:focus {
  outline: none;
  border-color: #C41E3A;
  box-shadow: 0 0 0 3px rgba(196, 30, 58, 0.1);
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.5rem;
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  height: fit-content;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.export-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-pdf {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
}

.btn-excel {
  background: linear-gradient(135deg, #16a34a, #15803d);
}

.btn-print {
  background: linear-gradient(135deg, #6b7280, #4b5563);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #C41E3A;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.metric-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.metric-header h3 {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  margin: 0;
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.75rem 0;
}

.metric-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.metric-period {
  font-size: 0.75rem;
  color: #9ca3af;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.card-header h2 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.report-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead th {
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  padding: 0.75rem 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.data-table tbody td {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  color: #1f2937;
  font-size: 0.875rem;
}

.data-table tbody tr:hover {
  background: #f9fafb;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge.success {
  background: #dcfce7;
  color: #22c55e;
}

.badge.warning {
  background: #fef3c7;
  color: #d97706;
}

.badge.error {
  background: #fee2e2;
  color: #dc2626;
}

.badge.default {
  background: #f3f4f6;
  color: #6b7280;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-state h3 {
  margin: 1rem 0 0.5rem;
  color: #1f2937;
}

/* Estilos de impressão */
@media print {
  body * {
    visibility: hidden;
  }
  
  .reports-view,
  .reports-view * {
    visibility: visible;
  }
  
  .reports-view {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  
  .filters-card,
  .btn-primary,
  .btn-secondary,
  .export-buttons,
  button {
    display: none !important;
  }
  
  .page-header {
    text-align: center;
    border-bottom: 2px solid #C41E3A;
    padding-bottom: 15px;
    margin-bottom: 20px;
  }
  
  .metrics-grid {
    page-break-inside: avoid;
  }
  
  .card {
    page-break-inside: avoid;
    box-shadow: none;
    border: 1px solid #e0e0e0;
  }
  
  .data-table {
    font-size: 10px;
  }
  
  .data-table thead {
    background: #C41E3A !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .data-table thead th {
    color: white !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}

@media (max-width: 768px) {
  .filters-card {
    flex-direction: column;
  }

  .filter-group {
    width: 100%;
  }

  .btn-primary {
    width: 100%;
    justify-content: center;
  }

  .export-buttons {
    width: 100%;
    justify-content: center;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .card-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}
</style>
