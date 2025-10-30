<template>
  <div class="kds-2025">
    <!-- HEADER -->
    <header class="kds-header-2025">
      <div class="header-brand">
        <div class="logo-wrapper">
          <div class="logo-icon">🍽️</div>
          <div class="logo-text">
            <span class="logo-primary">Kitchen Display</span>
            <span class="logo-secondary">System 2025</span>
          </div>
        </div>
        
        <div class="time-display">
          <div class="time">{{ currentTime }}</div>
          <div class="date">{{ currentDate }}</div>
        </div>
      </div>

      <div class="status-indicators">
        <div class="indicator new">
          <div class="indicator-badge">{{ statusCounts.new }}</div>
          <span>Novos</span>
        </div>
        <div class="indicator preparing">
          <div class="indicator-badge">{{ statusCounts.preparing }}</div>
          <span>Preparando</span>
        </div>
        <div class="indicator ready">
          <div class="indicator-badge">{{ statusCounts.ready }}</div>
          <span>Prontos</span>
        </div>
      </div>

      <div class="header-actions">
        <button class="btn-action refresh" @click="refreshOrders" :disabled="loading">
          <span :class="{ spinning: loading }">🔄</span>
        </button>
        <button class="btn-action logout" @click="voltarParaDashboard">
          <span>🚪</span>
        </button>
      </div>
    </header>

    <!-- ORDERS GRID -->
    <div class="orders-grid-2025">
      <!-- Loading State -->
      <div v-if="loading && orders.length === 0" class="empty-state-2025">
        <div class="loading-spinner-2025"></div>
        <h3>Carregando pedidos...</h3>
      </div>

      <!-- Empty State -->
      <div v-else-if="orders.length === 0" class="empty-state-2025">
        <div class="empty-icon">📋</div>
        <h3>Nenhum pedido ativo</h3>
        <p>Os pedidos aparecerão aqui quando chegarem</p>
      </div>

      <!-- Order Cards -->
      <div
        v-for="order in orders"
        :key="order.id"
        :class="[
          'order-card-2025',
          `status-${order.status}`,
          { urgent: order.isUrgent }
        ]"
      >
        <!-- Card Header -->
        <div class="card-header-2025">
          <div class="order-number">#{{ order.id }}</div>
          <div v-if="order.mesa_numero" class="order-table">
            🪑 Mesa {{ order.mesa_numero }}
          </div>
          <div :class="['order-time', { urgent: order.isUrgent }]">
            {{ order.elapsedTime }}
          </div>
        </div>

        <!-- Order Items -->
        <div class="order-items-2025">
          <div v-for="item in order.items" :key="item.id" class="item-2025">
            <div class="item-quantity">{{ item.quantity }}x</div>
            <div class="item-name">{{ item.product_name }}</div>
            <div class="item-dot" :style="{ background: getItemColor(item) }"></div>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="card-footer-2025">
          <div :class="['status-tag', `badge-${order.status}`]">
            {{ statusLabels[order.status] }}
          </div>

          <button
            v-if="order.status === 'pending'"
            class="action-btn-2025 action-start"
            @click="startOrder(order.id)"
            :disabled="processingOrders[order.id]"
          >
            <span v-if="processingOrders[order.id]" class="btn-spinner"></span>
            <span v-else>▶️ Iniciar</span>
          </button>

          <button
            v-else-if="order.status === 'active'"
            class="action-btn-2025 action-finish"
            @click="finishOrder(order.id)"
            :disabled="processingOrders[order.id]"
          >
            <span v-if="processingOrders[order.id]" class="btn-spinner"></span>
            <span v-else>✓ Finalizar</span>
          </button>

          <button
            v-else-if="order.status === 'ready'"
            class="action-btn-2025 action-complete"
            @click="completeOrder(order.id)"
            :disabled="processingOrders[order.id]"
          >
            <span v-if="processingOrders[order.id]" class="btn-spinner"></span>
            <span v-else>✓ Entregar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <transition name="toast-2025">
      <div v-if="toast.show" :class="['toast-2025', toast.type]">
        <span class="toast-icon">{{ toast.icon }}</span>
        <span>{{ toast.message }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, TABLES } from '@/services/supabase'

const router = useRouter()

// State
const currentTime = ref('')
const currentDate = ref('')
const orders = ref([])
const loading = ref(false)
const processingOrders = ref({})
const toast = ref({
  show: false,
  type: 'info',
  message: '',
  icon: 'ℹ️'
})

const statusLabels = {
  pending: 'Novo',
  active: 'Preparando',
  ready: 'Pronto',
  completed: 'Concluído',
  cancelled: 'Cancelado'
}

// Computed
const statusCounts = computed(() => {
  return {
    new: orders.value.filter(o => o.status === 'pending').length,
    preparing: orders.value.filter(o => o.status === 'active').length,
    ready: orders.value.filter(o => o.status === 'ready').length
  }
})

// Methods
const updateDateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
  currentDate.value = now.toLocaleDateString('pt-BR', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const calculateElapsedTime = (createdAt) => {
  const created = new Date(createdAt)
  const now = new Date()
  const diffMs = now - created
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Agora'
  if (diffMins < 60) return `${diffMins} min`
  
  const diffHours = Math.floor(diffMins / 60)
  const remainingMins = diffMins % 60
  return `${diffHours}h ${remainingMins}m`
}

const isOrderUrgent = (createdAt) => {
  const created = new Date(createdAt)
  const now = new Date()
  const diffMs = now - created
  const diffMins = Math.floor(diffMs / 60000)
  return diffMins >= 15 // Urgente após 15 minutos
}

const getItemColor = (item) => {
  const colors = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4']
  const index = item.produto_id ? item.produto_id % colors.length : 0
  return colors[index]
}

const fetchOrders = async () => {
  loading.value = true
  
  try {
    // Buscar pedidos ativos (pending, active, ready)
    const { data, error: fetchError } = await supabase
      .from(TABLES.PEDIDOS)
      .select(`
        *,
        pwa_mesas (
          numero
        )
      `)
      .in('status', ['pending', 'active', 'ready'])
      .order('created_at', { ascending: true })

    if (fetchError) throw fetchError

    // Buscar IDs dos produtos
    const allProductIds = new Set()
    data.forEach(order => {
      if (Array.isArray(order.itens)) {
        order.itens.forEach(item => {
          allProductIds.add(item.produto_id)
        })
      }
    })

    // Buscar dados dos produtos
    let productsMap = {}
    if (allProductIds.size > 0) {
      const { data: productsData, error: productsError } = await supabase
        .from('pwa_produtos')
        .select('id, nome')
        .in('id', Array.from(allProductIds))

      if (!productsError && productsData) {
        productsData.forEach(product => {
          productsMap[product.id] = product.nome
        })
      }
    }

    // Processar pedidos
    orders.value = data.map(order => {
      const enrichedItems = (order.itens || []).map(item => ({
        ...item,
        product_name: productsMap[item.produto_id] || 'Produto',
        price: item.preco_unitario,
        quantity: item.quantidade
      }))

      return {
        ...order,
        items: enrichedItems,
        mesa_numero: order.pwa_mesas?.numero,
        elapsedTime: calculateElapsedTime(order.created_at),
        isUrgent: isOrderUrgent(order.created_at),
        // Mapear status do banco para status do KDS
        status: order.status === 'cooking' ? 'active' : order.status
      }
    })

  } catch (err) {
    console.error('Erro ao buscar pedidos:', err)
    showToast('error', 'Erro ao carregar pedidos', '❌')
  } finally {
    loading.value = false
  }
}

const refreshOrders = async () => {
  if (loading.value) return
  await fetchOrders()
  showToast('success', 'Pedidos atualizados', '✓')
}

const startOrder = async (orderId) => {
  processingOrders.value[orderId] = true
  try {
    const { error: updateError } = await supabase
      .from(TABLES.PEDIDOS)
      .update({ status: 'active' })
      .eq('id', orderId)

    if (updateError) throw updateError

    await fetchOrders()
    showToast('info', `Pedido #${orderId} iniciado`, '▶️')
  } catch (error) {
    console.error('Erro ao iniciar pedido:', error)
    showToast('error', 'Erro ao iniciar pedido', '❌')
  } finally {
    delete processingOrders.value[orderId]
  }
}

const finishOrder = async (orderId) => {
  processingOrders.value[orderId] = true
  try {
    const { error: updateError } = await supabase
      .from(TABLES.PEDIDOS)
      .update({ status: 'ready' })
      .eq('id', orderId)

    if (updateError) throw updateError

    await fetchOrders()
    showToast('success', `Pedido #${orderId} pronto!`, '✓')
  } catch (error) {
    console.error('Erro ao finalizar pedido:', error)
    showToast('error', 'Erro ao finalizar pedido', '❌')
  } finally {
    delete processingOrders.value[orderId]
  }
}

const completeOrder = async (orderId) => {
  processingOrders.value[orderId] = true
  try {
    const { error: updateError } = await supabase
      .from(TABLES.PEDIDOS)
      .update({ status: 'completed' })
      .eq('id', orderId)

    if (updateError) throw updateError

    await fetchOrders()
    showToast('success', `Pedido #${orderId} entregue!`, '🎉')
  } catch (error) {
    console.error('Erro ao entregar pedido:', error)
    showToast('error', 'Erro ao entregar pedido', '❌')
  } finally {
    delete processingOrders.value[orderId]
  }
}

const showToast = (type, message, icon) => {
  toast.value = { show: true, type, message, icon }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

const voltarParaDashboard = () => {
  router.back()
}

// Lifecycle
let timeInterval
let refreshInterval

onMounted(() => {
  updateDateTime()
  fetchOrders()
  
  // Atualizar relógio a cada segundo
  timeInterval = setInterval(updateDateTime, 1000)
  
  // Atualizar pedidos a cada 10 segundos
  refreshInterval = setInterval(fetchOrders, 10000)
  
  // Atualizar elapsed time a cada minuto
  setInterval(() => {
    orders.value.forEach(order => {
      order.elapsedTime = calculateElapsedTime(order.created_at)
      order.isUrgent = isOrderUrgent(order.created_at)
    })
  }, 60000)
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.kds-2025 {
  min-height: 100vh;
  background: #000000;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #ffffff;
  font-size: 16px;
}

.orders-grid-2025::-webkit-scrollbar,
.order-items-2025::-webkit-scrollbar {
  width: 8px;
}

.orders-grid-2025::-webkit-scrollbar-thumb,
.order-items-2025::-webkit-scrollbar-thumb {
  background-color: #475569;
  border-radius: 10px;
}

.orders-grid-2025::-webkit-scrollbar-track,
.order-items-2025::-webkit-scrollbar-track {
  background: #000000;
}

.kds-header-2025 {
  background: #1e293b;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid #334155;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 3rem;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.logo-primary {
  font-size: 1.8rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.5px;
}

.logo-secondary {
  font-size: 1rem;
  font-weight: 600;
  color: #e2e8f0;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.time-display {
  text-align: center;
  background: rgba(59, 130, 246, 0.1);
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  border: 1px solid #3b82f6;
}

.time {
  font-size: 1.8rem;
  font-weight: 700;
  color: #ffffff;
  font-feature-settings: "tnum";
}

.date {
  font-size: 0.9rem;
  color: #e2e8f0;
  font-weight: 500;
}

.status-indicators {
  display: flex;
  gap: 2rem;
}

.indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.indicator-badge {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.4rem;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
  border: 3px solid rgba(255, 255, 255, 0.2);
}

.indicator.new .indicator-badge {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
}

.indicator.preparing .indicator-badge {
  background: linear-gradient(135deg, #0ea5e9, #0369a1);
  box-shadow: 0 0 20px rgba(14, 165, 233, 0.4);
}

.indicator.ready .indicator-badge {
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
}

.indicator span {
  font-size: 0.9rem;
  font-weight: 600;
  color: #e2e8f0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-action {
  width: 52px;
  height: 52px;
  background: #1e293b;
  border: 2px solid #475569;
  border-radius: 12px;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.btn-action:hover:not(:disabled) {
  background: #3b82f6;
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
}

.btn-action.refresh:hover:not(:disabled) {
  background: #0ea5e9;
  border-color: #0ea5e9;
}

.btn-action.logout:hover:not(:disabled) {
  background: #ef4444;
  border-color: #ef4444;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.orders-grid-2025 {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
  max-width: 1920px;
  margin: 0 auto;
}

.order-card-2025 {
  background: #1e293b;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  border: 2px solid #334155;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.order-card-2025::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: #334155;
  transition: all 0.3s ease;
}

.order-card-2025.status-pending::before {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.order-card-2025.status-active::before {
  background: linear-gradient(135deg, #0ea5e9, #0369a1);
}

.order-card-2025.status-ready::before {
  background: linear-gradient(135deg, #10b981, #059669);
}

.order-card-2025.urgent {
  border-color: #ef4444;
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
}

.order-card-2025.urgent::before {
  background: #ef4444;
  animation: urgentPulse 1.5s infinite alternate;
}

@keyframes urgentPulse {
  from { opacity: 0.7; }
  to { opacity: 1; }
}

.order-card-2025:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  border-color: #475569;
  background: #334155;
}

.card-header-2025 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #334155;
}

.order-number {
  font-size: 1.8rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.5px;
  flex-grow: 1;
}

.order-table {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(59, 130, 246, 0.15);
  border: 2px solid #3b82f6;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.order-time {
  padding: 0.5rem 1rem;
  background: rgba(59, 130, 246, 0.15);
  border: 2px solid #475569;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  color: #ffffff;
  font-feature-settings: "tnum";
}

.order-time.urgent {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
  color: white;
  font-weight: 800;
  animation: urgentPulse 1.5s infinite alternate;
}

.order-items-2025 {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.item-2025 {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #000000;
  border-radius: 8px;
  border-left: 4px solid #475569;
  transition: all 0.2s ease;
}

.item-2025:hover {
  border-left-color: #3b82f6;
  background: #334155;
  transform: translateX(3px);
}

.item-quantity {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  padding: 0.4rem 0.7rem;
  border-radius: 8px;
  font-weight: 800;
  font-size: 0.9rem;
  min-width: 36px;
  text-align: center;
  font-feature-settings: "tnum";
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.item-name {
  color: #ffffff;
  font-weight: 600;
  font-size: 1.05rem;
  flex: 1;
}

.item-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
}

.card-footer-2025 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 2px solid #334155;
}

.status-tag {
  padding: 0.6rem 1.2rem;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  min-width: 110px;
  text-align: center;
  border: 2px solid;
}

.status-tag.badge-pending {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border-color: #3b82f6;
}

.status-tag.badge-active {
  background: rgba(14, 165, 233, 0.2);
  color: #0ea5e9;
  border-color: #0ea5e9;
}

.status-tag.badge-ready {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border-color: #10b981;
}

.action-btn-2025 {
  flex: 1;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 52px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  border: 2px solid transparent;
}

.action-btn-2025:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none;
}

.action-btn-2025:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.action-btn-2025.action-start {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border-color: #3b82f6;
}

.action-btn-2025.action-start:hover:not(:disabled) {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
}

.action-btn-2025.action-finish {
  background: linear-gradient(135deg, #0ea5e9, #0369a1);
  color: white;
  border-color: #0ea5e9;
}

.action-btn-2025.action-finish:hover:not(:disabled) {
  box-shadow: 0 0 20px rgba(14, 165, 233, 0.5);
}

.action-btn-2025.action-complete {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border-color: #10b981;
}

.action-btn-2025.action-complete:hover:not(:disabled) {
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
}

.btn-spinner {
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #fff;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

.loading-spinner-2025 {
  border: 4px solid #334155;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.empty-state-2025 {
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 2rem;
  color: #e2e8f0;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.empty-state-2025 h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.empty-state-2025 p {
  font-size: 1rem;
  color: #e2e8f0;
}

.toast-2025 {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 1000;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.toast-2025.success {
  background: #10b981;
  border-color: #10b981;
}

.toast-2025.error {
  background: #ef4444;
  border-color: #ef4444;
}

.toast-2025.info {
  background: #0ea5e9;
  border-color: #0ea5e9;
}

.toast-icon {
  font-size: 1.25rem;
}

.toast-2025-enter-active,
.toast-2025-leave-active {
  transition: all 0.5s ease;
}

.toast-2025-enter-from,
.toast-2025-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@media (max-width: 1200px) {
  .orders-grid-2025 {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}

@media (max-width: 768px) {
  .kds-header-2025 {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
  
  .header-brand {
    width: 100%;
    justify-content: space-between;
    gap: 1rem;
  }
  
  .status-indicators {
    width: 100%;
    justify-content: space-around;
    gap: 1rem;
  }
  
  .orders-grid-2025 {
    padding: 1rem;
    grid-template-columns: 1fr;
  }
}
</style>
