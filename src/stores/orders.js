import { defineStore } from 'pinia'
import { ordersAPI, subscribeToOrders } from '@/services/supabase'

export const useOrdersStore = defineStore('orders', {
  state: () => ({
    orders: [],
    loading: false,
    error: null,
    subscription: null
  }),

  getters: {
    pendingOrders: (state) => {
      return state.orders.filter(o => o.status === 'pending')
    },

    closedOrders: (state) => {
      return state.orders.filter(o => o.status === 'closed')
    },

    todayOrders: (state) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return state.orders.filter(o => {
        const orderDate = new Date(o.created_at)
        return orderDate >= today
      })
    },

    todayRevenue: (state) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return state.orders
        .filter(o => {
          const orderDate = new Date(o.created_at)
          return orderDate >= today && o.status === 'closed'
        })
        .reduce((sum, order) => sum + Number(order.total_price || 0), 0)
    }
  },

  actions: {
    async createOrder(customerName, customerPhone, items, total) {
      this.loading = true
      this.error = null
      try {
        const order = await ordersAPI.create(customerName, customerPhone, items, total)
        this.orders.push(order)
        return order
      } catch (error) {
        this.error = error.message
        console.error('Erro ao criar pedido:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchPendingOrders() {
      this.loading = true
      this.error = null
      try {
        const orders = await ordersAPI.getPending()
        this.orders = orders
        return orders
      } catch (error) {
        this.error = error.message
        console.error('Erro ao buscar pedidos:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async closeOrder(orderId) {
      try {
        const order = await ordersAPI.close(orderId)
        const index = this.orders.findIndex(o => o.id === orderId)
        if (index !== -1) {
          this.orders[index] = order
        }
        return order
      } catch (error) {
        this.error = error.message
        console.error('Erro ao fechar pedido:', error)
        throw error
      }
    },

    startRealtimeSubscription() {
      if (this.subscription) return

      this.subscription = subscribeToOrders((payload) => {
        if (payload.eventType === 'INSERT') {
          this.orders.push(payload.new)
        } else if (payload.eventType === 'UPDATE') {
          const index = this.orders.findIndex(o => o.id === payload.new.id)
          if (index !== -1) {
            this.orders[index] = payload.new
          }
        } else if (payload.eventType === 'DELETE') {
          const index = this.orders.findIndex(o => o.id === payload.old.id)
          if (index !== -1) {
            this.orders.splice(index, 1)
          }
        }
      })
    },

    stopRealtimeSubscription() {
      if (this.subscription) {
        this.subscription.unsubscribe()
        this.subscription = null
      }
    }
  }
})