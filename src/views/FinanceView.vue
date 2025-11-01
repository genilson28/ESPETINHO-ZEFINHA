<template>
  <div class="finance-view">
    <div class="page-header">
      <h1>Financeiro</h1>
      <p>Gestão financeira e fluxo de caixa</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Carregando dados financeiros...</p>
    </div>

    <!-- Conteúdo Principal -->
    <div v-else>
      <!-- Cards de Resumo Financeiro -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: #dcfce7;">
            <DollarSign :size="24" color="#22c55e" />
          </div>
          <div class="stat-content">
            <p class="stat-label">Receita Hoje</p>
            <p class="stat-value">R$ {{ formatarValor(totaisHoje.entradas) }}</p>
            <p class="stat-change">{{ totaisHoje.qtdEntradas }} transações</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: #fee2e2;">
            <TrendingDown :size="24" color="#ef4444" />
          </div>
          <div class="stat-content">
            <p class="stat-label">Despesas Hoje</p>
            <p class="stat-value">R$ {{ formatarValor(totaisHoje.saidas) }}</p>
            <p class="stat-change">{{ totaisHoje.qtdSaidas }} transações</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: #dbeafe;">
            <TrendingUp :size="24" color="#3b82f6" />
          </div>
          <div class="stat-content">
            <p class="stat-label">Lucro Hoje</p>
            <p class="stat-value" :class="{ negative: totaisHoje.saldo < 0 }">
              R$ {{ formatarValor(totaisHoje.saldo) }}
            </p>
            <p class="stat-change" :class="{ positive: totaisHoje.saldo > 0, negative: totaisHoje.saldo < 0 }">
              {{ totaisHoje.saldo >= 0 ? 'Positivo' : 'Negativo' }}
            </p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: #f3e8ff;">
            <Wallet :size="24" color="#a855f7" />
          </div>
          <div class="stat-content">
            <p class="stat-label">Status do Caixa</p>
            <p class="stat-value" style="font-size: 1.25rem;">
              {{ caixaFechadoHoje ? 'Fechado' : 'Aberto' }}
            </p>
            <p class="stat-change" :class="{ positive: !caixaFechadoHoje, negative: caixaFechadoHoje }">
              {{ caixaFechadoHoje ? 'Não é possível adicionar transações' : 'Operacional' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Conteúdo Principal -->
      <div class="content-grid">
        <!-- Vendas por Forma de Pagamento -->
        <div class="card">
          <div class="card-header">
            <h2>Vendas por Forma de Pagamento</h2>
            <button class="btn-secondary" @click="exportarRelatorio">
              <Download :size="16" />
              Exportar
            </button>
          </div>
          <div class="payment-methods">
            <div v-if="pagamentosFormatados.length === 0" class="empty-message">
              <CreditCard :size="48" color="#d0d0d0" />
              <p>Nenhuma venda registrada hoje</p>
            </div>
            <div v-else class="payment-item" v-for="payment in pagamentosFormatados" :key="payment.id">
              <div class="payment-info">
                <CreditCard v-if="payment.id === 'credito' || payment.id === 'debito'" :size="20" color="#3b82f6" />
                <Banknote v-else-if="payment.id === 'dinheiro'" :size="20" color="#22c55e" />
                <Smartphone v-else-if="payment.id === 'pix'" :size="20" color="#a855f7" />
                <div>
                  <p class="payment-name">{{ payment.name }}</p>
                  <p class="payment-count">{{ payment.quantidade }} transações</p>
                </div>
              </div>
              <p class="payment-value">R$ {{ formatarValor(payment.total) }}</p>
            </div>
          </div>
        </div>

        <!-- Últimas Transações -->
        <div class="card">
          <div class="card-header">
            <h2>Últimas Transações</h2>
            <button class="btn-secondary" @click="buscarTransacoesHoje">
              <RefreshCw :size="16" />
              Atualizar
            </button>
          </div>
          <div class="transactions-list">
            <div v-if="transacoes.length === 0" class="empty-message">
              <ArrowDownLeft :size="48" color="#d0d0d0" />
              <p>Nenhuma transação hoje</p>
            </div>
            <div 
              v-else
              class="transaction-item" 
              v-for="transaction in transacoes.slice(0, 5)" 
              :key="transaction.id"
            >
              <div class="transaction-info">
                <div class="transaction-icon" :class="transaction.tipo">
                  <ArrowDownLeft v-if="transaction.tipo === 'entrada'" :size="16" />
                  <ArrowUpRight v-else :size="16" />
                </div>
                <div>
                  <p class="transaction-title">{{ transaction.titulo }}</p>
                  <p class="transaction-date">{{ formatarData(transaction.created_at) }}</p>
                </div>
              </div>
              <p class="transaction-value" :class="transaction.tipo">
                {{ transaction.tipo === 'entrada' ? '+' : '-' }}R$ {{ formatarValor(transaction.valor) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Ações Rápidas -->
      <div class="quick-actions">
        <button class="action-btn primary" @click="showIncomeModal = true" :disabled="caixaFechadoHoje">
          <Plus :size="20" />
          Nova Entrada
        </button>
        <button class="action-btn danger" @click="showExpenseModal = true" :disabled="caixaFechadoHoje">
          <Minus :size="20" />
          Nova Despesa
        </button>
        <button class="action-btn secondary" @click="showCloseCashModal = true" :disabled="caixaFechadoHoje">
          <FileText :size="20" />
          {{ caixaFechadoHoje ? 'Caixa Fechado' : 'Fechar Caixa' }}
        </button>
      </div>
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
        <form @submit.prevent="handleAdicionarEntrada" class="modal-form">
          <div class="form-group">
            <label for="incomeTitle">Descrição *</label>
            <input
              id="incomeTitle"
              v-model="newIncome.titulo"
              type="text"
              placeholder="Ex: Venda mesa 5, Recebimento cliente..."
              required
            />
          </div>

          <div class="form-group">
            <label for="incomeValue">Valor (R$) *</label>
            <input
              id="incomeValue"
              v-model="newIncome.valor"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              required
            />
          </div>

          <div class="form-group">
            <label for="incomeCategory">Categoria *</label>
            <select id="incomeCategory" v-model="newIncome.categoria" required>
              <option value="">Selecione uma categoria</option>
              <option value="venda">Venda</option>
              <option value="recebimento">Recebimento</option>
              <option value="outros">Outros</option>
            </select>
          </div>

          <div class="form-group">
            <label for="incomePaymentMethod">Forma de Pagamento *</label>
            <select id="incomePaymentMethod" v-model="newIncome.payment_method" required>
              <option value="">Selecione</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="credito">Cartão de Crédito</option>
              <option value="debito">Cartão de Débito</option>
              <option value="pix">PIX</option>
              <option value="transferencia">Transferência</option>
            </select>
          </div>

          <div class="form-group">
            <label for="incomeDescription">Observações</label>
            <textarea
              id="incomeDescription"
              v-model="newIncome.descricao"
              placeholder="Detalhes adicionais (opcional)"
              rows="2"
            ></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showIncomeModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn-confirm" :disabled="loading">
              <Check :size="16" />
              {{ loading ? 'Salvando...' : 'Adicionar Entrada' }}
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
        <form @submit.prevent="handleAdicionarSaida" class="modal-form">
          <div class="form-group">
            <label for="expenseTitle">Descrição *</label>
            <input
              id="expenseTitle"
              v-model="newExpense.titulo"
              type="text"
              placeholder="Ex: Compra de insumos, Pagamento fornecedor..."
              required
            />
          </div>

          <div class="form-group">
            <label for="expenseValue">Valor (R$) *</label>
            <input
              id="expenseValue"
              v-model="newExpense.valor"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              required
            />
          </div>

          <div class="form-group">
            <label for="expenseCategory">Categoria *</label>
            <select id="expenseCategory" v-model="newExpense.categoria" required>
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
            <label for="expensePaymentMethod">Forma de Pagamento *</label>
            <select id="expensePaymentMethod" v-model="newExpense.payment_method" required>
              <option value="">Selecione</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="credito">Cartão de Crédito</option>
              <option value="debito">Cartão de Débito</option>
              <option value="pix">PIX</option>
              <option value="transferencia">Transferência</option>
            </select>
          </div>

          <div class="form-group">
            <label for="expenseDescription">Observações</label>
            <textarea
              id="expenseDescription"
              v-model="newExpense.descricao"
              placeholder="Detalhes adicionais (opcional)"
              rows="2"
            ></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showExpenseModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn-confirm danger" :disabled="loading">
              <Check :size="16" />
              {{ loading ? 'Salvando...' : 'Adicionar Despesa' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Fechar Caixa -->
    <div v-if="showCloseCashModal" class="modal-overlay" @click="showCloseCashModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Fechamento de Caixa</h3>
          <button class="modal-close" @click="showCloseCashModal = false">
            <X :size="20" />
          </button>
        </div>
        
        <div class="closure-summary">
          <h4>Resumo do Dia</h4>
          
          <div class="summary-grid">
            <div class="summary-item">
              <span>Receitas do Dia:</span>
              <span class="positive">R$ {{ formatarValor(totaisHoje.entradas) }}</span>
            </div>
            <div class="summary-item">
              <span>Despesas do Dia:</span>
              <span class="negative">R$ {{ formatarValor(totaisHoje.saidas) }}</span>
            </div>
            <div class="summary-item total">
              <span>Saldo Final:</span>
              <span class="total-value" :class="{ negative: totaisHoje.saldo < 0 }">
                R$ {{ formatarValor(totaisHoje.saldo) }}
              </span>
            </div>
          </div>

          <div class="payment-breakdown" v-if="pagamentosFormatados.length > 0">
            <h5>Formas de Pagamento:</h5>
            <div class="payment-breakdown-item" v-for="payment in pagamentosFormatados" :key="payment.id">
              <span>{{ payment.name }}:</span>
              <span>R$ {{ formatarValor(payment.total) }}</span>
            </div>
          </div>
        </div>

        <form @submit.prevent="handleFecharCaixa" class="modal-form">
          <div class="form-group">
            <label for="closureNotes">Observações do Fechamento</label>
            <textarea
              id="closureNotes"
              v-model="closureNotes"
              placeholder="Observações sobre o fechamento do dia..."
              rows="3"
            ></textarea>
          </div>

          <div class="closure-info">
            <p><strong>Data:</strong> {{ new Date().toLocaleDateString('pt-BR') }}</p>
            <p><strong>Hora:</strong> {{ new Date().toLocaleTimeString('pt-BR') }}</p>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showCloseCashModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn-confirm warning" :disabled="loading">
              <Lock :size="16" />
              {{ loading ? 'Fechando...' : 'Confirmar Fechamento' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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
  Check,
  Lock,
  RefreshCw
} from 'lucide-vue-next'
import { useFinance } from '@/composables/useFinance'

// Composable financeiro
const {
  transacoes,
  loading,
  error,
  totaisHoje,
  caixaFechadoHoje,
  pagamentosFormatados,
  adicionarEntrada,
  adicionarSaida,
  fecharCaixa,
  formatarData,
  formatarValor,
  exportarRelatorio,
  buscarTransacoesHoje,
  inicializar
} = useFinance()

// Estados dos modais
const showIncomeModal = ref(false)
const showExpenseModal = ref(false)
const showCloseCashModal = ref(false)

// Dados para nova entrada
const newIncome = ref({
  titulo: '',
  valor: '',
  categoria: '',
  payment_method: '',
  descricao: ''
})

// Dados para nova despesa
const newExpense = ref({
  titulo: '',
  valor: '',
  categoria: '',
  payment_method: '',
  descricao: ''
})

// Observações do fechamento
const closureNotes = ref('')

// Funções de manipulação
const handleAdicionarEntrada = async () => {
  const result = await adicionarEntrada(newIncome.value)
  
  if (result.success) {
    alert('✅ Entrada registrada com sucesso!')
    
    // Limpar formulário
    newIncome.value = {
      titulo: '',
      valor: '',
      categoria: '',
      payment_method: '',
      descricao: ''
    }
    
    showIncomeModal.value = false
  } else {
    alert('❌ Erro ao registrar entrada: ' + result.error)
  }
}

const handleAdicionarSaida = async () => {
  const result = await adicionarSaida(newExpense.value)
  
  if (result.success) {
    alert('✅ Despesa registrada com sucesso!')
    
    // Limpar formulário
    newExpense.value = {
      titulo: '',
      valor: '',
      categoria: '',
      payment_method: '',
      descricao: ''
    }
    
    showExpenseModal.value = false
  } else {
    alert('❌ Erro ao registrar despesa: ' + result.error)
  }
}

const handleFecharCaixa = async () => {
  if (!confirm('⚠️ Tem certeza que deseja fechar o caixa? Esta ação não pode ser desfeita!')) {
    return
  }
  
  const result = await fecharCaixa(closureNotes.value || null)
  
  if (result.success) {
    alert(`✅ Caixa fechado com sucesso!\n\n💰 Saldo Final: R$ ${formatarValor(totaisHoje.value.saldo)}`)
    closureNotes.value = ''
    showCloseCashModal.value = false
  } else {
    alert('❌ Erro ao fechar caixa: ' + result.error)
  }
}

// Inicialização
onMounted(async () => {
  await inicializar()
})
</script>

<style scoped>
/* Mesmo estilo do arquivo original, apenas adicionando algumas classes novas */

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  gap: 1rem;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  gap: 1rem;
  color: #9ca3af;
}

.stat-value.negative,
.total-value.negative {
  color: #ef4444;
}

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

.transaction-icon.entrada {
  background: #dcfce7;
  color: #22c55e;
}

.transaction-icon.saida {
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

.transaction-value.entrada {
  color: #22c55e;
}

.transaction-value.saida {
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

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.action-btn.primary {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
}

.action-btn.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.action-btn.danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.action-btn.danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.action-btn.secondary {
  background: white;
  color: #4b5563;
  border: 1px solid #e5e7eb;
}

.action-btn.secondary:hover:not(:disabled) {
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

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.btn-confirm.danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.btn-confirm.danger:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-confirm.warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.btn-confirm.warning:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

/* Estilos específicos para o fechamento de caixa */
.closure-summary {
  background: #f8fafc;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 0 1.5rem 1.5rem 1.5rem;
}

.closure-summary h4 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.1rem;
}

.summary-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.summary-item.total {
  border-top: 2px solid #e5e7eb;
  margin-top: 0.5rem;
  padding-top: 1rem;
  font-weight: 700;
}

.total-value {
  font-size: 1.25rem;
  color: #059669;
}

.positive {
  color: #059669;
}

.negative {
  color: #dc2626;
}

.payment-breakdown {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}

.payment-breakdown h5 {
  margin: 0 0 0.75rem 0;
  color: #374151;
  font-size: 0.95rem;
}

.payment-breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  font-size: 0.875rem;
}

.closure-info {
  background: #f1f5f9;
  border-radius: 6px;
  padding: 1rem;
  margin: 1rem 0;
  font-size: 0.875rem;
}

.closure-info p {
  margin: 0.25rem 0;
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

  .closure-summary {
    margin: 0 1rem 1rem 1rem;
  }
}
</style>
