<template>
  <div class="kds-2025">
    <!-- HEADER MODERNO -->
    <header class="kds-header-2025">
      <div class="header-brand">
        <div class="logo-wrapper">
          <div class="logo-icon">👨‍🍳</div>
          <div class="logo-text">
            <span class="logo-primary">KITCHEN</span>
            <span class="logo-secondary">DISPLAY</span>
          </div>
        </div>
        <div class="time-display">
          <div class="time">{{ currentTime }}</div>
          <div class="date">{{ currentDate }}</div>
        </div>
      </div>

      <!-- STATUS INDICATORS -->
      <div class="status-indicators">
        <div class="indicator new">
          <div class="indicator-badge">{{ stats.pending }}</div>
          <span>Novos</span>
        </div>
        <div class="indicator preparing">
          <div class="indicator-badge">{{ stats.preparing }}</div>
          <span>Preparando</span>
        </div>
        <div class="indicator ready">
          <div class="indicator-badge">{{ stats.ready }}</div>
          <span>Prontos</span>
        </div>
      </div>

      <div class="header-actions">
        <button @click="loadOrders" class="btn-action refresh" :disabled="loading" title="Atualizar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" :class="{ spinning: loading }">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" 
                  stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
        <button @click="handleLogout" class="btn-action logout" title="Sair">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="2"/>
            <polyline points="16 17 21 12 16 7" stroke="currentColor" stroke-width="2"/>
            <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- MAIN GRID -->
    <main class="orders-grid-2025">
      <!-- ORDER CARD -->
      <article 
        v-for="order in sortedOrders" 
        :key="order.id"
        class="order-card-2025"
        :class="getCardClass(order)">
        
        <!-- CARD HEADER -->
        <div class="card-header-2025">
          <div class="order-meta">
            <div class="order-id">#{{ order.id }}</div>
            <div class="order-time" :class="{ urgent: isUrgent(order.created_at) }">
              {{ formatOrderTime(order.created_at) }}
            </div>
          </div>
          <div class="table-info">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
              <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="2"/>
              <line x1="9" y1="21" x2="9" y2="9" stroke="currentColor" stroke-width="2"/>
            </svg>
            Mesa {{ order.mesa_numero || 'Balcão' }}
          </div>
        </div>

        <!-- ORDER ITEMS -->
        <div class="order-items-2025">
          <div v-for="(item, index) in order.items" :key="index" class="item-2025">
            <span class="item-quantity">{{ item.quantity }}x</span>
            <span class="item-name">{{ item.product_name }}</span>
            <span class="item-dot" :style="{ backgroundColor: getItemColor(index) }"></span>
          </div>
        </div>

        <!-- CARD FOOTER -->
        <div class="card-footer-2025">
          <div class="status-tag" :class="getStatusClass(order.status)">
            {{ getStatusLabel(order.status) }}
          </div>
          <button 
            @click.prevent.stop="nextStatus(order)"
            class="action-btn-2025"
            :class="getActionClass(order.status)"
            :disabled="updatingOrder === order.id">
            <span v-if="updatingOrder === order.id">
              <div class="btn-spinner"></div>
            </span>
            <span v-else>{{ getActionLabel(order.status) }}</span>
          </button>
        </div>
      </article>

      <!-- EMPTY STATE -->
      <div v-if="sortedOrders.length === 0 && !loading" class="empty-state-2025">
        <div class="empty-icon">🍽️</div>
        <h3>Tudo em dia!</h3>
        <p>Nenhum pedido ativo no momento</p>
      </div>

      <!-- LOADING STATE -->
      <div v-if="loading && sortedOrders.length === 0" class="empty-state-2025">
        <div class="loading-spinner-2025"></div>
        <p>Carregando pedidos...</p>
      </div>
    </main>

    <!-- TOAST NOTIFICATION -->
    <Transition name="toast-2025">
      <div v-if="showToast" class="toast-2025" :class="toastType">
        <div class="toast-icon">
          <span v-if="toastType === 'success'">✓</span>
          <span v-else-if="toastType === 'error'">⚠</span>
          <span v-else>🔔</span>
        </div>
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
const currentDate = ref('')
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

// Função para gerar cores diferentes para cada item
const getItemColor = (index) => {
  const colors = [
    '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444',
    '#f97316', '#06b6d4', '#84cc16', '#ec4899', '#6366f1'
  ];
  return colors[index % colors.length];
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

    const { error: updateError } = await supabase
      .from(TABLES.PEDIDOS)
      .update({ status: newDbStatus })
      .eq('id', order.id)

    if (updateError) {
      console.error('❌ Erro ao atualizar pedido:', updateError)
      throw updateError
    }

    console.log(`✅ Pedido ${order.id} atualizado para: ${newDbStatus}`)
    
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

    // Registrar atividade
    try {
      await supabase.from('pwa_atividades').insert({
        tipo: 'status_cozinha',
        titulo: `Pedido #${order.id} - ${newKitchenStatus}`,
        descricao: `Status alterado para: ${newKitchenStatus}`,
        pedido_id: order.id,
        mesa_id: order.mesa_id,
        prioridade: newKitchenStatus === 'Pronto' ? 'alta' : 'normal'
      })
      console.log(`📝 Atividade registrada para pedido #${order.id}`)
    } catch (logError) {
      console.warn('⚠️ Erro ao registrar atividade:', logError)
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
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit'
  })
  currentDate.value = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long'
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
/* ===== VARIÁVEIS DE DESIGN 2025 ===== */
:root {
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --border-light: #e2e8f0;
  --border-medium: #cbd5e1;
  --accent-new: #f59e0b;
  --accent-preparing: #3b82f6;
  --accent-ready: #10b981;
  --accent-urgent: #ef4444;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
}

/* ===== BASE ===== */
.kds-2025 {
  min-height: 100vh;
  background: var(--bg-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  padding: 0;
}

/* ===== HEADER 2025 ===== */
.kds-header-2025 {
  background: var(--bg-secondary);
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  font-size: 2rem;
  background: linear-gradient(135deg, var(--accent-preparing), var(--accent-ready));
  border-radius: var(--radius-md);
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.logo-primary {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.logo-secondary {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 1px;
}

.time-display {
  text-align: center;
}

.time {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  font-feature-settings: "tnum";
}

.date {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* STATUS INDICATORS */
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
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.125rem;
  /* CORRIGIDO: Mudar a cor do texto para escuro nos badges claros */
  color: #1a1a1a; /* Texto escuro para contraste */
}

.indicator.new .indicator-badge {
  background: var(--accent-new);
}

.indicator.preparing .indicator-badge {
  background: var(--accent-preparing);
}

.indicator.ready .indicator-badge {
  background: var(--accent-ready);
}

.indicator span {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-action {
  width: 48px;
  height: 48px;
  background: var(--bg-primary);
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-action:hover:not(:disabled) {
  background: var(--bg-card);
  border-color: var(--border-medium);
  color: var(--text-primary);
  transform: translateY(-1px);
}

.btn-action.refresh:hover:not(:disabled) {
  border-color: var(--accent-preparing);
  color: var(--accent-preparing);
}

.btn-action.logout:hover:not(:disabled) {
  border-color: var(--accent-urgent);
  color: var(--accent-urgent);
}

/* ===== ORDERS GRID 2025 ===== */
.orders-grid-2025 {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* ===== ORDER CARD 2025 ===== */
.order-card-2025 {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border: 1.5px solid var(--border-light);
  box-shadow: var(--shadow-sm);
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
  height: 4px;
  background: var(--border-light);
  transition: all 0.3s ease;
}

.order-card-2025.status-new::before {
  background: linear-gradient(90deg, var(--accent-new), #fbbf24);
}

.order-card-2025.status-cooking::before {
  background: linear-gradient(90deg, var(--accent-preparing), #60a5fa);
}

.order-card-2025.status-ready::before {
  background: linear-gradient(90deg, var(--accent-ready), #34d399);
}

.order-card-2025.urgent::before {
  background: linear-gradient(90deg, var(--accent-urgent), #f87171);
  animation: urgentGlow 2s ease-in-out infinite;
}

.order-card-2025:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--border-medium);
}

@keyframes urgentGlow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* CARD HEADER */
.card-header-2025 {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.order-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.order-id {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.order-time {
  padding: 0.375rem 0.75rem;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-secondary);
  font-feature-settings: "tnum";
  border: 1px solid var(--border-light);
}

.order-time.urgent {
  background: var(--accent-urgent);
  color: white;
  border-color: var(--accent-urgent);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.table-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--text-primary);
  border: 1px solid var(--border-light);
}

/* ORDER ITEMS */
.order-items-2025 {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.item-2025 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-light);
  position: relative;
  transition: all 0.2s ease;
}

.item-2025:hover {
  border-color: var(--border-medium);
  transform: translateX(2px);
}

.item-quantity {
  background: var(--text-primary);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-weight: 800;
  font-size: 0.75rem;
  min-width: 28px;
  text-align: center;
  font-feature-settings: "tnum";
}

.item-name {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.95rem;
  flex: 1;
}

.item-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* CARD FOOTER */
.card-footer-2025 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: auto;
}

.status-tag {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-lg);
  font-weight: 800;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.status-tag.badge-new {
  background: rgba(245, 158, 11, 0.1);
  color: var(--accent-new);
  border: 1.5px solid var(--accent-new);
}

.status-tag.badge-cooking {
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent-preparing);
  border: 1.5px solid var(--accent-preparing);
}

.status-tag.badge-ready {
  background: rgba(16, 185, 129, 0.1);
  color: var(--accent-ready);
  border: 1.5px solid var(--accent-ready);
}

.action-btn-2025 {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 800;
  font-size: 0.875rem;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px;
}

.action-btn-2025:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.action-btn-2025:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.action-btn-2025.action-start {
  background: var(--accent-new);
  color: white;
}

.action-btn-2025.action-start:not(:disabled):hover {
  background: #eab308;
}

.action-btn-2025.action-finish {
  background: var(--accent-preparing);
  color: white;
}

.action-btn-2025.action-finish:not(:disabled):hover {
  background: #2563eb;
}

.action-btn-2025.action-deliver {
  background: var(--accent-ready);
  color: white;
}

.action-btn-2025.action-deliver:not(:disabled):hover {
  background: #059669;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* ===== EMPTY STATE ===== */
.empty-state-2025 {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state-2025 h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.loading-spinner-2025 {
  width: 48px;
  height: 48px;
  border: 3px solid var(--border-light);
  border-top-color: var(--accent-preparing);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

/* ===== TOAST 2025 ===== */
.toast-2025 {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--text-primary);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: var(--radius-lg);
  font-weight: 600;
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  min-width: 300px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  backdrop-filter: blur(10px);
}

.toast-2025.success {
  background: var(--accent-ready);
}

.toast-2025.error {
  background: var(--accent-urgent);
}

.toast-2025.info {
  background: var(--accent-preparing);
}

.toast-icon {
  font-size: 1.125rem;
}

.toast-2025-enter-active, .toast-2025-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-2025-enter-from, .toast-2025-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}

/* ===== SCROLLBAR ===== */
.order-items-2025::-webkit-scrollbar {
  width: 6px;
}

.order-items-2025::-webkit-scrollbar-track {
  background: var(--border-light);
  border-radius: 3px;
}

.order-items-2025::-webkit-scrollbar-thumb {
  background: var(--border-medium);
  border-radius: 3px;
}

.order-items-2025::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* ===== ANIMAÇÕES ===== */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinning {
  animation: spin 1s linear infinite;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1200px) {
  .orders-grid-2025 {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .kds-header-2025 {
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem;
  }
  
  .header-brand {
    width: 100%;
    justify-content: space-between;
  }
  
  .status-indicators {
    width: 100%;
    justify-content: space-around;
  }
  
  .header-actions {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    flex-direction: column;
    z-index: 90;
  }
  
  .orders-grid-2025 {
    grid-template-columns: 1fr;
    padding: 1rem;
    margin-bottom: 4rem;
  }
  
  .card-footer-2025 {
    flex-direction: column;
  }
  
  .action-btn-2025 {
    width: 100%;
  }
}
</style>
