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
          <p class="stat-value">R$ {{ formatCurrency(totals.revenue) }}</p>
          <p class="stat-change positive">+15% vs ontem</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #fee2e2;">
          <TrendingDown :size="24" color="#ef4444" />
        </div>
        <div class="stat-content">
          <p class="stat-label">Despesas Hoje</p>
          <p class="stat-value">R$ {{ formatCurrency(totals.expenses) }}</p>
          <p class="stat-change negative">+5% vs ontem</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #dbeafe;">
          <TrendingUp :size="24" color="#3b82f6" />
        </div>
        <div class="stat-content">
          <p class="stat-label">Lucro Hoje</p>
          <p class="stat-value">R$ {{ formatCurrency(totals.profit) }}</p>
          <p class="stat-change positive">+18% vs ontem</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #f3e8ff;">
          <Wallet :size="24" color="#a855f7" />
        </div>
        <div class="stat-content">
          <p class="stat-label">Caixa Atual</p>
          <p class="stat-value">R$ {{ formatCurrency(totals.cash) }}</p>
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
          <div class="payment-item" v-for="payment in paymentMethods" :key="payment.id">
            <div class="payment-info">
              <CreditCard v-if="payment.id === 'credit'" :size="20" color="#3b82f6" />
              <Banknote v-else-if="payment.id === 'cash'" :size="20" color="#22c55e" />
              <Smartphone v-else-if="payment.id === 'pix'" :size="20" color="#a855f7" />
              <div>
                <p class="payment-name">{{ payment.name }}</p>
                <p class="payment-count">{{ payment.transactions }} transações</p>
              </div>
            </div>
            <p class="payment-value">R$ {{ formatCurrency(payment.value) }}</p>
          </div>
        </div>
      </div>

      <!-- Últimas Transações -->
      <div class="card">
        <div class="card-header">
          <h2>Últimas Transações</h2>
          <button class="btn-secondary" @click="showAllTransactions = true">Ver Todas</button>
        </div>
        <div class="transactions-list">
          <div 
            class="transaction-item" 
            v-for="transaction in recentTransactions" 
            :key="transaction.id"
          >
            <div class="transaction-info">
              <div class="transaction-icon" :class="transaction.type">
                <ArrowDownLeft v-if="transaction.type === 'positive'" :size="16" />
                <ArrowUpRight v-else :size="16" />
              </div>
              <div>
                <p class="transaction-title">{{ transaction.title }}</p>
                <p class="transaction-date">{{ formatDate(transaction.date) }}</p>
              </div>
            </div>
            <p class="transaction-value" :class="transaction.type">
              {{ transaction.type === 'positive' ? '+' : '-' }}R$ {{ formatCurrency(transaction.value) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Ações Rápidas -->
    <div class="quick-actions">
      <button class="action-btn primary" @click="showIncomeModal = true">
        <Plus :size="20" />
        Nova Entrada
      </button>
      <button class="action-btn danger" @click="showExpenseModal = true">
        <Minus :size="20" />
        Nova Despesa
      </button>
      <button class="action-btn secondary">
        <FileText :size="20" />
        Fechar Caixa
      </button>
    </div>

    <!-- Modal Nova Entrada -->
    <div v-if="showIncomeModal" class="modal-overlay" @click="showIncomeModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Nova Entrada</h3>
          <button class="modal-close" @click="showIncomeModal = false">
            <X :size="20" />
          </button>
        </div>
        <form @submit.prevent="addIncome" class="modal-form">
          <div class="form-group">
            <label for="incomeTitle">Descrição</label>
            <input
              id="incomeTitle"
              v-model="newIncome.title"
              type="text"
              placeholder="Ex: Venda mesa 5, Recebimento cliente..."
              required
            />
          </div>

          <div class="form-group">
            <label for="incomeValue">Valor (R$)</label>
            <input
              id="incomeValue"
              v-model="newIncome.value"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              required
            />
          </div>

          <div class="form-group">
            <label for="incomeCategory">Categoria</label>
            <select id="incomeCategory" v-model="newIncome.category" required>
              <option value="">Selecione uma categoria</option>
              <option value="venda">Venda</option>
              <option value="servico">Serviço</option>
              <option value="recebimento">Recebimento</option>
              <option value="outros">Outros</option>
            </select>
          </div>

          <div class="form-group">
            <label for="incomePaymentMethod">Forma de Pagamento</label>
            <select id="incomePaymentMethod" v-model="newIncome.paymentMethod" required>
              <option value="">Selecione</option>
              <option value="cash">Dinheiro</option>
              <option value="credit">Cartão de Crédito</option>
              <option value="debit">Cartão de Débito</option>
              <option value="pix">PIX</option>
              <option value="transfer">Transferência</option>
            </select>
          </div>

          <div class="form-group">
            <label for="incomeDate">Data</label>
            <input
              id="incomeDate"
              v-model="newIncome.date"
              type="datetime-local"
              required
            />
          </div>

          <div class="form-group">
            <label for="incomeNotes">Observações</label>
            <textarea
              id="incomeNotes"
              v-model="newIncome.notes"
              placeholder="Observações adicionais..."
              rows="3"
            ></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showIncomeModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn-confirm">
              <Check :size="16" />
              Adicionar Entrada
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Nova Despesa -->
    <div v-if="showExpenseModal" class="modal-overlay" @click="showExpenseModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Nova Despesa</h3>
          <button class="modal-close" @click="showExpenseModal = false">
            <X :size="20" />
          </button>
        </div>
        <form @submit.prevent="addExpense" class="modal-form">
          <div class="form-group">
            <label for="expenseTitle">Descrição</label>
            <input
              id="expenseTitle"
              v-model="newExpense.title"
              type="text"
              placeholder="Ex: Compra de insumos, Pagamento fornecedor..."
              required
            />
          </div>

          <div class="form-group">
            <label for="expenseValue">Valor (R$)</label>
            <input
              id="expenseValue"
              v-model="newExpense.value"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              required
            />
          </div>

          <div class="form-group">
            <label for="expenseCategory">Categoria</label>
            <select id="expenseCategory" v-model="newExpense.category" required>
              <option value="">Selecione uma categoria</option>
              <option value="insumos">Insumos</option>
              <option value="fornecedor">Fornecedor</option>
              <option value="funcionarios">Funcionários</option>
              <option value="aluguel">Aluguel</option>
              <option value="contas">Contas (água, luz, internet)</option>
              <option value="manutencao">Manutenção</option>
              <option value="outros">Outros</option>
            </select>
          </div>

          <div class="form-group">
            <label for="expensePaymentMethod">Forma de Pagamento</label>
            <select id="expensePaymentMethod" v-model="newExpense.paymentMethod" required>
              <option value="">Selecione</option>
              <option value="cash">Dinheiro</option>
              <option value="credit">Cartão de Crédito</option>
              <option value="debit">Cartão de Débito</option>
              <option value="pix">PIX</option>
              <option value="transfer">Transferência</option>
            </select>
          </div>

          <div class="form-group">
            <label for="expenseDate">Data</label>
            <input
              id="expenseDate"
              v-model="newExpense.date"
              type="datetime-local"
              required
            />
          </div>

          <div class="form-group">
            <label for="expenseSupplier">Fornecedor (opcional)</label>
            <input
              id="expenseSupplier"
              v-model="newExpense.supplier"
              type="text"
              placeholder="Nome do fornecedor..."
            />
          </div>

          <div class="form-group">
            <label for="expenseNotes">Observações</label>
            <textarea
              id="expenseNotes"
              v-model="newExpense.notes"
              placeholder="Observações adicionais..."
              rows="3"
            ></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showExpenseModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn-confirm danger">
              <Check :size="16" />
              Adicionar Despesa
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
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
  FileText,
  X,
  Check
} from 'lucide-vue-next'

// Estados dos modais
const showIncomeModal = ref(false)
const showExpenseModal = ref(false)
const showAllTransactions = ref(false)

// Dados para nova entrada
const newIncome = reactive({
  title: '',
  value: '',
  category: '',
  paymentMethod: '',
  date: new Date().toISOString().slice(0, 16),
  notes: ''
})

// Dados para nova despesa
const newExpense = reactive({
  title: '',
  value: '',
  category: '',
  paymentMethod: '',
  date: new Date().toISOString().slice(0, 16),
  supplier: '',
  notes: ''
})

// Dados das transações (em um sistema real, viria de uma API)
const transactions = ref([
  {
    id: 1,
    title: 'Venda #001 - Mesa 5',
    value: 85.00,
    type: 'positive',
    date: new Date().toISOString(),
    category: 'venda',
    paymentMethod: 'cash'
  },
  {
    id: 2,
    title: 'Compra de Insumos',
    value: 320.00,
    type: 'negative',
    date: new Date().toISOString(),
    category: 'insumos',
    paymentMethod: 'pix'
  },
  {
    id: 3,
    title: 'Venda #002 - Mesa 3',
    value: 120.00,
    type: 'positive',
    date: new Date().toISOString(),
    category: 'venda',
    paymentMethod: 'credit'
  }
])

// Computed para totais
const totals = computed(() => {
  const today = new Date().toDateString()
  
  const todayTransactions = transactions.value.filter(t => 
    new Date(t.date).toDateString() === today
  )

  const revenue = todayTransactions
    .filter(t => t.type === 'positive')
    .reduce((sum, t) => sum + t.value, 0)

  const expenses = todayTransactions
    .filter(t => t.type === 'negative')
    .reduce((sum, t) => sum + t.value, 0)

  const profit = revenue - expenses
  const cash = 5320.00 // Este valor viria do banco de dados

  return {
    revenue,
    expenses,
    profit,
    cash
  }
})

// Computed para métodos de pagamento
const paymentMethods = computed(() => {
  const today = new Date().toDateString()
  const todayTransactions = transactions.value.filter(t => 
    new Date(t.date).toDateString() === today && t.type === 'positive'
  )

  const methods = {
    cash: { name: 'Dinheiro', value: 0, transactions: 0 },
    credit: { name: 'Cartão de Crédito', value: 0, transactions: 0 },
    pix: { name: 'PIX', value: 0, transactions: 0 }
  }

  todayTransactions.forEach(transaction => {
    if (methods[transaction.paymentMethod]) {
      methods[transaction.paymentMethod].value += transaction.value
      methods[transaction.paymentMethod].transactions += 1
    }
  })

  return Object.entries(methods).map(([id, data]) => ({
    id,
    ...data
  }))
})

// Computed para transações recentes
const recentTransactions = computed(() => {
  return transactions.value
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
})

// Funções
const formatCurrency = (value) => {
  return parseFloat(value).toFixed(2).replace('.', ',')
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const today = new Date().toDateString()
  const transactionDate = date.toDateString()

  if (today === transactionDate) {
    return `Hoje às ${date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`
  } else {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

const addIncome = () => {
  const newTransaction = {
    id: Date.now(),
    title: newIncome.title,
    value: parseFloat(newIncome.value),
    type: 'positive',
    date: newIncome.date,
    category: newIncome.category,
    paymentMethod: newIncome.paymentMethod,
    notes: newIncome.notes
  }

  transactions.value.unshift(newTransaction)
  
  // Limpar formulário
  Object.keys(newIncome).forEach(key => {
    if (key !== 'date') {
      newIncome[key] = ''
    } else {
      newIncome.date = new Date().toISOString().slice(0, 16)
    }
  })
  
  showIncomeModal.value = false
}

const addExpense = () => {
  const newTransaction = {
    id: Date.now(),
    title: newExpense.title,
    value: parseFloat(newExpense.value),
    type: 'negative',
    date: newExpense.date,
    category: newExpense.category,
    paymentMethod: newExpense.paymentMethod,
    supplier: newExpense.supplier,
    notes: newExpense.notes
  }

  transactions.value.unshift(newTransaction)
  
  // Limpar formulário
  Object.keys(newExpense).forEach(key => {
    if (key !== 'date') {
      newExpense[key] = ''
    } else {
      newExpense.date = new Date().toISOString().slice(0, 16)
    }
  })
  
  showExpenseModal.value = false
}

// Inicialização
onMounted(() => {
  // Em um sistema real, aqui você buscaria os dados do banco de dados
  console.log('Financeiro carregado')
})
</script>

<style scoped>
.finance-view {
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

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.modal-close:hover {
  background: #f3f4f6;
}

.modal-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-confirm {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.btn-confirm.danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.btn-confirm.danger:hover {
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
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

  .modal-actions {
    flex-direction: column;
  }

  .btn-cancel,
  .btn-confirm {
    width: 100%;
    justify-content: center;
  }
}
</style>
