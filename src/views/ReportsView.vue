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
        <select class="filter-select">
          <option>Hoje</option>
          <option>Esta Semana</option>
          <option>Este Mês</option>
          <option>Últimos 30 dias</option>
          <option>Personalizado</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Tipo de Relatório</label>
        <select class="filter-select">
          <option>Vendas</option>
          <option>Produtos</option>
          <option>Financeiro</option>
          <option>Mesas</option>
          <option>Usuários</option>
        </select>
      </div>

      <button class="btn-primary">
        <Search :size="16" />
        Gerar Relatório
      </button>
    </div>

    <!-- Cards de Métricas -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-header">
          <ShoppingCart :size="20" color="#3b82f6" />
          <h3>Total de Vendas</h3>
        </div>
        <p class="metric-value">R$ 18.450,00</p>
        <div class="metric-footer">
          <span class="metric-change positive">
            <TrendingUp :size="14" />
            +12.5%
          </span>
          <span class="metric-period">vs período anterior</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <Package :size="20" color="#22c55e" />
          <h3>Produtos Vendidos</h3>
        </div>
        <p class="metric-value">342</p>
        <div class="metric-footer">
          <span class="metric-change positive">
            <TrendingUp :size="14" />
            +8.3%
          </span>
          <span class="metric-period">vs período anterior</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <Users :size="20" color="#a855f7" />
          <h3>Clientes Atendidos</h3>
        </div>
        <p class="metric-value">156</p>
        <div class="metric-footer">
          <span class="metric-change positive">
            <TrendingUp :size="14" />
            +15.2%
          </span>
          <span class="metric-period">vs período anterior</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <DollarSign :size="20" color="#f59e0b" />
          <h3>Ticket Médio</h3>
        </div>
        <p class="metric-value">R$ 118,26</p>
        <div class="metric-footer">
          <span class="metric-change negative">
            <TrendingDown :size="14" />
            -3.1%
          </span>
          <span class="metric-period">vs período anterior</span>
        </div>
      </div>
    </div>

    <!-- Gráficos e Tabelas -->
    <div class="content-grid">
      <!-- Top Produtos -->
      <div class="card">
        <div class="card-header">
          <h2>Produtos Mais Vendidos</h2>
          <button class="btn-icon">
            <Download :size="16" />
          </button>
        </div>
        <div class="products-ranking">
          <div class="ranking-item">
            <div class="ranking-position">1</div>
            <div class="ranking-info">
              <p class="ranking-name">Pizza Margherita</p>
              <div class="ranking-bar">
                <div class="ranking-bar-fill" style="width: 100%"></div>
              </div>
            </div>
            <div class="ranking-stats">
              <p class="ranking-count">48 vendas</p>
              <p class="ranking-value">R$ 1.920,00</p>
            </div>
          </div>

          <div class="ranking-item">
            <div class="ranking-position">2</div>
            <div class="ranking-info">
              <p class="ranking-name">Hambúrguer Artesanal</p>
              <div class="ranking-bar">
                <div class="ranking-bar-fill" style="width: 85%"></div>
              </div>
            </div>
            <div class="ranking-stats">
              <p class="ranking-count">41 vendas</p>
              <p class="ranking-value">R$ 1.640,00</p>
            </div>
          </div>

          <div class="ranking-item">
            <div class="ranking-position">3</div>
            <div class="ranking-info">
              <p class="ranking-name">Refrigerante 350ml</p>
              <div class="ranking-bar">
                <div class="ranking-bar-fill" style="width: 70%"></div>
              </div>
            </div>
            <div class="ranking-stats">
              <p class="ranking-count">34 vendas</p>
              <p class="ranking-value">R$ 204,00</p>
            </div>
          </div>

          <div class="ranking-item">
            <div class="ranking-position">4</div>
            <div class="ranking-info">
              <p class="ranking-name">Batata Frita</p>
              <div class="ranking-bar">
                <div class="ranking-bar-fill" style="width: 65%"></div>
              </div>
            </div>
            <div class="ranking-stats">
              <p class="ranking-count">31 vendas</p>
              <p class="ranking-value">R$ 465,00</p>
            </div>
          </div>

          <div class="ranking-item">
            <div class="ranking-position">5</div>
            <div class="ranking-info">
              <p class="ranking-name">Salada Caesar</p>
              <div class="ranking-bar">
                <div class="ranking-bar-fill" style="width: 55%"></div>
              </div>
            </div>
            <div class="ranking-stats">
              <p class="ranking-count">26 vendas</p>
              <p class="ranking-value">R$ 650,00</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Vendas por Período -->
      <div class="card">
        <div class="card-header">
          <h2>Vendas por Hora</h2>
          <button class="btn-icon">
            <Download :size="16" />
          </button>
        </div>
        <div class="chart-placeholder">
          <BarChart3 :size="48" color="#d1d5db" />
          <p>Gráfico de vendas por hora do dia</p>
        </div>
      </div>
    </div>

    <!-- Tabela de Relatório Detalhado -->
    <div class="card">
      <div class="card-header">
        <h2>Relatório Detalhado de Vendas</h2>
        <div class="header-actions">
          <button class="btn-secondary">
            <Filter :size="16" />
            Filtrar
          </button>
          <button class="btn-secondary">
            <Download :size="16" />
            Exportar CSV
          </button>
        </div>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Pedido</th>
              <th>Mesa</th>
              <th>Produtos</th>
              <th>Pagamento</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>24/10/2025 14:30</td>
              <td>#001</td>
              <td>Mesa 5</td>
              <td>3 itens</td>
              <td>Cartão</td>
              <td>R$ 85,00</td>
              <td><span class="badge success">Concluído</span></td>
            </tr>
            <tr>
              <td>24/10/2025 13:45</td>
              <td>#002</td>
              <td>Mesa 3</td>
              <td>5 itens</td>
              <td>PIX</td>
              <td>R$ 120,00</td>
              <td><span class="badge success">Concluído</span></td>
            </tr>
            <tr>
              <td>24/10/2025 12:20</td>
              <td>#003</td>
              <td>Mesa 7</td>
              <td>2 itens</td>
              <td>Dinheiro</td>
              <td>R$ 65,00</td>
              <td><span class="badge success">Concluído</span></td>
            </tr>
            <tr>
              <td>24/10/2025 11:15</td>
              <td>#004</td>
              <td>Mesa 2</td>
              <td>4 itens</td>
              <td>Cartão</td>
              <td>R$ 95,00</td>
              <td><span class="badge success">Concluído</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { 
  Search,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  BarChart3
} from 'lucide-vue-next'
</script>

<style scoped>
.reports-view {
  max-width: 1400px;
  margin: 0 auto;
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
  min-width: 200px;
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
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
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

.metric-change {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.metric-change.positive {
  color: #22c55e;
}

.metric-change.negative {
  color: #ef4444;
}

.metric-period {
  font-size: 0.75rem;
  color: #9ca3af;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  color: #4b5563;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: #e5e7eb;
}

.products-ranking {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.ranking-item:hover {
  background: #f3f4f6;
}

.ranking-position {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  color: white;
  font-weight: 700;
  border-radius: 8px;
  flex-shrink: 0;
}

.ranking-info {
  flex: 1;
  min-width: 0;
}

.ranking-name {
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.ranking-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.ranking-bar-fill {
  height: 100%;
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.ranking-stats {
  text-align: right;
}

.ranking-count {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0 0 0.25rem 0;
}

.ranking-value {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 2px dashed #d1d5db;
}

.chart-placeholder p {
  margin: 1rem 0 0 0;
  color: #9ca3af;
  font-size: 0.875rem;
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

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>