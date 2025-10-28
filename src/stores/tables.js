// stores/tables.js
import { defineStore } from 'pinia'
import { supabase, TABLES, subscribeToTables } from '@/services/supabase'
import { syncService } from '@/services/syncService'

// ✅ API de Mesas usando syncService
const tablesAPI = {
  async getAll() {
    // ✅ CORRIGIDO: Buscar mesas e pedidos separadamente
    const { data: mesasData, error: mesasError } = await supabase
      .from(TABLES.MESAS)
      .select('*')
      .order('numero', { ascending: true })
    
    if (mesasError) throw mesasError
    
    console.log('📋 Mesas encontradas:', mesasData.length)
    
    // ✅ CORRIGIDO: Buscar de pwa_pedidos (não pwa_orders)
    const { data: ordersData, error: ordersError } = await supabase
      .from(TABLES.PEDIDOS || 'pwa_pedidos')
      .select('*')
    
    if (ordersError) {
      console.error('❌ Erro ao buscar pedidos:', ordersError)
      throw ordersError
    }
    
    console.log('📦 Pedidos encontrados:', ordersData?.length || 0)
    console.log('🔍 Primeiros 3 pedidos:', ordersData?.slice(0, 3))
    
    // Mapear pedidos às mesas
    return mesasData.map(mesa => ({
      ...mesa,
      orders: (ordersData || []).filter(order => order.mesa_id === mesa.id)
    }))
  },

  async getById(id) {
    // Buscar mesa
    const { data: mesaData, error: mesaError } = await supabase
      .from(TABLES.MESAS)
      .select('*')
      .eq('id', id)
      .single()
    
    if (mesaError) throw mesaError
    
    // Buscar pedidos da mesa (de pwa_pedidos)
    const { data: ordersData, error: ordersError } = await supabase
      .from(TABLES.PEDIDOS || 'pwa_pedidos')
      .select('*')
      .eq('mesa_id', id)
    
    if (ordersError) throw ordersError
    
    return {
      ...mesaData,
      orders: ordersData || []
    }
  },

  // ✅ INTEGRADO: Usando syncService para atualizar status
  async updateStatus(tableId, status) {
    const result = await syncService.update(TABLES.MESAS, tableId, { status })
    
    if (result.offline) {
      console.log('📴 Operação salva para sincronização posterior')
      return { ...result.data, status }
    }
    
    if (result.error) throw result.error
    return result.data?.[0] || { id: tableId, status }
  },

  // ✅ INTEGRADO: Usando syncService para criar mesa
  async create(tableData) {
    const result = await syncService.insert(TABLES.MESAS, tableData)
    
    if (result.offline) {
      console.log('📴 Mesa será criada quando voltar online')
      return { ...tableData, id: `temp_${Date.now()}`, offline: true }
    }
    
    if (result.error) throw result.error
    return result.data?.[0] || result.data
  },

  // ✅ INTEGRADO: Usando syncService para atualizar mesa
  async update(tableId, tableData) {
    const result = await syncService.update(TABLES.MESAS, tableId, tableData)
    
    if (result.offline) {
      console.log('📴 Atualização será sincronizada quando voltar online')
      return { id: tableId, ...tableData, offline: true }
    }
    
    if (result.error) throw result.error
    return result.data?.[0] || { id: tableId, ...tableData }
  },

  // ✅ INTEGRADO: Usando syncService para deletar mesa
  async delete(tableId) {
    const result = await syncService.delete(TABLES.MESAS, tableId)
    
    if (result.offline) {
      console.log('📴 Exclusão será sincronizada quando voltar online')
      return
    }
    
    if (result.error) throw result.error
  }
}

export const useTablesStore = defineStore('tables', {
  state: () => ({
    tables: [],
    loading: false,
    error: null,
    subscription: null,
    selectedTable: null,
    // ✅ NOVO: Estado de sincronização
    isOnline: syncService.checkOnlineStatus(),
    pendingSync: syncService.getPendingCount()
  }),

  getters: {
    availableTables: (state) => {
      return state.tables.filter(t => t.status === 'available')
    },

    occupiedTables: (state) => {
      return state.tables.filter(t => t.status === 'occupied')
    },

    reservedTables: (state) => {
      return state.tables.filter(t => t.status === 'reserved')
    },

    // ✅ NOVO: Getter para verificar se há operações pendentes
    hasPendingOperations: (state) => {
      return state.pendingSync > 0
    },

    // ✅ NOVO: Status da conexão
    connectionStatus: (state) => {
      if (!state.isOnline) return 'offline'
      if (state.pendingSync > 0) return 'syncing'
      return 'online'
    }
  },

  actions: {
    // ✅ NOVO: Atualizar status de conexão
    updateConnectionStatus() {
      this.isOnline = syncService.checkOnlineStatus()
      this.pendingSync = syncService.getPendingCount()
    },

    // ✅ NOVO: Forçar sincronização manual
    async forceSyncPendingOperations() {
      try {
        await syncService.syncPendingOperations()
        this.updateConnectionStatus()
        console.log('✅ Sincronização manual concluída')
      } catch (error) {
        console.error('❌ Erro na sincronização manual:', error)
      }
    },

    async fetchTables() {
      this.loading = true
      this.error = null
      try {
        const data = await tablesAPI.getAll()
        
        // ✅ CORRIGIDO: Calcular totais e pedidos ativos
        this.tables = data.map(table => ({
          ...table,
          orders: table.orders || [],
          // Calcular total da comanda (pedidos não finalizados/cancelados/pagos)
          totalComanda: (table.orders || [])
            .filter(order => 
              order.status !== 'Cancelado' && 
              order.status !== 'Finalizado' &&
              order.status !== 'Pago'
            )
            .reduce((sum, order) => sum + (order.total_price || 0), 0),
          // Contar pedidos ativos
          activePedidos: (table.orders || [])
            .filter(order => 
              order.status !== 'Cancelado' && 
              order.status !== 'Finalizado' &&
              order.status !== 'Pago'
            )
            .length
        }))
        
        console.log('✅ Mesas carregadas:', this.tables.length)
        console.log('📊 Total de pedidos:', this.tables.reduce((sum, t) => sum + t.orders.length, 0))
        
        // ✅ Atualizar status de sincronização após carregar
        this.updateConnectionStatus()
      } catch (error) {
        this.error = error.message
        console.error('❌ Erro ao buscar mesas:', error)
        this.tables = []
      } finally {
        this.loading = false
      }
    },

    async updateTableStatus(tableId, status) {
      try {
        const updatedTable = await tablesAPI.updateStatus(tableId, status)
        const table = this.tables.find(t => t.id === tableId)
        
        if (table) {
          table.status = status
          
          // ✅ Marcar como offline se necessário
          if (updatedTable.offline) {
            table.pendingSync = true
          }
        }
        
        // ✅ Atualizar contador de operações pendentes
        this.updateConnectionStatus()
        
        console.log(`✅ Status da mesa ${tableId} atualizado para ${status}`)
      } catch (error) {
        this.error = error.message
        console.error('❌ Erro ao atualizar status da mesa:', error)
        throw error
      }
    },

    getTableById(id) {
      return this.tables.find(t => t.id === id)
    },

    getTableByNumber(number) {
      return this.tables.find(t => t.numero === number)
    },

    startRealtimeSubscription() {
      if (this.subscription) {
        console.log('⚠️ Subscription já está ativa')
        return
      }

      try {
        // ✅ Inscrever em mesas e pedidos (usar TABLES.PEDIDOS)
        this.subscription = subscribeToTables([TABLES.MESAS, TABLES.PEDIDOS || 'pwa_pedidos'], (payload) => {
          console.log('🔄 Realtime update recebido:', payload)
          
          // Atualização de MESAS
          if (payload.table === TABLES.MESAS) {
            if (payload.eventType === 'INSERT') {
              this.tables.push({
                ...payload.new,
                orders: [],
                totalComanda: 0,
                activePedidos: 0
              })
              console.log(`✅ Nova mesa ${payload.new.numero} adicionada`)
            } else if (payload.eventType === 'UPDATE') {
              const index = this.tables.findIndex(t => t.id === payload.new.id)
              if (index !== -1) {
                Object.assign(this.tables[index], {
                  ...payload.new,
                  orders: this.tables[index].orders || [],
                  pendingSync: false
                })
                console.log(`✅ Mesa ${payload.new.numero} atualizada para ${payload.new.status}`)
              }
            } else if (payload.eventType === 'DELETE') {
              const index = this.tables.findIndex(t => t.id === payload.old.id)
              if (index !== -1) {
                this.tables.splice(index, 1)
                console.log(`✅ Mesa ${payload.old.numero} removida`)
              }
            }
          }
          
          // Atualização de PEDIDOS (verificar ambas as tabelas)
          if (payload.table === TABLES.PEDIDOS || payload.table === 'pwa_pedidos' || payload.table === 'pwa_orders') {
            // Recarregar mesas quando houver mudança em pedidos
            console.log('🔄 Pedido alterado, recarregando mesas...')
            this.fetchTables()
          }
          
          // ✅ Atualizar status após mudanças realtime
          this.updateConnectionStatus()
        })
        
        console.log('✅ Subscription realtime ativada para mesas e pedidos')
      } catch (error) {
        console.error('❌ Erro ao iniciar subscription:', error)
      }
    },

    stopRealtimeSubscription() {
      if (this.subscription) {
        // ✅ Chamar a função de unsubscribe retornada
        this.subscription()
        this.subscription = null
        console.log('✅ Subscription realtime desativada')
      }
    },

    selectTable(table) {
      this.selectedTable = table
    },

    clearSelectedTable() {
      this.selectedTable = null
    },

    async refreshTableStatus(tableId) {
      try {
        const updatedTable = await tablesAPI.getById(tableId)
        const index = this.tables.findIndex(t => t.id === tableId)
        if (index !== -1) {
          this.tables[index] = {
            ...updatedTable,
            orders: updatedTable.orders || [],
            totalComanda: (updatedTable.orders || [])
              .filter(order => 
                order.status !== 'Cancelado' && 
                order.status !== 'Finalizado' &&
                order.status !== 'Pago'
              )
              .reduce((sum, order) => sum + (order.total_price || 0), 0),
            activePedidos: (updatedTable.orders || [])
              .filter(order => 
                order.status !== 'Cancelado' && 
                order.status !== 'Finalizado' &&
                order.status !== 'Pago'
              )
              .length
          }
        }
        console.log(`✅ Status da mesa ${tableId} recarregado`)
        
        // ✅ Atualizar status de sincronização
        this.updateConnectionStatus()
      } catch (error) {
        console.error('❌ Erro ao recarregar status da mesa:', error)
      }
    }
  }
})
