<template>
  <div class="order-tracking-container">
    <!-- Header -->
    <div class="tracking-header">
      <button @click="goBack" class="btn-back">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1>Acompanhar Pedido</h1>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando pedido...</p>
    </div>

    <!-- Order Found -->
    <div v-else-if="order" class="tracking-content">
      <!-- Order Info -->
      <div class="order-header">
        <div class="order-number">
          <span class="label">Pedido</span>
          <span class="number">#{{ order.id.slice(0, 8) }}</span>
        </div>
        <div class="order-table">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="8" width="18" height="12" rx="2" />
            <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
          </svg>
          <span>Mesa {{ tableNumber }}</span>
        </div>
      </div>

      <!-- Status Timeline -->
      <div class="status-timeline">
        <h3>Status do Pedido</h3>
        <div class="timeline">
          <div class="timeline-item" :class="{ active: true, completed: true }">
            <div class="timeline-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div class="timeline-content">
              <h4>Pedido Recebido</h4>
              <p>{{ formatDateTime(order.created_at) }}</p>
            </div>
          </div>

          <div class="timeline-item" :class="{ active: order.status === 'preparing' || order.status === 'ready', completed: order.status === 'ready' }">
            <div class="timeline-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div class="timeline-content">
              <h4>Em Preparação</h4>
              <p v-if="order.status === 'preparing'">Seu pedido está sendo preparado...</p>
              <p v-else-if="order.status === 'ready'">Pedido preparado!</p>
              <p v-else>Aguardando...</p>
            </div>
          </div>

          <div class="timeline-item" :class="{ active: order.status === 'ready', completed: order.status === 'delivered' }">
            <div class="timeline-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </div>
            <div class="timeline-content">
              <h4>Pronto para Servir</h4>
              <p v-if="order.status === 'ready'">Seu pedido está pronto!</p>
              <p v-else>Aguardando...</p>
            </div>
          </div>

          <div class="timeline-item" :class="{ active: order.status === 'delivered', completed: order.status === 'delivered' }">
            <div class="timeline-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div class="timeline-content">
              <h4>Entregue</h4>
              <p v-if="order.status === 'delivered'">Bom apetite!</p>
              <p v-else>Aguardando...</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Items -->
      <div class="order-items">
        <h3>Itens do Pedido</h3>
        <div 
          v-for="(item, idx) in order.itens" 
          :key="idx"
          class="item-card"
        >
          <div class="item-info">
            <span class="item-name">{{ item.nome }}</span>
            <span class="item-qty">x{{ item.quantidade }}</span>
          </div>
          <div class="item-price">R$ {{ formatPrice(item.subtotal) }}</div>
        </div>
      </div>

      <!-- Order Summary -->
      <div class="order-summary">
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
        <div class="summary-row">
          <span>Pagamento:</span>
          <span class="payment-badge">{{ getPaymentMethod(order.forma_pagamento) }}</span>
        </div>
      </div>

      <!-- Customer Info -->
      <div v-if="order.cliente_nome || order.observacoes" class="customer-info">
        <h3>Informações</h3>
        <div v-if="order.cliente_nome" class="info-row">
          <span class="info-label">Nome:</span>
          <span>{{ order.cliente_nome }}</span>
        </div>
        <div v-if="order.observacoes" class="info-row">
          <span class="info-label">Observações:</span>
          <span>{{ order.observacoes }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="tracking-actions">
        <button @click="callWaiter" class="btn-call">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          Chamar Garçom
        </button>
        <button @click="viewMenu" class="btn-menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          Ver Cardápio
        </button>
      </div>
    </div>

    <!-- No Order Found -->
    <div v-else class="no-order">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h3>Nenhum pedido encontrado</h3>
      <p>Não há pedidos ativos para esta mesa</p>
      <button @click="viewMenu" class="btn-primary">
        Fazer Pedido
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase, TABLES, subscribeToTable } from '@/services/supabase'

const router = useRouter()
const route = useRoute()

const tableId = route.params.tableId
const tableNumber = route.query.tableNumber || 'N/A'

const loading = ref(true)
const order = ref(null)
let subscription = null

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

const getPaymentMethod = (method) => {
  const methods = {
    'dinheiro': 'Dinheiro',
    'debito': 'Débito',
    'credito': 'Crédito',
    'pix': 'PIX'
  }
  return methods[method] || method
}

const loadOrder = async () => {
  loading.value = true

  try {
    // Buscar pedido ativo da mesa
    const { data, error } = await supabase
      .from(TABLES.PEDIDOS)
      .select('*')
      .eq('mesa_id', tableId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) throw error

    if (data && data.length > 0) {
      order.value = data[0]
      console.log('✅ Pedido carregado:', order.value.id)
      
      // Iniciar subscription para atualização em tempo real
      startRealtimeSubscription()
    } else {
      order.value = null
      console.log('⚠️ Nenhum pedido ativo encontrado')
    }
  } catch (error) {
    console.error('❌ Erro ao carregar pedido:', error)
  } finally {
    loading.value = false
  }
}

const startRealtimeSubscription = () => {
  if (subscription) return

  subscription = subscribeToTable(TABLES.PEDIDOS, (payload) => {
    console.log('🔄 Atualização do pedido:', payload)

    // Se for o pedido atual
    if (payload.new && payload.new.id === order.value?.id) {
      if (payload.eventType === 'UPDATE') {
        order.value = payload.new
        console.log('✅ Status do pedido atualizado:', payload.new.status)
      } else if (payload.eventType === 'DELETE') {
        order.value = null
        console.log('❌ Pedido removido')
      }
    }
  })

  console.log('✅ Subscription realtime iniciada')
}

const stopRealtimeSubscription = () => {
  if (subscription) {
    subscription()
    subscription = null
    console.log('🛑 Subscription realtime parada')
  }
}

const callWaiter = async () => {
  try {
    // Criar atividade para chamar garçom
    const { error } = await supabase
      .from(TABLES.ATIVIDADES)
      .insert({
        tipo: 'call_waiter',
        titulo: `Mesa ${tableNumber} chamou o garçom`,
        descricao: `Cliente da mesa ${tableNumber} solicitou atendimento`,
        mesa_id: tableId,
        pedido_id: order.value?.id,
        prioridade: 'high'
      })

    if (error) throw error

    alert('Garçom chamado! Aguarde, já vamos atendê-lo.')
    console.log('✅ Garçom chamado para mesa', tableNumber)
  } catch (error) {
    console.error('❌ Erro ao chamar garçom:', error)
    alert('Erro ao chamar garçom. Tente novamente.')
  }
}

const viewMenu = () => {
  router.push({
    name: 'client-menu',
    params: { tableId },
    query: { tableNumber }
  })
}

const goBack = () => {
  router.push({ name: 'qr-scanner' })
}

onMounted(() => {
  loadOrder()
})

onUnmounted(() => {
  stopRealtimeSubscription()
})
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.order-tracking-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
}

.tracking-header {
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

.btn-back {
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

.btn-back:hover {
  background: rgba(255, 255, 255, 0.3);
}

.tracking-header h1 {
  margin: 0;
  font-size: 1.5rem;
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

.tracking-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 1.5rem;
}

.order-header {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-number {
  display: flex;
  flex-direction: column;
}

.order-number .label {
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 600;
}

.order-number .number {
  color: #C41E3A;
  font-size: 1.5rem;
  font-weight: bold;
}

.order-table {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-weight: 600;
}

.status-timeline {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.status-timeline h3 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.1rem;
}

.timeline {
  position: relative;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 12px;
  top: 12px;
  bottom: 12px;
  width: 2px;
  background: #e5e7eb;
}

.timeline-item {
  position: relative;
  padding-left: 3rem;
  padding-bottom: 2rem;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-icon {
  position: absolute;
  left: 0;
  top: 0;
  width: 40px;
  height: 40px;
  background: #e5e7eb;
  color: #9ca3af;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.timeline-item.active .timeline-icon {
  background: #fbbf24;
  color: white;
  animation: pulse 2s ease-in-out infinite;
}

.timeline-item.completed .timeline-icon {
  background: #10b981;
  color: white;
  animation: none;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
}

.timeline-content h4 {
  margin: 0 0 0.25rem 0;
  color: #1f2937;
  font-size: 1rem;
}

.timeline-content p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.order-items,
.order-summary,
.customer-info {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.order-items h3,
.order-summary h3,
.customer-info h3 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.1rem;
}

.item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.item-card:last-child {
  border-bottom: none;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.item-name {
  color: #1f2937;
  font-weight: 500;
}

.item-qty {
  color: #6b7280;
  font-size: 0.875rem;
}

.item-price {
  color: #C41E3A;
  font-weight: 600;
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
  border-top: 2px solid #e5e7eb;
  padding-top: 1rem;
  margin-top: 0.5rem;
  font-size: 1.25rem;
  font-weight: bold;
  color: #1f2937;
}

.payment-badge {
  background: #C41E3A20;
  color: #C41E3A;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.info-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #6b7280;
  font-weight: 600;
  min-width: 100px;
}

.tracking-actions {
  display: flex;
  gap: 1rem;
}

.btn-call,
.btn-menu {
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-call {
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  color: white;
}

.btn-call:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
}

.btn-menu {
  background: #e5e7eb;
  color: #6b7280;
}

.btn-menu:hover {
  background: #d1d5db;
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

.no-order h3 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
}

.no-order p {
  margin: 0 0 1.5rem 0;
}

.btn-primary {
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
}

@media (max-width: 768px) {
  .tracking-content {
    padding: 1rem;
  }
  
  .tracking-actions {
    flex-direction: column;
  }
}
</style>