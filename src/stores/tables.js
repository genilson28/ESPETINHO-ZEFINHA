// stores/tables.js
import { defineStore } from 'pinia'
import { supabase, TABLES, subscribeToTables } from '@/services/supabase'
import { syncService } from '@/services/syncService'

// ✅ API de Mesas usando syncService
const tablesAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from(TABLES.MESAS)
      .select('*')
      .order('numero', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLES.MESAS)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
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
        
        // Garantir que cada mesa tem as propriedades necessárias
        this.tables = data.map(table => ({
          ...table,
          orders: table.orders || []
        }))
        
        console.log('✅ Mesas carregadas:', this.tables.length)
        
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
        // ✅ Inscrever apenas na tabela de mesas
        this.subscription = subscribeToTables([TABLES.MESAS], (payload) => {
          console.log('🔄 Realtime update recebido:', payload)
          
          if (payload.eventType === 'INSERT') {
            this.tables.push({
              ...payload.new,
              orders: payload.new.orders || []
            })
            console.log(`✅ Nova mesa ${payload.new.numero} adicionada`)
          } else if (payload.eventType === 'UPDATE') {
            const index = this.tables.findIndex(t => t.id === payload.new.id)
            if (index !== -1) {
              // ✅ Usar Object.assign para forçar reatividade
              Object.assign(this.tables[index], {
                ...payload.new,
                orders: payload.new.orders || [],
                pendingSync: false // Limpar flag de sincronização pendente
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
          
          // ✅ Atualizar status após mudanças realtime
          this.updateConnectionStatus()
        })
        
        console.log('✅ Subscription realtime ativada para mesas')
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
            orders: updatedTable.orders || []
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