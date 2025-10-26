<template>
  <transition name="slide-down">
    <div v-if="showStatus" class="online-status" :class="statusClass">
      <div class="status-content">
        <component :is="statusIcon" :size="20" />
        <span>{{ statusMessage }}</span>
        <span v-if="pendingCount > 0" class="pending-badge">
          {{ pendingCount }} pendente{{ pendingCount > 1 ? 's' : '' }}
        </span>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Wifi, WifiOff, RefreshCw } from 'lucide-vue-next'
import { syncService } from '@/services/syncService'

const isOnline = ref(navigator.onLine)
const showStatus = ref(false)
const pendingCount = ref(0)
const isSyncing = ref(false)

let hideTimeout = null

const statusClass = computed(() => ({
  'online': isOnline.value && !isSyncing.value,
  'offline': !isOnline.value,
  'syncing': isSyncing.value
}))

const statusIcon = computed(() => {
  if (isSyncing.value) return RefreshCw
  return isOnline.value ? Wifi : WifiOff
})

const statusMessage = computed(() => {
  if (isSyncing.value) return 'Sincronizando dados...'
  return isOnline.value ? 'Online' : 'Modo Offline'
})

function updateStatus() {
  isOnline.value = navigator.onLine
  pendingCount.value = syncService.getPendingCount()
  
  showStatus.value = true
  clearTimeout(hideTimeout)
  
  // Esconde após 3 segundos se estiver online
  if (isOnline.value && !isSyncing.value && pendingCount.value === 0) {
    hideTimeout = setTimeout(() => {
      showStatus.value = false
    }, 3000)
  }
}

async function handleOnline() {
  updateStatus()
  
  if (pendingCount.value > 0) {
    isSyncing.value = true
    await syncService.syncPendingOperations()
    isSyncing.value = false
    pendingCount.value = syncService.getPendingCount()
  }
}

function handleOffline() {
  updateStatus()
}

onMounted(() => {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  // Verifica status inicial
  if (!isOnline.value) {
    updateStatus()
  }
  
  // Atualiza contagem de pendentes a cada 5 segundos
  const interval = setInterval(() => {
    const count = syncService.getPendingCount()
    if (count !== pendingCount.value) {
      pendingCount.value = count
      if (count > 0) {
        showStatus.value = true
      }
    }
  }, 5000)
  
  onUnmounted(() => {
    clearInterval(interval)
  })
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  clearTimeout(hideTimeout)
})
</script>

<style scoped>
.online-status {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.online {
  background: #10b981;
  color: white;
}

.offline {
  background: #ef4444;
  color: white;
}

.syncing {
  background: #f59e0b;
  color: white;
}

.syncing svg {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.pending-badge {
  background: rgba(255, 255, 255, 0.3);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>