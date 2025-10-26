<template>
  <div class="order-details-container">
    <!-- Header -->
    <div class="details-header">
      <button @click="goBack" class="btn-back">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1>Detalhes do Pedido</h1>
      <div class="header-actions">
        <button @click="printOrder" class="btn-icon" title="Imprimir">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando pedido...</p>
    </div>

    <!-- Order Content -->
    <div v-else-if="order" class="details-content">
      <!-- Order Info Card -->
      <div class="info-card">
        <div class="info-header">
          <div>
            <h2>Pedido #{{ order.id.slice(0, 8) }}</h2>
            <p class="created-date">{{ formatDateTime(order.created_at) }}</p>
          </div>
          <div class="status-badge" :class="`status-${order.status}`">
            {{ getStatusLabel(order.status) }}
          </div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="8" width="18" height="12" rx="2" />
              <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
            </svg>
            <div>
              <span class="info-label">Mesa</span>
              <span class="info-value">Mesa {{ getTableNumber(order.mesa_id) }}</span>
            </div>
          </div>

          <div class="info-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <div>
              <span class="info-label">Cliente</span>
              <span class="info-value">{{ order.cliente_nome || 'Não informado' }}</span>
            </div>
          </div>

          <div class="info-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="4" width="22" height="16" rx="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            <div>
              <span class="info-label">Pagamento</span>
              <span class="info-value">{{ getPaymentMethod(order.forma_pagamento) }}</span>
            </div>
          </div>

          <div class="info-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <div>
              <span class="info-label">Origem</span>
              <span class="info-value">{{ order.origem === 'cliente' ? 'Cliente (QR Code)' : 'Garçom' }}</span>
            </div>
          </div>
        </div>

        <div v-if="order.observacoes" class="observations">
          <h4>Observações:</h4>
          <p>{{ order.observacoes }}</p>
        </div>
      </div>

      <!-- Items List -->
      <div class="items-card">
        <h3>Itens do Pedido</h3>
        <div class="items-table">
          <div class="table-header">
            <span>Produto</span>
            <span>Qtd</span>
            <span>Unit.</span>
            <span>Subtotal</span>
          </div>
          <div 
            v-for="(item, idx) in order.itens" 
            :key="idx"
            class="table-row"
          >
            <span class="item-name">{{ item.nome }}</span>
            <span class="item-qty">{{ item.quantidade }}</span>
            <span class="item-unit">R$ {{ formatPrice(item.preco_unitario) }}</span>
            <span class="item-subtotal">R$ {{ formatPrice(item.subtotal) }}</span>
          </div>
        </div>
      </div>

      <!-- Summary Card -->
      <div class="summary-card">
        <h3>Resumo do Pedido</h3>
        <div class="summary-rows">
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>R$ {{ formatPrice(order.valor_total + (order.desconto || 0)) }}</span>
          </div>
          <div v-if="order.desconto > 0" class="summary-row discount">
            <span>Desconto:</span>
            <span>-R$ {{ formatPrice(order.desconto) }}</span>
          </div>
          <div class="summary-row total">
            <span>Total:</span>
            <span>R$ {{ formatPrice(order.valor_total) }}</span>
          </div>
        </div>
      </div>

      <!-- Status Actions -->
      <div class="actions-card">
        <h3>Ações</h3>
        <div class="actions-grid">
          <button 
            v-if="order.status === 'active'"
            @click="updateStatus('preparing')"
            class="btn-action preparing"
            :disabled="updating"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            Iniciar Preparo
          </button>

          <button 
            v-if="order.status === 'preparing'"
            @click="updateStatus('ready')"
            class="btn-action ready"
            :disabled="updating"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Marcar como Pronto
          </button>

          <button 
            v-if="order.status === 'ready'"
            @click="updateStatus('delivered')"
            class="btn-action delivered"
            :disabled="updating"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            Entregar Pedido
          </button>

          <button 
            v-if="order.status === 'active' || order.status === 'preparing'"
            @click="cancelOrder"
            class="btn-action cancel"
            :disabled="updating"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Cancelar Pedido
          </button>

          <button 
            v-if="order.status === 'delivered'"
            @click="goToCloseOrder"
            class="btn-action close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 9l6 6M15 9l-6 6"/>
            </svg>
            Fechar Comanda
          </button>
        </div>
      </div>

      <!-- Timeline (opcional) -->
      <div class="timeline-card">
        <h3>Histórico</h3>
        <div class="timeline">
          <div class="timeline-item completed">
            <div class="timeline-icon">✓</div>
            <div class="timeline-content">
              <h4>Pedido Criado</h4>
              <p>{{ formatDateTime(order.created_at) }}</p>
            </div>
          </div>
          <div v-if="order.status !== 'active'" class="timeline-item completed">
            <div class="timeline-icon">✓</div>
            <div class="timeline-content">
              <h4>Em Preparação</h4>
              <p>Pedido sendo preparado</p>
            </div>
          </div>
          <div v-if="order.status === 'ready' || order.status === 'delivered'" class="timeline-item completed">
            <div class="timeline-icon">✓</div>
            <div class="timeline-content">
              <h4>Pronto</h4>
              <p>Pedido pronto para servir</p>
            </div>
          </div>
          <div v-if="order.status === 'delivered'" class="timeline-item completed">
            <div class="timeline-icon">✓</div>
            <div class="timeline-content">
              <h4>Entregue</h4>
              <p>Pedido entregue ao cliente</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Order Found -->
    <div v-else class="no-order">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p>Pedido não encontrado</p>
      <button @click="goBack" class="btn-primary">Voltar</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase, TABLES } from '@/services/supabase'
import { syncService } from '@/services/syncService'

const router = useRouter()
const route = useRoute()

const orderId = route.params.orderId
const order = ref(null)
const tables = ref([])
const loading = ref(true)
const updating = ref(false)

const formatPrice = (price) => {
  return parseFloat(price).toFixed(2).replace('.', ',')
}

const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTableNumber = (tableId) => {
  const table = tables.value.find(t => t.id === tableId)
  return table?.numero || 'N/A'
}

const getPaymentMethod = (method) => {
  const methods = {
    'dinheiro': 'Dinheiro',
    'debito': 'Débito',
    'credito': 'Crédito',
    'pix': 'PIX'
  }
  return methods[method] || method
}

const getStatusLabel = (status) => {
  const labels = {
    'active': 'Novo',
    'preparing': 'Preparando',
    'ready': 'Pronto',
    'delivered': 'Entregue',
    'closed': 'Fechado',
    'cancelled': 'Cancelado'
  }
  return labels[status] || status
}

const loadOrder = async () => {
  loading.value = true

  try {
    // Buscar pedido
    const { data: orderData, error: orderError } = await supabase
      .from(TABLES.PEDIDOS)
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError) throw orderError
    order.value = orderData

    // Buscar mesas
    const { data: tablesData, error: tablesError } = await supabase
      .from(TABLES.MESAS)
      .select('*')

    if (tablesError) throw tablesError
    tables.value = tablesData || []

    console.log('✅ Pedido carregado:', order.value.id)
  } catch (error) {
    console.error('❌ Erro ao carregar pedido:', error)
    order.value = null
  } finally {
    loading.value = false
  }
}

const updateStatus = async (newStatus) => {
  if (!confirm(`Confirmar mudança de status para "${getStatusLabel(newStatus)}"?`)) {
    return
  }

  updating.value = true

  try {
    const result = await syncService.update(TABLES.PEDIDOS, orderId, {
      status: newStatus
    })

    if (result.offline) {
      alert('Atualização será sincronizada quando voltar online')
    }

    // Atualizar localmente
    order.value.status = newStatus

    // Criar atividade
    await syncService.insert(TABLES.ATIVIDADES, {
      tipo: 'status_change',
      titulo: `Pedido #${orderId.slice(0, 8)} - ${getStatusLabel(newStatus)}`,
      descricao: `Status alterado para: ${getStatusLabel(newStatus)}`,
      pedido_id: orderId,
      mesa_id: order.value.mesa_id,
      prioridade: 'normal'
    })

    console.log(`✅ Status atualizado para: ${newStatus}`)
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error)
    alert('Erro ao atualizar status. Tente novamente.')
  } finally {
    updating.value = false
  }
}

const cancelOrder = async () => {
  const motivo = prompt('Motivo do cancelamento:')
  if (!motivo) return

  updating.value = true

  try {
    const result = await syncService.update(TABLES.PEDIDOS, orderId, {
      status: 'cancelled'
    })

    if (result.offline) {
      alert('Cancelamento será sincronizado quando voltar online')
    }

    // Criar atividade
    await syncService.insert(TABLES.ATIVIDADES, {
      tipo: 'cancel_order',
      titulo: `Pedido #${orderId.slice(0, 8)} cancelado`,
      descricao: `Motivo: ${motivo}`,
      pedido_id: orderId,
      mesa_id: order.value.mesa_id,
      prioridade: 'high'
    })

    // Liberar mesa
    await syncService.update(TABLES.MESAS, order.value.mesa_id, {
      status: 'available',
      pedido_atual_id: null
    })

    alert('Pedido cancelado com sucesso!')
    router.push({ name: 'staff-orders' })
  } catch (error) {
    console.error('❌ Erro ao cancelar pedido:', error)
    alert('Erro ao cancelar pedido. Tente novamente.')
  } finally {
    updating.value = false
  }
}

const goToCloseOrder = () => {
  router.push({
    name: 'closeOrder',
    params: { idMesa: order.value.mesa_id }
  })
}

const printOrder = () => {
  window.print()
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  loadOrder()
})
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.order-details-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  padding-bottom: 2rem;
}

.details-header {
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  color: white;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
}

.btn-back,
.btn-icon {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 8px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.btn-back:hover,
.btn-icon:hover {
  background: rgba(255, 255, 255, 0.3);
}

.details-header h1 {
  margin: 0;
  font-size: 1.5rem;
  flex: 1;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #C41E3A;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.details-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-card,
.items-card,
.summary-card,
.actions-card,
.timeline-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.info-header h2 {
  margin: 0 0 0.25rem 0;
  color: #1f2937;
  font-size: 1.75rem;
}

.created-date {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
}

.status-badge.status-active {
  background: #3b82f620;
  color: #3b82f6;
}

.status-badge.status-preparing {
  background: #f59e0b20;
  color: #f59e0b;
}

.status-badge.status-ready {
  background: #10b98120;
  color: #10b981;
}

.status-badge.status-delivered {
  background: #8b5cf620;
  color: #8b5cf6;
}

.status-badge.status-cancelled {
  background: #ef444420;
  color: #ef4444;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.info-item svg {
  color: #C41E3A;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.info-item div {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 600;
}

.info-value {
  color: #1f2937;
  font-weight: 500;
}

.observations {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  border-left: 3px solid #C41E3A;
}

.observations h4 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 0.875rem;
  font-weight: 600;
}

.observations p {
  margin: 0;
  color: #6b7280;
  line-height: 1.6;
}

.items-card h3,
.summary-card h3,
.actions-card h3,
.timeline-card h3 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.1rem;
}

.items-table {
  display: flex;
  flex-direction: column;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 0.75rem 0;
}

.table-header {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.875rem;
  border-bottom: 2px solid #e5e7eb;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-row {
  border-bottom: 1px solid #e5e7eb;
  color: #1f2937;
}

.table-row:last-child {
  border-bottom: none;
}

.item-name {
  font-weight: 500;
}

.item-subtotal {
  font-weight: 600;
  color: #C41E3A;
}

.summary-rows {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  color: #6b7280;
}

.summary-row.discount span:last-child {
  color: #10b981;
}

.summary-row.total {
  border-top: 2px solid #C41E3A;
  padding-top: 1rem;
  margin-top: 0.5rem;
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.btn-action {
  padding: 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  color: white;
}

.btn-action:hover:not(:disabled) {
  transform: translateY(-2px);
  opacity: 0.9;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-action.preparing {
  background: #f59e0b;
}

.btn-action.ready {
  background: #10b981;
}

.btn-action.delivered {
  background: #8b5cf6;
}

.btn-action.cancel {
  background: #ef4444;
}

.btn-action.close {
  background: #1f2937;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 15px;
  bottom: 15px;
  width: 2px;
  background: #e5e7eb;
}

.timeline-item {
  display: flex;
  gap: 1rem;
  position: relative;
}

.timeline-icon {
  width: 32px;
  height: 32px;
  background: #e5e7eb;
  color: #9ca3af;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.timeline-item.completed .timeline-icon {
  background: #10b981;
  color: white;
}

.timeline-content h4 {
  margin: 0 0 0.25rem 0;
  color: #1f2937;
}

.timeline-content p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.no-order {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #6b7280;
}

.no-order svg {
  opacity: 0.5;
  margin-bottom: 1rem;
}

.btn-primary {
  background: #C41E3A;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .details-content {
    padding: 1rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .table-header,
  .table-row {
    grid-template-columns: 2fr 1fr 1.5fr;
  }

  .item-unit {
    display: none;
  }
}

@media print {
  .details-header,
  .actions-card,
  .btn-back,
  .btn-icon {
    display: none !important;
  }

  .details-content {
    padding: 1rem;
  }
}
</style>