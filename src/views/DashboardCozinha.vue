<template>
  <div class="kds-pro">
    <!-- HEADER COMPACTO -->
    <header class="kds-header-pro">
      <div class="header-left">
        <div class="logo">👨‍🍳 COZINHA</div>
        <div class="time">{{ currentTime }}</div>
      </div>

      <div class="header-stats">
        <div class="stat-chip pending">{{ stats.pending }}</div>
        <div class="stat-chip preparing">{{ stats.preparing }}</div>
        <div class="stat-chip ready">{{ stats.ready }}</div>
      </div>

      <div class="header-right">
        <button @click="loadOrders" class="btn-refresh" title="Atualizar" :disabled="loading">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ spinning: loading }">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
        </button>
        <button @click="handleLogout" class="btn-logout" title="Sair">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- GRID DE PEDIDOS -->
    <div class="orders-grid-pro">
      <!-- CARD DE PEDIDO -->
      <div 
        v-for="order in sortedOrders" 
        :key="order.id"
        class="order-card-pro"
        :class="getCardClass(order)">
        
        <!-- HEADER DO CARD -->
        <div class="card-header-pro">
          <div class="order-id">
            <span class="hash">#</span>{{ order.id }}
          </div>
          <div class="order-time" :class="{ urgent: isUrgent(order.created_at) }">
            {{ formatOrderTime(order.created_at) }}
          </div>
        </div>

        <!-- MESA -->
        <div class="order-table">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
          Mesa {{ order.mesa_numero || 'Balcão' }}
        </div>

        <!-- ITENS -->
        <div class="order-items-pro">
          <div v-for="(item, index) in order.items" :key="index" class="item-pro">
            <span class="qty">{{ item.quantity }}x</span>
            <span class="name">{{ item.product_name }}</span>
          </div>
        </div>

        <!-- BADGE DE STATUS -->
        <div class="status-badge-pro" :class="getStatusClass(order.status)">
          {{ getStatusLabel(order.status) }}
        </div>

        <!-- BOTÃO DE AÇÃO -->
        <button 
          @click.prevent.stop="nextStatus(order)"
          class="action-btn-pro"
          :class="getActionClass(order.status)"
          :disabled="updatingOrder === order.id">
          <span v-if="updatingOrder === order.id">⏳ Atualizando...</span>
          <span v-else>{{ getActionLabel(order.status) }}</span>
        </button>
      </div>

      <!-- EMPTY STATE -->
      <div v-if="sortedOrders.length === 0 && !loading" class="empty-pro">
        <div class="empty-icon">✓</div>
        <p>Nenhum pedido ativo</p>
      </div>

      <!-- LOADING STATE -->
      <div v-if="loading && sortedOrders.length === 0" class="empty-pro">
        <div class="loading-spinner"></div>
        <p>Carregando pedidos...</p>
      </div>
    </div>

    <!-- TOAST -->
    <Transition name="toast">
      <div v-if="showToast" class="toast-pro" :class="toastType">
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { supabase, TABLES } from '@/services/supabase'

const router = useRouter()
const userStore = useUserStore()

const orders = ref([])
const currentTime = ref('')
const updatingOrder = ref(null)
const loading = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
let realtimeChannel = null
let timeInterval = null

// Mapeamento de status do sistema para a cozinha
const STATUS_MAP = {
  'pending': 'Recebido',
  'active': 'Em Preparo',
  'ready': 'Pronto'
}

const REVERSE_STATUS_MAP = {
  'Recebido': 'pending',
  'Em Preparo': 'active',
  'Pronto': 'ready'
}

const stats = computed(() => ({
  pending: orders.value.filter(o => o.status === 'Recebido').length,
  preparing: orders.value.filter(o => o.status === 'Em Preparo').length,
  ready: orders.value.filter(o => o.status === 'Pronto').length
}))

const sortedOrders = computed(() => {
  return [...orders.value]
    .filter(o => ['Recebido', 'Em Preparo', 'Pronto'].includes(o.status))
    .sort((a, b) => {
      // Ordenar por status priority
      const priority = { 'Recebido': 1, 'Em Preparo': 2, 'Pronto': 3 }
      if (priority[a.status] !== priority[b.status]) {
        return priority[a.status] - priority[b.status]
      }
      // Depois por tempo (mais antigo primeiro)
      return new Date(a.created_at) - new Date(b.created_at)
    })
})

const loadOrders = async () => {
  try {
    loading.value = true
    console.log('🔄 Carregando pedidos da cozinha...')

    const { data, error: fetchError } = await supabase
      .from(TABLES.PEDIDOS)
      .select(`
        *,
        pwa_mesas (
          numero,
          garcom_id
        )
      `)
      .in('status', ['pending', 'active', 'ready'])
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('❌ Erro ao buscar pedidos:', fetchError)
      throw fetchError
    }

    console.log(`✅ ${data?.length || 0} pedidos encontrados`)

    // Buscar IDs dos produtos para fazer lookup
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

      if (productsError) {
        console.error('⚠️ Erro ao buscar produtos:', productsError)
      } else {
        productsData?.forEach(product => {
          productsMap[product.id] = product.nome
        })
      }
    }

    // Mapear para formato da cozinha
    orders.value = data.map(order => {
      const enrichedItems = (order.itens || []).map(item => ({
        quantity: item.quantity || item.quantidade || 1,
        product_name: productsMap[item.produto_id] || 'Produto removido',
        price: item.preco_unitario || item.price || 0
      }))

      return {
        id: order.id,
        status: STATUS_MAP[order.status] || order.status,
        mesa_numero: order.pwa_mesas?.numero,
        mesa_id: order.mesa_id,
        garcom_id: order.pwa_mesas?.garcom_id || order.garcom_id,
        customer_name: order.customer_name,
        created_at: order.created_at,
        items: enrichedItems
      }
    })

    console.log('✅ Pedidos processados:', orders.value)

  } catch (error) {
    console.error('❌ Erro geral em loadOrders:', error)
    showToastMessage('Erro ao carregar pedidos', 'error')
  } finally {
    loading.value = false
  }
}

const nextStatus = async (order) => {
  // Prevenir cliques múltiplos
  if (updatingOrder.value) {
    console.log('⏳ Já existe uma atualização em andamento')
    return
  }

  const statusFlow = {
    'Recebido': 'Em Preparo',
    'Em Preparo': 'Pronto',
    'Pronto': 'completed'
  }

  const newKitchenStatus = statusFlow[order.status]
  if (!newKitchenStatus) {
    console.log('❌ Status inválido:', order.status)
    return
  }

  // Converter para status do banco
  const newDbStatus = REVERSE_STATUS_MAP[newKitchenStatus] || newKitchenStatus

  try {
    updatingOrder.value = order.id
    console.log(`🔄 Atualizando pedido ${order.id} para: ${newDbStatus}`)

    const { data, error: updateError } = await supabase
      .from(TABLES.PEDIDOS)
      .update({ 
        status: newDbStatus,
        updated_at: new Date().toISOString(),
        updated_by: userStore.profile?.user_id
      })
      .eq('id', order.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Erro ao atualizar:', updateError)
      throw updateError
    }

    console.log(`✅ Pedido ${order.id} atualizado:`, data)
    
    // Atualizar localmente
    order.status = newKitchenStatus
    
    const messages = {
      'Em Preparo': '👨‍🍳 Preparo iniciado',
      'Pronto': '✅ Pedido pronto!',
      'completed': '🎉 Entregue'
    }
    
    showToastMessage(messages[newKitchenStatus], 'success')

    // Tocar som de sucesso
    try {
      new Audio('/success.mp3').play().catch(() => {})
    } catch (e) {}

    // Recarregar se for entregue (completed)
    if (newDbStatus === 'completed') {
      setTimeout(() => loadOrders(), 500)
    }

    // Registrar log
    if (userStore.profile?.id) {
      await userStore.logAction('update_order_status', `#${order.id} → ${newKitchenStatus}`)
    }

  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error)
    showToastMessage('❌ Erro ao atualizar pedido', 'error')
  } finally {
    updatingOrder.value = null
  }
}

const getCardClass = (order) => {
  const classes = []
  
  if (order.status === 'Recebido') classes.push('status-new')
  if (order.status === 'Em Preparo') classes.push('status-cooking')
  if (order.status === 'Pronto') classes.push('status-ready')
  if (isUrgent(order.created_at)) classes.push('urgent')
  
  return classes.join(' ')
}

const getStatusClass = (status) => {
  const classes = {
    'Recebido': 'badge-new',
    'Em Preparo': 'badge-cooking',
    'Pronto': 'badge-ready'
  }
  return classes[status] || ''
}

const getStatusLabel = (status) => {
  const labels = {
    'Recebido': 'NOVO',
    'Em Preparo': 'PREPARANDO',
    'Pronto': 'PRONTO'
  }
  return labels[status] || status
}

const getActionClass = (status) => {
  const classes = {
    'Recebido': 'action-start',
    'Em Preparo': 'action-finish',
    'Pronto': 'action-deliver'
  }
  return classes[status] || ''
}

const getActionLabel = (status) => {
  const labels = {
    'Recebido': 'INICIAR',
    'Em Preparo': 'FINALIZAR',
    'Pronto': 'ENTREGAR'
  }
  return labels[status] || 'OK'
}

const formatOrderTime = (timestamp) => {
  const diffMs = new Date() - new Date(timestamp)
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return '0m'
  if (diffMins < 60) return `${diffMins}m`
  
  const hours = Math.floor(diffMins / 60)
  const mins = diffMins % 60
  return `${hours}h${mins}m`
}

const isUrgent = (timestamp) => {
  const diffMins = Math.floor((new Date() - new Date(timestamp)) / 60000)
  return diffMins > 15
}

const updateCurrentTime = () => {
  currentTime.value = new Date().toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit'
  })
}

const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 3000)
}

const setupRealtime = () => {
  console.log('👂 Configurando realtime para cozinha...')

  realtimeChannel = supabase
    .channel('kitchen-orders-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLES.PEDIDOS
      },
      (payload) => {
        console.log('🔔 Atualização recebida:', payload)
        
        if (payload.eventType === 'INSERT') {
          const newOrder = payload.new
          if (['pending', 'active', 'ready'].includes(newOrder.status)) {
            showToastMessage('🔔 Novo pedido chegou!', 'info')
            try {
              new Audio('/notification.mp3').play().catch(() => {})
            } catch (e) {
              console.log('🔇 Áudio não disponível')
            }
            loadOrders()
          }
        } else if (payload.eventType === 'UPDATE') {
          // Atualizar apenas se não foi essa instância que atualizou
          if (updatingOrder.value !== payload.new.id) {
            loadOrders()
          }
        }
      }
    )
    .subscribe((status) => {
      console.log('📡 Status realtime:', status)
    })
}

const handleLogout = async () => {
  if (confirm('Deseja sair?')) {
    await userStore.logout()
    router.push('/login')
  }
}

onMounted(() => {
  console.log('🚀 Montando componente Cozinha...')
  loadOrders()
  setupRealtime()
  updateCurrentTime()
  timeInterval = setInterval(updateCurrentTime, 1000)
})

onUnmounted(() => {
  console.log('🔌 Desmontando componente Cozinha...')
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
  }
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.kds-pro {
  min-height: 100vh;
  background: #1a1a1a;
  padding: 0;
}

/* ===== HEADER ===== */
.kds-header-pro {
  background: #252525;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid #333;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.logo {
  font-size: 1.25rem;
  font-weight: 900;
  color: white;
  letter-spacing: 1px;
}

.time {
  font-size: 1.125rem;
  font-weight: 700;
  color: #10b981;
  font-family: 'Courier New', monospace;
}

.header-stats {
  display: flex;
  gap: 1rem;
}

.stat-chip {
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  font-weight: 900;
  font-size: 1.25rem;
  min-width: 50px;
  text-align: center;
}

.stat-chip.pending {
  background: #fbbf24;
  color: #1a1a1a;
}

.stat-chip.preparing {
  background: #3b82f6;
  color: white;
}

.stat-chip.ready {
  background: #10b981;
  color: white;
}

.header-right {
  display: flex;
  gap: 0.75rem;
}

.btn-refresh,
.btn-logout {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-refresh:hover:not(:disabled) {
  background: #3b82f6;
}

.btn-logout:hover {
  background: #ef4444;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ===== GRID ===== */
.orders-grid-pro {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

/* ===== CARDS ===== */
.order-card-pro {
  background: #2a2a2a;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border: 2px solid #333;
  transition: all 0.2s;
}

.order-card-pro.status-new {
  border-color: #fbbf24;
  background: linear-gradient(135deg, #2a2a2a 0%, #3a3000 100%);
}

.order-card-pro.status-cooking {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #2a2a2a 0%, #1e3a5f 100%);
}

.order-card-pro.status-ready {
  border-color: #10b981;
  background: linear-gradient(135deg, #2a2a2a 0%, #064e3b 100%);
}

.order-card-pro.urgent {
  animation: urgentPulse 2s infinite;
}

@keyframes urgentPulse {
  0%, 100% { 
    border-color: #ef4444;
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  50% { 
    border-color: #fca5a5;
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
}

.card-header-pro {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-id {
  font-size: 1.5rem;
  font-weight: 900;
  color: white;
}

.hash {
  color: #6b7280;
  font-weight: 400;
}

.order-time {
  padding: 0.25rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 800;
  color: #9ca3af;
  font-family: 'Courier New', monospace;
}

.order-time.urgent {
  background: #ef4444;
  color: white;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.order-table {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-weight: 800;
  font-size: 1.125rem;
  color: white;
}

.order-items-pro {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.item-pro {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
}

.qty {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 900;
  font-size: 0.875rem;
  min-width: 35px;
  text-align: center;
}

.name {
  color: #e5e7eb;
  font-weight: 600;
  font-size: 0.95rem;
}

.status-badge-pro {
  padding: 0.5rem;
  border-radius: 6px;
  text-align: center;
  font-weight: 900;
  font-size: 0.75rem;
  letter-spacing: 1px;
}

.badge-new {
  background: #fbbf24;
  color: #1a1a1a;
}

.badge-cooking {
  background: #3b82f6;
  color: white;
}

.badge-ready {
  background: #10b981;
  color: white;
}

.action-btn-pro {
  width: 100%;
  padding: 0.875rem;
  border: none;
  border-radius: 8px;
  font-weight: 900;
  font-size: 0.95rem;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn-pro:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-start {
  background: #3b82f6;
  color: white;
}

.action-start:hover:not(:disabled) {
  background: #2563eb;
  transform: scale(1.02);
}

.action-finish {
  background: #10b981;
  color: white;
}

.action-finish:hover:not(:disabled) {
  background: #059669;
  transform: scale(1.02);
}

.action-deliver {
  background: #8b5cf6;
  color: white;
}

.action-deliver:hover:not(:disabled) {
  background: #7c3aed;
  transform: scale(1.02);
}

/* ===== EMPTY ===== */
.empty-pro {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #6b7280;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

/* ===== TOAST ===== */
.toast-pro {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 800;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  min-width: 300px;
  text-align: center;
}

.toast-pro.success {
  background: #10b981;
}

.toast-pro.error {
  background: #ef4444;
}

.toast-pro.info {
  background: #3b82f6;
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}

/* ===== SCROLLBAR ===== */
.order-items-pro::-webkit-scrollbar {
  width: 6px;
}

.order-items-pro::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.order-items-pro::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1200px) {
  .orders-grid-pro {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  .kds-header-pro {
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  
  .header-stats {
    width: 100%;
    justify-content: space-around;
  }
  
  .orders-grid-pro {
    grid-template-columns: 1fr;
  }
}
</style>
