// src/composables/useNotifications.js
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { useUserStore } from '@/stores/user'

export function useNotifications() {
  const userStore = useUserStore()
  const notifications = ref([])
  const unreadCount = ref(0)
  const loading = ref(false)
  let realtimeChannel = null

  const unreadNotifications = computed(() => 
    notifications.value.filter(n => !n.read)
  )

  const recentNotifications = computed(() => 
    notifications.value.slice(0, 5)
  )

  /**
   * Buscar notificações do usuário
   */
  const fetchNotifications = async () => {
    if (!userStore.profile?.user_id) return

    try {
      loading.value = true

      const { data, error } = await supabase
        .from('pwa_notifications')
        .select('*')
        .eq('user_id', userStore.profile.user_id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      notifications.value = data || []
      unreadCount.value = data?.filter(n => !n.read).length || 0

    } catch (error) {
      console.error('❌ Erro ao buscar notificações:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * Marcar notificação como lida
   */
  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('pwa_notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error

      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification) {
        notification.read = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }

    } catch (error) {
      console.error('❌ Erro ao marcar como lida:', error)
    }
  }

  /**
   * Marcar todas como lidas
   */
  const markAllAsRead = async () => {
    if (!userStore.profile?.user_id) return

    try {
      const { error } = await supabase.rpc(
        'mark_all_notifications_read',
        { p_user_id: userStore.profile.user_id }
      )

      if (error) throw error

      notifications.value.forEach(n => n.read = true)
      unreadCount.value = 0

    } catch (error) {
      console.error('❌ Erro ao marcar todas como lidas:', error)
    }
  }

  /**
   * Deletar notificação
   */
  const deleteNotification = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('pwa_notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      const index = notifications.value.findIndex(n => n.id === notificationId)
      if (index > -1) {
        const wasUnread = !notifications.value[index].read
        notifications.value.splice(index, 1)
        if (wasUnread) {
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
      }

    } catch (error) {
      console.error('❌ Erro ao deletar notificação:', error)
    }
  }

  /**
   * Limpar todas as notificações
   */
  const clearAll = async () => {
    if (!userStore.profile?.user_id) return

    try {
      const { error } = await supabase
        .from('pwa_notifications')
        .delete()
        .eq('user_id', userStore.profile.user_id)

      if (error) throw error

      notifications.value = []
      unreadCount.value = 0

    } catch (error) {
      console.error('❌ Erro ao limpar notificações:', error)
    }
  }

  /**
   * Configurar realtime para notificações
   */
  const setupRealtime = () => {
    if (!userStore.profile?.user_id) return

    console.log('👂 Configurando realtime para notificações...')

    realtimeChannel = supabase
      .channel(`notifications:${userStore.profile.user_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pwa_notifications',
          filter: `user_id=eq.${userStore.profile.user_id}`
        },
        (payload) => {
          console.log('🔔 Nova notificação recebida:', payload.new)
          
          notifications.value.unshift(payload.new)
          unreadCount.value++

          try {
            new Audio('/notification.mp3').play().catch(() => {})
          } catch (e) {}

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(payload.new.title, {
              body: payload.new.message,
              icon: '/icon.png'
            })
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Status realtime notificações:', status)
      })
  }

  /**
   * Solicitar permissão para notificações do navegador
   */
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission()
        console.log('🔔 Permissão de notificação:', permission)
      } catch (error) {
        console.error('❌ Erro ao solicitar permissão:', error)
      }
    }
  }

  /**
   * Cleanup
   */
  const cleanup = () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      realtimeChannel = null
    }
  }

  /**
   * Inicializar
   */
  const initialize = () => {
    fetchNotifications()
    setupRealtime()
    requestNotificationPermission()
  }

  return {
    notifications,
    unreadCount,
    loading,
    unreadNotifications,
    recentNotifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    initialize,
    cleanup
  }
}