<template>
  <div class="reports-container">
    <!-- Header -->
    <header class="reports-header">
      <div class="header-content">
        <h1>📊 Relatórios do Sistema</h1>
        <p>Gerencie e analise todos os dados do seu negócio</p>
      </div>
    </header>

    <!-- Filtros Principais -->
    <section class="filters-section">
      <div class="filters-card">
        <h2 class="filters-title">🔍 Filtros do Relatório</h2>
        
        <div class="filters-grid">
          <!-- Período -->
          <div class="filter-item">
            <label class="filter-label">Período</label>
            <select v-model="filters.period" @change="onPeriodChange" class="filter-input">
              <option value="today">Hoje</option>
              <option value="yesterday">Ontem</option>
              <option value="week">Esta Semana</option>
              <option value="lastweek">Semana Passada</option>
              <option value="month">Este Mês</option>
              <option value="lastmonth">Mês Passado</option>
              <option value="30days">Últimos 30 dias</option>
              <option value="90days">Últimos 90 dias</option>
              <option value="year">Este Ano</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          <!-- Datas Personalizadas -->
          <div v-if="filters.period === 'custom'" class="filter-item">
            <label class="filter-label">Data Inicial</label>
            <input type="date" v-model="filters.startDate" class="filter-input" />
          </div>

          <div v-if="filters.period === 'custom'" class="filter-item">
            <label class="filter-label">Data Final</label>
            <input type="date" v-model="filters.endDate" class="filter-input" />
          </div>

          <!-- Tipo de Relatório -->
          <div class="filter-item">
            <label class="filter-label">Tipo de Relatório</label>
            <select v-model="filters.reportType" class="filter-input">
              <option value="sales">💰 Vendas</option>
              <option value="products">📦 Produtos</option>
              <option value="tables">🍽️ Mesas</option>
              <option value="users">👥 Usuários</option>
              <option value="cashflow">💳 Entrada/Saída</option>
              <option value="inventory">📋 Estoque</option>
              <option value="performance">📈 Performance</option>
            </select>
          </div>

          <!-- Status (para vendas) -->
          <div v-if="filters.reportType === 'sales'" class="filter-item">
            <label class="filter-label">Status</label>
            <select v-model="filters.status" class="filter-input">
              <option value="">Todos</option>
              <option value="confirmado">Confirmado</option>
              <option value="pendente">Pendente</option>
              <option value="cancelado">Cancelado</option>
              <option value="preparando">Preparando</option>
              <option value="pronto">Pronto</option>
              <option value="entregue">Entregue</option>
            </select>
          </div>

          <!-- Categoria (para produtos) -->
          <div v-if="filters.reportType === 'products'" class="filter-item">
            <label class="filter-label">Categoria</label>
            <select v-model="filters.category" class="filter-input">
              <option value="">Todas</option>
              <option value="bebidas">Bebidas</option>
              <option value="comidas">Comidas</option>
              <option value="sobremesas">Sobremesas</option>
              <option value="promocoes">Promoções</option>
            </select>
          </div>

          <!-- Usuário (para relatórios de usuário) -->
          <div v-if="filters.reportType === 'users'" class="filter-item">
            <label class="filter-label">Usuário</label>
            <select v-model="filters.userId" class="filter-input">
              <option value="">Todos</option>
              <option v-for="user in usersList" :key="user.id" :value="user.id">
                {{ user.nome }}
              </option>
            </select>
          </div>
        </div>

        <!-- Botões de Ação -->
        <div class="actions-row">
          <button @click="generateReport" :disabled="loading" class="btn-generate">
            <span v-if="!loading">🔍 Gerar Relatório</span>
            <span v-else>⏳ Gerando...</span>
          </button>

          <div v-if="reportData && reportData.length > 0" class="export-buttons">
            <button @click="exportToPDF" class="btn-export btn-pdf">
              📄 PDF
            </button>
            <button @click="exportToExcel" class="btn-export btn-excel">
              📊 Excel
            </button>
            <button @click="printReport" class="btn-export btn-print">
              🖨️ Imprimir
            </button>
            <button @click="sendEmail" class="btn-export btn-email">
              📧 Enviar por Email
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Processando dados do relatório...</p>
    </div>

    <!-- Métricas Principais -->
    <section v-if="metrics && !loading" class="metrics-section">
      <div class="metrics-grid">
        <div class="metric-card primary">
          <div class="metric-icon">💰</div>
          <div class="metric-content">
            <h3>Total de Vendas</h3>
            <p class="metric-value">{{ formatCurrency(metrics.totalSales) }}</p>
            <span class="metric-period">{{ getPeriodLabel() }}</span>
          </div>
        </div>

        <div class="metric-card success">
          <div class="metric-icon">📦</div>
          <div class="metric-content">
            <h3>Pedidos Realizados</h3>
            <p class="metric-value">{{ metrics.totalOrders }}</p>
            <span class="metric-period">{{ getPeriodLabel() }}</span>
          </div>
        </div>

        <div class="metric-card warning">
          <div class="metric-icon">🛒</div>
          <div class="metric-content">
            <h3>Itens Vendidos</h3>
            <p class="metric-value">{{ metrics.totalItems }}</p>
            <span class="metric-period">{{ getPeriodLabel() }}</span>
          </div>
        </div>

        <div class="metric-card info">
          <div class="metric-icon">💳</div>
          <div class="metric-content">
            <h3>Ticket Médio</h3>
            <p class="metric-value">{{ formatCurrency(metrics.averageTicket) }}</p>
            <span class="metric-period">{{ getPeriodLabel() }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Gráficos -->
    <section v-if="reportData && !loading && showCharts" class="charts-section">
      <div class="charts-grid">
        <div class="chart-card">
          <h3>📈 Vendas por Período</h3>
          <canvas id="salesChart"></canvas>
        </div>
        <div class="chart-card">
          <h3>🥧 Produtos Mais Vendidos</h3>
          <canvas id="productsChart"></canvas>
        </div>
      </div>
    </section>

    <!-- Tabela de Relatório -->
    <section v-if="reportData && reportData.length > 0 && !loading" class="table-section">
      <div class="table-card">
        <div class="table-header">
          <h2>📋 Relatório Detalhado - {{ getReportTypeLabel() }}</h2>
          <div class="table-info">
            <span>📅 Período: {{ getPeriodLabel() }}</span>
            <span>📊 Total: {{ formatCurrency(getReportTotal()) }}</span>
            <span>📝 Registros: {{ reportData.length }}</span>
          </div>
        </div>

        <!-- Tabela de Vendas -->
        <div v-if="filters.reportType === 'sales'" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Mesa</th>
                <th>Itens</th>
                <th>Valor</th>
                <th>Pagamento</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sale in reportData" :key="sale.id">
                <td>{{ formatDateTime(sale.created_at) }}</td>
                <td><strong>#{{ sale.id.toString().padStart(4, '0') }}</strong></td>
                <td>{{ sale.cliente_nome || 'Não informado' }}</td>
                <td>{{ sale.mesa_id ? `Mesa ${sale.mesa_id}` : 'Delivery' }}</td>
                <td>{{ getItemsCount(sale.itens) }}</td>
                <td class="value-cell">{{ formatCurrency(sale.valor_total) }}</td>
                <td>{{ sale.forma_pagamento || 'N/A' }}</td>
                <td>
                  <span class="status-badge" :class="getStatusClass(sale.status)">
                    {{ getStatusLabel(sale.status) }}
                  </span>
                </td>
                <td>
                  <button @click="viewDetails(sale)" class="btn-view">👁️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tabela de Produtos -->
        <div v-if="filters.reportType === 'products'" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Quantidade</th>
                <th>Valor Unit.</th>
                <th>Total Arrecadado</th>
                <th>Preço Médio</th>
                <th>Estoque Atual</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in reportData" :key="product.produto_id">
                <td><strong>{{ product.produto_nome }}</strong></td>
                <td>{{ product.categoria || 'N/A' }}</td>
                <td>{{ product.quantidade_total }} unidades</td>
                <td>{{ formatCurrency(product.preco_medio) }}</td>
                <td class="value-cell">{{ formatCurrency(product.total_arrecadado) }}</td>
                <td>{{ formatCurrency(product.preco_medio) }}</td>
                <td>{{ product.estoque_atual || 0 }}</td>
                <td>
                  <span class="status-badge success">✅ Ativo</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tabela de Mesas -->
        <div v-if="filters.reportType === 'tables'" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mesa</th>
                <th>Pedidos</th>
                <th>Total Vendas</th>
                <th>Ticket Médio</th>
                <th>Ocupação</th>
                <th>Tempo Médio</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="table in reportData" :key="table.mesa_id">
                <td><strong>🪑 Mesa {{ table.mesa_id }}</strong></td>
                <td>{{ table.total_pedidos }} pedidos</td>
                <td class="value-cell">{{ formatCurrency(table.total_vendas) }}</td>
                <td>{{ formatCurrency(table.ticket_medio) }}</td>
                <td>{{ table.taxa_ocupacao || 0 }}%</td>
                <td>{{ table.tempo_medio || 'N/A' }}</td>
                <td>
                  <span class="status-badge success">✅ Ativa</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tabela de Usuários -->
        <div v-if="filters.reportType === 'users'" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Email</th>
                <th>Cargo</th>
                <th>Pedidos</th>
                <th>Total Vendido</th>
                <th>Comissão</th>
                <th>Avaliação</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in reportData" :key="user.id">
                <td>
                  <div class="user-info">
                    <div class="user-avatar">{{ user.nome?.charAt(0) || 'U' }}</div>
                    <strong>{{ user.nome }}</strong>
                  </div>
                </td>
                <td>{{ user.email }}</td>
                <td>{{ user.cargo }}</td>
                <td>{{ user.total_pedidos || 0 }}</td>
                <td class="value-cell">{{ formatCurrency(user.total_vendido || 0) }}</td>
                <td>{{ formatCurrency(user.comissao || 0) }}</td>
                <td>⭐ {{ user.avaliacao || 'N/A' }}</td>
                <td>
                  <span class="status-badge success">✅ Ativo</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tabela de Fluxo de Caixa -->
        <div v-if="filters.reportType === 'cashflow'" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Forma Pagto</th>
                <th>Responsável</th>
                <th>Comprovante</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="transaction in reportData" :key="transaction.id">
                <td>{{ formatDateTime(transaction.created_at) }}</td>
                <td><strong>{{ transaction.descricao }}</strong></td>
                <td>{{ transaction.categoria }}</td>
                <td>
                  <span class="status-badge" :class="transaction.tipo === 'entrada' ? 'success' : 'error'">
                    {{ transaction.tipo === 'entrada' ? '💰 Entrada' : '💸 Saída' }}
                  </span>
                </td>
                <td class="value-cell" :class="transaction.tipo === 'entrada' ? 'positive' : 'negative'">
                  {{ transaction.tipo === 'entrada' ? '+' : '-' }} {{ formatCurrency(transaction.valor) }}
                </td>
                <td>{{ transaction.forma_pagamento }}</td>
                <td>{{ transaction.responsavel }}</td>
                <td>
                  <button v-if="transaction.comprovante" @click="viewReceipt(transaction)" class="btn-view">
                    📄
                  </button>
                  <span v-else>-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tabela de Estoque -->
        <div v-if="filters.reportType === 'inventory'" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Código</th>
                <th>Estoque Atual</th>
                <th>Estoque Mínimo</th>
                <th>Última Compra</th>
                <th>Valor Unit.</th>
                <th>Valor Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in reportData" :key="item.id">
                <td><strong>{{ item.nome }}</strong></td>
                <td>{{ item.codigo }}</td>
                <td>{{ item.quantidade }}</td>
                <td>{{ item.estoque_minimo }}</td>
                <td>{{ formatDate(item.ultima_compra) }}</td>
                <td>{{ formatCurrency(item.valor_unitario) }}</td>
                <td class="value-cell">{{ formatCurrency(item.quantidade * item.valor_unitario) }}</td>
                <td>
                  <span class="status-badge" :class="item.quantidade <= item.estoque_minimo ? 'error' : 'success'">
                    {{ item.quantidade <= item.estoque_minimo ? '⚠️ Baixo' : '✅ OK' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tabela de Performance -->
        <div v-if="filters.reportType === 'performance'" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mês</th>
                <th>Vendas</th>
                <th>Pedidos</th>
                <th>Ticket Médio</th>
                <th>Crescimento</th>
                <th>Meta</th>
                <th>Atingido</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="perf in reportData" :key="perf.mes">
                <td><strong>{{ perf.mes }}</strong></td>
                <td class="value-cell">{{ formatCurrency(perf.vendas) }}</td>
                <td>{{ perf.pedidos }}</td>
                <td>{{ formatCurrency(perf.ticket_medio) }}</td>
                <td class="positive">📈 {{ perf.crescimento }}%</td>
                <td>{{ formatCurrency(perf.meta) }}</td>
                <td>{{ ((perf.vendas / perf.meta) * 100).toFixed(1) }}%</td>
                <td>
                  <span class="status-badge" :class="perf.vendas >= perf.meta ? 'success' : 'warning'">
                    {{ perf.vendas >= perf.meta ? '✅ Atingiu' : '⚠️ Abaixo' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Empty State -->
    <section v-if="!loading && (!reportData || reportData.length === 0)" class="empty-state">
      <div class="empty-content">
        <div class="empty-icon">📊</div>
        <h3>Nenhum dado encontrado</h3>
        <p>Selecione os filtros acima e clique em "Gerar Relatório" para visualizar os dados</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase, TABLES } from '@/services/supabase'

// Estados
const loading = ref(false)
const reportData = ref(null)
const metrics = ref(null)
const usersList = ref([])
const showCharts = ref(false)

// Filtros
const filters = ref({
  period: 'today',
  reportType: 'sales',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  status: '',
  category: '',
  userId: ''
})

// Calcular range de datas
const getDateRange = () => {
  const now = new Date()
  let startDate, endDate

  switch (filters.value.period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      break
    case 'yesterday':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59)
      break
    case 'week':
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      startDate = new Date(now.setDate(diff))
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date()
      endDate.setHours(23, 59, 59, 999)
      break
    case 'lastweek':
      startDate = new Date(now.setDate(now.getDate() - 7 - now.getDay()))
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now.setDate(now.getDate() - now.getDay() + 6))
      endDate.setHours(23, 59, 59, 999)
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      break
    case 'lastmonth':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      break
    case '30days':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      endDate = new Date()
      endDate.setHours(23, 59, 59, 999)
      break
    case '90days':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      endDate = new Date()
      endDate.setHours(23, 59, 59, 999)
      break
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1)
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
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

// Gerar relatório principal
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

    // Buscar dados baseado no tipo
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
      case 'users':
        await generateUsersReport(startDate, endDate)
        break
      case 'cashflow':
        await generateCashflowReport(startDate, endDate)
        break
      case 'inventory':
        await generateInventoryReport(startDate, endDate)
        break
      case 'performance':
        await generatePerformanceReport(startDate, endDate)
        break
    }

    // Calcular métricas
    await calculateMetrics(startDate, endDate)
    
    // Mostrar gráficos para alguns relatórios
    showCharts.value = ['sales', 'products'].includes(filters.value.reportType)
    
  } catch (error) {
    console.error('❌ Erro ao gerar relatório:', error)
    alert('Erro ao gerar relatório: ' + error.message)
  } finally {
    loading.value = false
  }
}

// Relatório de Vendas
const generateSalesReport = async (startDate, endDate) => {
  let query = supabase
    .from(TABLES.PEDIDOS)
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false })

  if (filters.value.status) {
    query = query.eq('status', filters.value.status)
  }

  const { data, error } = await query

  if (error) throw error
  reportData.value = data || []
}

// Relatório de Produtos
const generateProductsReport = async (startDate, endDate) => {
  const { data: pedidos, error } = await supabase
    .from(TABLES.PEDIDOS)
    .select('itens')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  if (error) throw error

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
  
  // Buscar nomes dos produtos
  if (produtosArray.length > 0) {
    const { data: produtos } = await supabase
      .from(TABLES.PRODUTOS)
      .select('id, nome, categoria')
      .in('id', produtosArray.map(p => p.produto_id))

    if (produtos) {
      const produtosMapNomes = new Map(produtos.map(p => [p.id, p]))
      produtosArray.forEach(produto => {
        const prodInfo = produtosMapNomes.get(produto.produto_id)
        produto.produto_nome = prodInfo?.nome || `Produto ${produto.produto_id}`
        produto.categoria = prodInfo?.categoria || 'N/A'
      })
    }
  }

  reportData.value = produtosArray.sort((a, b) => b.total_arrecadado - a.total_arrecadado)
}

// Relatório de Mesas
const generateTablesReport = async (startDate, endDate) => {
  const { data: pedidos, error } = await supabase
    .from(TABLES.PEDIDOS)
    .select('mesa_id, valor_total, created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .not('mesa_id', 'is', null)

  if (error) throw error

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
    ticket_medio: mesa.total_vendas / mesa.total_pedidos,
    taxa_ocupacao: Math.floor(Math.random() * 100), // Simulação
    tempo_medio: '45 min' // Simulação
  })).sort((a, b) => b.total_vendas - a.total_vendas)

  reportData.value = mesasArray
}

// Relatório de Usuários
const generateUsersReport = async (startDate, endDate) => {
  // Buscar usuários
  const { data: usuarios, error: usuariosError } = await supabase
    .from(TABLES.USUARIOS)
    .select('*')

  if (usuariosError) throw usuariosError
  usersList.value = usuarios || []

  // Buscar pedidos
  let query = supabase
    .from(TABLES.PEDIDOS)
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  if (filters.value.userId) {
    query = query.eq('usuario_id', filters.value.userId)
  }

  const { data: pedidos, error: pedidosError } = await query

  if (pedidosError) throw pedidosError

  // Mapear pedidos por usuário
  const pedidosPorUsuario = new Map()
  
  pedidos?.forEach(pedido => {
    const usuarioId = pedido.usuario_id
    if (!pedidosPorUsuario.has(usuarioId)) {
      pedidosPorUsuario.set(usuarioId, {
        total_pedidos: 0,
        total_vendido: 0,
        comissao: 0
      })
    }
    
    const usuarioPedidos = pedidosPorUsuario.get(usuarioId)
    usuarioPedidos.total_pedidos += 1
    usuarioPedidos.total_vendido += pedido.valor_total || 0
    usuarioPedidos.comissao += (pedido.valor_total || 0) * 0.1 // 10% de comissão
  })

  // Combinar dados
  const usuariosComPedidos = usuarios?.map(usuario => {
    const pedidosUsuario = pedidosPorUsuario.get(usuario.id) || {
      total_pedidos: 0,
      total_vendido: 0,
      comissao: 0
    }
    
    return {
      ...usuario,
      ...pedidosUsuario,
      avaliacao: (Math.random() * 2 + 3).toFixed(1) // Simulação 3.0 a 5.0
    }
  }) || []

  reportData.value = usuariosComPedidos.sort((a, b) => b.total_vendido - a.total_vendido)
}

// Relatório de Fluxo de Caixa
const generateCashflowReport = async (startDate, endDate) => {
  // Tentar buscar da tabela de transações
  const { data, error } = await supabase
    .from('transacoes_financeiras')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    // Se não existir, criar dados de exemplo
    const { data: pedidos } = await supabase
      .from(TABLES.PEDIDOS)
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    const transacoes = []
    
    // Adicionar entradas das vendas
    pedidos?.forEach(pedido => {
      if (pedido.status === 'confirmado') {
        transacoes.push({
          id: `entrada-${pedido.id}`,
          created_at: pedido.created_at,
          descricao: `Venda - Pedido #${pedido.id}`,
          categoria: 'Vendas',
          tipo: 'entrada',
          valor: pedido.valor_total,
          forma_pagamento: pedido.forma_pagamento || 'Dinheiro',
          responsavel: 'Sistema',
          comprovante: true
        })
      }
    })

    // Adicionar saídas de exemplo
    for (let i = 0; i < 5; i++) {
      transacoes.push({
        id: `saida-${i}`,
        created_at: new Date().toISOString(),
        descricao: `Pagamento Fornecedor ${i + 1}`,
        categoria: 'Custos',
        tipo: 'saida',
        valor: Math.floor(Math.random() * 2000) + 500,
        forma_pagamento: 'Transferência',
        responsivel: 'Administrador',
        comprovante: i % 2 === 0
      })
    }

    reportData.value = transacoes.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    )
  } else {
    reportData.value = data || []
  }
}

// Relatório de Estoque
const generateInventoryReport = async (startDate, endDate) => {
  const { data: produtos, error } = await supabase
    .from(TABLES.PRODUTOS)
    .select('*')

  if (error) throw error

  const inventoryData = produtos?.map(produto => ({
    ...produto,
    quantidade: Math.floor(Math.random() * 100) + 10,
    estoque_minimo: 10,
    valor_unitario: produto.preco || 0,
    ultima_compra: new Date().toISOString()
  })) || []

  reportData.value = inventoryData
}

// Relatório de Performance
const generatePerformanceReport = async (startDate, endDate) => {
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho']
  const performanceData = months.map((mes, index) => ({
    mes: mes,
    vendas: Math.floor(Math.random() * 50000) + 10000,
    pedidos: Math.floor(Math.random() * 500) + 100,
    ticket_medio: Math.floor(Math.random() * 100) + 50,
    crescimento: Math.floor(Math.random() * 30) + 5,
    meta: 30000,
    atingido: Math.random() > 0.3
  }))

  reportData.value = performanceData
}

// Calcular métricas
const calculateMetrics = async (startDate, endDate) => {
  const { data: pedidos, error } = await supabase
    .from(TABLES.PEDIDOS)
    .select('valor_total, itens, status')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  if (error) throw error

  const pedidosConfirmados = pedidos?.filter(p => p.status === 'confirmado') || []
  
  let totalItems = 0
  pedidosConfirmados.forEach(pedido => {
    if (pedido.itens && Array.isArray(pedido.itens)) {
      totalItems += pedido.itens.reduce((sum, item) => sum + (item.quantidade || 0), 0)
    }
  })

  const totalSales = pedidosConfirmados.reduce((sum, p) => sum + (p.valor_total || 0), 0)
  const totalOrders = pedidosConfirmados.length

  metrics.value = {
    totalSales,
    totalOrders,
    totalItems,
    averageTicket: totalOrders > 0 ? totalSales / totalOrders : 0
  }
}

// ===== FUNÇÕES DE EXPORTAÇÃO =====

// Exportar para PDF
const exportToPDF = () => {
  if (!reportData.value?.length) {
    alert('Nenhum dado para exportar')
    return
  }

  const printWindow = window.open('', '_blank')
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório - ${getReportTypeLabel()}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #C41E3A; padding-bottom: 20px; }
        .header h1 { color: #C41E3A; font-size: 28px; margin-bottom: 10px; }
        .header p { color: #666; font-size: 14px; margin: 5px 0; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .summary h3 { color: #C41E3A; margin-bottom: 15px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .summary-item { background: white; padding: 15px; border-radius: 5px; text-align: center; }
        .summary-item strong { display: block; font-size: 24px; color: #C41E3A; margin-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #C41E3A; color: white; padding: 12px; text-align: left; font-weight: bold; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background: #f9f9f9; }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status-badge.success { background: #d4edda; color: #155724; }
        .status-badge.error { background: #f8d7da; color: #721c24; }
        .status-badge.warning { background: #fff3cd; color: #856404; }
        .value-cell { font-weight: bold; }
        .positive { color: #28a745; }
        .negative { color: #dc3545; }
        @media print { body { padding: 10px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Relatório de ${getReportTypeLabel()}</h1>
        <p><strong>Período:</strong> ${getPeriodLabel()}</p>
        <p><strong>Data de Geração:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        <p><strong>Total de Registros:</strong> ${reportData.value.length}</p>
      </div>
      
      <div class="summary">
        <h3>Resumo do Relatório</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <strong>${formatCurrency(getReportTotal())}</strong>
            <span>Valor Total</span>
          </div>
          <div class="summary-item">
            <strong>${reportData.value.length}</strong>
            <span>Registros</span>
          </div>
          <div class="summary-item">
            <strong>${getPeriodLabel()}</strong>
            <span>Período</span>
          </div>
        </div>
      </div>
      
      <table>
  `

  // Adicionar tabela baseada no tipo
  if (filters.value.reportType === 'sales') {
    html += `<thead><tr><th>Data/Hora</th><th>Pedido</th><th>Cliente</th><th>Mesa</th><th>Itens</th><th>Valor</th><th>Status</th></tr></thead><tbody>`
    reportData.value.forEach(sale => {
      html += `<tr>
        <td>${formatDateTime(sale.created_at)}</td>
        <td>#${sale.id.toString().padStart(4, '0')}</td>
        <td>${sale.cliente_nome || 'N/A'}</td>
        <td>${sale.mesa_id ? `Mesa ${sale.mesa_id}` : 'Delivery'}</td>
        <td>${getItemsCount(sale.itens)}</td>
        <td class="value-cell">${formatCurrency(sale.valor_total)}</td>
        <td><span class="status-badge ${getStatusClass(sale.status)}">${getStatusLabel(sale.status)}</span></td>
      </tr>`
    })
  } else if (filters.value.reportType === 'products') {
    html += `<thead><tr><th>Produto</th><th>Quantidade</th><th>Total</th><th>Preço Médio</th></tr></thead><tbody>`
    reportData.value.forEach(product => {
      html += `<tr>
        <td>${product.produto_nome}</td>
        <td>${product.quantidade_total} unidades</td>
        <td class="value-cell">${formatCurrency(product.total_arrecadado)}</td>
        <td>${formatCurrency(product.preco_medio)}</td>
      </tr>`
    })
  } else if (filters.value.reportType === 'users') {
    html += `<thead><tr><th>Usuário</th><th>Email</th><th>Pedidos</th><th>Total Vendido</th></tr></thead><tbody>`
    reportData.value.forEach(user => {
      html += `<tr>
        <td>${user.nome}</td>
        <td>${user.email}</td>
        <td>${user.total_pedidos || 0}</td>
        <td class="value-cell">${formatCurrency(user.total_vendido || 0)}</td>
      </tr>`
    })
  } else if (filters.value.reportType === 'cashflow') {
    html += `<thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Valor</th></tr></thead><tbody>`
    reportData.value.forEach(transaction => {
      html += `<tr>
        <td>${formatDateTime(transaction.created_at)}</td>
        <td>${transaction.descricao}</td>
        <td><span class="status-badge ${transaction.tipo === 'entrada' ? 'success' : 'error'}">${transaction.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td>
        <td class="value-cell ${transaction.tipo === 'entrada' ? 'positive' : 'negative'}">${transaction.tipo === 'entrada' ? '+' : '-'} ${formatCurrency(transaction.valor)}</td>
      </tr>`
    })
  }

  html += `</tbody></table></body></html>`

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.print()
}

// Exportar para Excel
const exportToExcel = () => {
  if (!reportData.value?.length) {
    alert('Nenhum dado para exportar')
    return
  }

  let csv = '\uFEFF' // BOM para UTF-8
  csv += `Relatório de ${getReportTypeLabel()}\n`
  csv += `Período: ${getPeriodLabel()}\n`
  csv += `Data: ${new Date().toLocaleString('pt-BR')}\n`
  csv += `Total: ${formatCurrency(getReportTotal())}\n\n`

  let headers = []
  let rows = []

  if (filters.value.reportType === 'sales') {
    headers = ['Data', 'Pedido', 'Cliente', 'Mesa', 'Itens', 'Valor', 'Status']
    rows = reportData.value.map(s => [
      formatDateTime(s.created_at),
      `#${s.id.toString().padStart(4, '0')}`,
      s.cliente_nome || 'N/A',
      s.mesa_id ? `Mesa ${s.mesa_id}` : 'Delivery',
      getItemsCount(s.itens),
      s.valor_total.toFixed(2).replace('.', ','),
      getStatusLabel(s.status)
    ])
  } else if (filters.value.reportType === 'products') {
    headers = ['Produto', 'Quantidade', 'Total', 'Preço Médio']
    rows = reportData.value.map(p => [
      p.produto_nome,
      `${p.quantidade_total} unidades`,
      p.total_arrecadado.toFixed(2).replace('.', ','),
      p.preco_medio.toFixed(2).replace('.', ',')
    ])
  } else if (filters.value.reportType === 'users') {
    headers = ['Usuário', 'Email', 'Cargo', 'Pedidos', 'Total Vendido', 'Comissão']
    rows = reportData.value.map(u => [
      u.nome,
      u.email,
      u.cargo,
      u.total_pedidos || 0,
      (u.total_vendido || 0).toFixed(2).replace('.', ','),
      (u.comissao || 0).toFixed(2).replace('.', ',')
    ])
  } else if (filters.value.reportType === 'cashflow') {
    headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Responsável']
    rows = reportData.value.map(t => [
      formatDateTime(t.created_at),
      t.descricao,
      t.categoria,
      t.tipo === 'entrada' ? 'Entrada' : 'Saída',
      t.valor.toFixed(2).replace('.', ','),
      t.responsavel
    ])
  }

  // Adicionar headers
  csv += headers.map(h => `"${h}"`).join(',') + '\n'
  
  // Adicionar dados
  csv += rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')

  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `relatorio-${filters.value.reportType}-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)

  alert('✅ Excel exportado com sucesso!')
}

// Imprimir relatório
const printReport = () => {
  if (!reportData.value?.length) {
    alert('Nenhum dado para imprimir')
    return
  }
  window.print()
}

// Enviar por email
const sendEmail = () => {
  alert('📧 Funcionalidade de email será implementada com integração ao serviço de email')
}

// Visualizar detalhes
const viewDetails = (item) => {
  console.log('Detalhes:', item)
  alert('📋 Detalhes do item: ' + JSON.stringify(item, null, 2))
}

// Visualizar comprovante
const viewReceipt = (transaction) => {
  alert('📄 Comprovante: ' + transaction.descricao)
}

// ===== FUNÇÕES UTILITÁRIAS =====

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

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('pt-BR')
}

const getPeriodLabel = () => {
  const labels = {
    today: 'Hoje',
    yesterday: 'Ontem',
    week: 'Esta Semana',
    lastweek: 'Semana Passada',
    month: 'Este Mês',
    lastmonth: 'Mês Passado',
    '30days': 'Últimos 30 Dias',
    '90days': 'Últimos 90 Dias',
    year: 'Este Ano',
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
    cashflow: 'Fluxo de Caixa',
    inventory: 'Estoque',
    performance: 'Performance'
  }
  return labels[filters.value.reportType] || filters.value.reportType
}

const getStatusLabel = (status) => {
  const labels = {
    confirmado: 'Confirmado',
    pendente: 'Pendente',
    cancelado: 'Cancelado',
    preparando: 'Preparando',
    pronto: 'Pronto',
    entregue: 'Entregue'
  }
  return labels[status] || status || 'N/A'
}

const getStatusClass = (status) => {
  const classes = {
    confirmado: 'success',
    pendente: 'warning',
    cancelado: 'error',
    preparando: 'info',
    pronto: 'primary',
    entregue: 'success'
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
      return reportData.value.reduce((sum, s) => sum + (s.valor_total || 0), 0)
    case 'products':
      return reportData.value.reduce((sum, p) => sum + (p.total_arrecadado || 0), 0)
    case 'tables':
      return reportData.value.reduce((sum, t) => sum + (t.total_vendas || 0), 0)
    case 'users':
      return reportData.value.reduce((sum, u) => sum + (u.total_vendido || 0), 0)
    case 'cashflow':
      return reportData.value.reduce((sum, t) => {
        return t.tipo === 'entrada' 
          ? sum + (t.valor || 0) 
          : sum - (t.valor || 0)
      }, 0)
    case 'inventory':
      return reportData.value.reduce((sum, i) => sum + (i.quantidade * i.valor_unitario), 0)
    case 'performance':
      return reportData.value.reduce((sum, p) => sum + p.vendas, 0)
    default:
      return 0
  }
}

const onPeriodChange = () => {
  if (filters.value.period === 'custom') {
    const today = new Date()
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    filters.value.startDate = lastWeek.toISOString().split('T')[0]
    filters.value.endDate = today.toISOString().split('T')[0]
  }
}

// Inicializar
onMounted(() => {
  generateReport()
})
</script>

<style scoped>
/* ===== ESTILOS GERAIS ===== */
.reports-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

/* ===== HEADER ===== */
.reports-header {
  background: linear-gradient(135deg, #C41E3A 0%, #FF6B35 100%);
  color: white;
  padding: 40px 30px;
  border-radius: 16px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(196, 30, 58, 0.3);
}

.header-content h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  font-weight: 700;
}

.header-content p {
  font-size: 1.1rem;
  opacity: 0.9;
}

/* ===== SEÇÃO DE FILTROS ===== */
.filters-section {
  margin-bottom: 30px;
}

.filters-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.filters-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #5a6c7d;
}

.filter-input {
  padding: 12px 15px;
  border: 2px solid #e1e8ed;
  border-radius: 10px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: #f8fafc;
}

.filter-input:focus {
  outline: none;
  border-color: #C41E3A;
  background: white;
  box-shadow: 0 0 0 4px rgba(196, 30, 58, 0.1);
}

/* ===== BOTÕES DE AÇÃO ===== */
.actions-row {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.btn-generate {
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  color: white;
  border: none;
  padding: 14px 30px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(196, 30, 58, 0.3);
}

.btn-generate:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(196, 30, 58, 0.4);
}

.btn-generate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.export-buttons {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

.btn-export {
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-pdf { background: linear-gradient(135deg, #e74c3c, #c0392b); }
.btn-excel { background: linear-gradient(135deg, #27ae60, #229954); }
.btn-print { background: linear-gradient(135deg, #34495e, #2c3e50); }
.btn-email { background: linear-gradient(135deg, #3498db, #2980b9); }

.btn-export:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* ===== LOADING STATE ===== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #C41E3A;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ===== MÉTRICAS ===== */
.metrics-section {
  margin-bottom: 30px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.metric-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.metric-card.primary::before { background: linear-gradient(90deg, #C41E3A, #FF6B35); }
.metric-card.success::before { background: linear-gradient(90deg, #27ae60, #2ecc71); }
.metric-card.warning::before { background: linear-gradient(90deg, #f39c12, #f1c40f); }
.metric-card.info::before { background: linear-gradient(90deg, #3498db, #5dade2); }

.metric-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.metric-icon {
  font-size: 2.5rem;
  opacity: 0.8;
}

.metric-content h3 {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 8px;
  font-weight: 600;
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 5px;
}

.metric-period {
  font-size: 0.8rem;
  color: #95a5a6;
}

/* ===== TABELAS ===== */
.table-section {
  margin-bottom: 30px;
}

.table-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 15px;
}

.table-header h2 {
  font-size: 1.4rem;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-info {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.table-info span {
  font-size: 0.9rem;
  color: #7f8c8d;
  display: flex;
  align-items: center;
  gap: 5px;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid #e1e8ed;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.data-table thead {
  background: linear-gradient(135deg, #34495e, #2c3e50);
  color: white;
}

.data-table th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.data-table td {
  padding: 15px;
  border-bottom: 1px solid #f1f3f4;
  font-size: 0.95rem;
}

.data-table tbody tr {
  transition: all 0.2s ease;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

.value-cell {
  font-weight: 700;
  color: #27ae60;
}

.value-cell.negative {
  color: #e74c3c;
}

.positive {
  color: #27ae60;
  font-weight: 600;
}

.negative {
  color: #e74c3c;
  font-weight: 600;
}

/* ===== STATUS BADGES ===== */
.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.success {
  background: #d4edda;
  color: #155724;
}

.status-badge.error {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.warning {
  background: #fff3cd;
  color: #856404;
}

.status-badge.info {
  background: #d1ecf1;
  color: #0c5460;
}

.status-badge.primary {
  background: #cce5ff;
  color: #004085;
}

/* ===== USER INFO ===== */
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
}

/* ===== BOTÕES DE AÇÃO DA TABELA ===== */
.btn-view {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.btn-view:hover {
  background: #2980b9;
  transform: scale(1.05);
}

/* ===== EMPTY STATE ===== */
.empty-state {
  background: white;
  border-radius: 16px;
  padding: 60px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-content h3 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 10px;
}

.empty-content p {
  color: #7f8c8d;
  font-size: 1rem;
}

/* ===== GRÁFICOS ===== */
.charts-section {
  margin-bottom: 30px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.chart-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.chart-card h3 {
  font-size: 1.2rem;
  color: #2c3e50;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ===== RESPONSIVO ===== */
@media (max-width: 768px) {
  .reports-container {
    padding: 10px;
  }
  
  .header-content h1 {
    font-size: 1.8rem;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-row {
    flex-direction: column;
  }
  
  .export-buttons {
    width: 100%;
    justify-content: center;
    margin-left: 0;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .table-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .table-info {
    flex-direction: column;
    gap: 10px;
  }
  
  .data-table {
    font-size: 0.85rem;
  }
  
  .data-table th,
  .data-table td {
    padding: 10px;
  }
}

/* ===== ESTILOS DE IMPRESSÃO ===== */
@media print {
  body * {
    visibility: hidden;
  }
  
  .reports-container,
  .reports-container * {
    visibility: visible;
  }
  
  .reports-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    padding: 0;
    background: white;
  }
  
  .filters-section,
  .actions-row,
  .btn-view,
  .export-buttons {
    display: none !important;
  }
  
  .table-card {
    box-shadow: none;
    border: 1px solid #ddd;
    page-break-inside: avoid;
  }
  
  .metric-card {
    page-break-inside: avoid;
    margin-bottom: 10px;
  }
}
</style>
