<template>
  <Teleport to="body">
    <div class="notification-container">
      <TransitionGroup name="notification">
        <div
          v-for="notification in visibleNotifications"
          :key="notification.id"
          class="notification-toast"
          :class="getNotificationClass(notification.type)"
          @click="handleClick(notification)"
        >
          <div class="notification-icon">{{ getIcon(notification.type) }}</div>
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
          </div>
          <button class="notification-close" @click.stop="dismiss(notification.id)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useNotifications } from '@/composables/useNotifications'

const { notifications, markAsRead } = useNotifications()
const visibleNotifications = ref([])
const autoHideDelay = 5000

const getIcon = (type) => {
  const icons = {
    'order_status': '🔔',
    'new_order': '📦',
    'order_ready': '✅',
    'order_completed': '🎉',
    'default': '💬'
  }
  return icons[type] || icons.default
}

const getNotificationClass = (type) => {
  const classes = {
    'new_order': 'notification-info',
    'order_status': 'notification-warning',
    'order_ready': 'notification-success',
    'order_completed': 'notification-success',
    'default': 'notification-info'
  }
  return classes[type] || classes.default
}

const handleClick = (notification) => {
  markAsRead(notification.id)
  dismiss(notification.id)
}

const dismiss = (notificationId) => {
  const index = visibleNotifications.value.findIndex(n => n.id === notificationId)
  if (index > -1) {
    visibleNotifications.value.splice(index, 1)
  }
}

const showNotification = (notification) => {
  visibleNotifications.value.push(notification)
  
  setTimeout(() => {
    dismiss(notification.id)
  }, autoHideDelay)
}

// Observar novas notificações
watch(
  () => notifications.value.length,
  (newLength, oldLength) => {
    if (newLength > oldLength) {
      const newNotification = notifications.value[0]
      if (!newNotification.read) {
        showNotification(newNotification)
      }
    }
  }
)
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 400px;
  pointer-events: none;
}

.notification-toast {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s ease;
  border-left: 4px solid #3b82f6;
}

.notification-toast:hover {
  transform: translateX(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.notification-toast.notification-info {
  border-left-color: #3b82f6;
  background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
}

.notification-toast.notification-success {
  border-left-color: #10b981;
  background: linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%);
}

.notification-toast.notification-warning {
  border-left-color: #f59e0b;
  background: linear-gradient(135deg, #ffffff 0%, #fef3c7 100%);
}

.notification-toast.notification-error {
  border-left-color: #ef4444;
  background: linear-gradient(135deg, #ffffff 0%, #fee2e2 100%);
}

.notification-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 700;
  font-size: 0.9rem;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.notification-message {
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.4;
}

.notification-close {
  flex-shrink: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.notification-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #4b5563;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}

@media (max-width: 640px) {
  .notification-container {
    left: 1rem;
    right: 1rem;
    max-width: none;
  }
  
  .notification-toast {
    padding: 0.875rem;
  }
  
  .notification-icon {
    font-size: 1.25rem;
  }
  
  .notification-title {
    font-size: 0.85rem;
  }
  
  .notification-message {
    font-size: 0.8rem;
  }
}
</style>