<template>
  <div class="finance-view">
    <div class="page-header">
      <h1>Financeiro</h1>
      <p>Gestão financeira e fluxo de caixa</p>
    </div>

    <!-- Cards de Resumo Financeiro -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: #dcfce7;">
          <DollarSign :size="24" color="#22c55e" />
        </div>
        <div class="stat-content">
          <p class="stat-label">Receita Hoje</p>
          <p class="stat-value">R$ 2.450,00</p>
          <p class="stat-change positive">+15% vs ontem</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #fee2e2;">
          <TrendingDown :size="24" color="#ef4444" />
        </div>
        <div class="stat-content">
          <p class="stat-label">Despesas Hoje</p>
          <p class="stat-value">R$ 680,00</p>
          <p class="stat-change negative">+5% vs ontem</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #dbeafe;">
          <TrendingUp :size="24" color="#3b82f6" />
        </div>
        <div class="stat-content">
          <p class="stat-label">Lucro Hoje</p>
          <p class="stat-value">R$ 1.770,00</p>
          <p class="stat-change positive">+18% vs ontem</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #f3e8ff;">
          <Wallet :size="24" color="#a855f7" />
        </div>
        <div class="stat-content">
          <p class="stat-label">Caixa Atual</p>
          <p class="stat-value">R$ 5.320,00</p>
          <p class="stat-change">Saldo disponível</p>
        </div>
      </div>
    </div>

    <!-- Conteúdo Principal -->
    <div class="content-grid">
      <!-- Vendas por Forma de Pagamento -->
      <div class="card">
        <div class="card-header">
          <h2>Vendas por Forma de Pagamento</h2>
          <button class="btn-secondary">
            <Download :size="16" />
            Exportar
          </button>
        </div>
        <div class="payment-methods">
          <div class="payment-item">
            <div class="payment-info">
              <CreditCard :size="20" color="#3b82f6" />
              <div>
                <p class="payment-name">Cartão de Crédito</p>
                <p class="payment-count">45 transações</p>
              </div>
            </div>
            <p class="payment-value">R$ 1.250,00</p>
          </div>

          <div class="payment-item">
            <div class="payment-info">
              <Banknote :size="20" color="#22c55e" />
              <div>
                <p class="payment-name">Dinheiro</p>
                <p class="payment-count">28 transações</p>
              </div>
            </div>
            <p class="payment-value">R$ 780,00</p>
          </div>

          <div class="payment-item">
            <div class="payment-info">
              <Smartphone :size="20" color="#a855f7" />
              <div>
                <p class="payment-name">PIX</p>
                <p class="payment-count">32 transações</p>
              </div>
            </div>
            <p class="payment-value">R$ 420,00</p>
          </div>
        </div>
      </div>

      <!-- Últimas Transações -->
      <div class="card">
        <div class="card-header">
          <h2>Últimas Transações</h2>
          <button class="btn-secondary">Ver Todas</button>
        </div>
        <div class="transactions-list">
          <div class="transaction-item">
            <div class="transaction-info">
              <div class="transaction-icon positive">
                <ArrowDownLeft :size="16" />
              </div>
              <div>
                <p class="transaction-title">Venda #001 - Mesa 5</p>
                <p class="transaction-date">Hoje às 14:30</p>
              </div>
            </div>
            <p class="transaction-value positive">+R$ 85,00</p>
          </div>

          <div class="transaction-item">
            <div class="transaction-info">
              <div class="transaction-icon negative">
                <ArrowUpRight :size="16" />
              </div>
              <div>
                <p class="transaction-title">Compra de Insumos</p>
                <p class="transaction-date">Hoje às 10:15</p>
              </div>
            </div>
            <p class="transaction-value negative">-R$ 320,00</p>
          </div>

          <div class="transaction-item">
            <div class="transaction-info">
              <div class="transaction-icon positive">
                <ArrowDownLeft :size="16" />
              </div>
              <div>
                <p class="transaction-title">Venda #002 - Mesa 3</p>
                <p class="transaction-date">Hoje às 13:45</p>
              </div>
            </div>
            <p class="transaction-value positive">+R$ 120,00</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Ações Rápidas -->
    <div class="quick-actions">
      <button class="action-btn primary">
        <Plus :size="20" />
        Nova Entrada
      </button>
      <button class="action-btn danger">
        <Minus :size="20" />
        Nova Despesa
      </button>
      <button class="action-btn secondary">
        <FileText :size="20" />
        Fechar Caixa
      </button>
    </div>
  </div>
</template>

<script setup>
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  CreditCard,
  Banknote,
  Smartphone,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Minus,
  FileText
} from 'lucide-vue-next'
</script>

<style scoped>
.finance-view {
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.25rem 0;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.stat-change {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.stat-change.positive {
  color: #22c55e;
}

.stat-change.negative {
  color: #ef4444;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
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

.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.payment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.payment-item:hover {
  background: #f3f4f6;
}

.payment-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.payment-name {
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.payment-count {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.payment-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.transaction-item:hover {
  background: #f3f4f6;
}

.transaction-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.transaction-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.transaction-icon.positive {
  background: #dcfce7;
  color: #22c55e;
}

.transaction-icon.negative {
  background: #fee2e2;
  color: #ef4444;
}

.transaction-title {
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.transaction-date {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.transaction-value {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
}

.transaction-value.positive {
  color: #22c55e;
}

.transaction-value.negative {
  color: #ef4444;
}

.quick-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.primary {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.action-btn.danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.action-btn.danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.action-btn.secondary {
  background: white;
  color: #4b5563;
  border: 1px solid #e5e7eb;
}

.action-btn.secondary:hover {
  background: #f9fafb;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>