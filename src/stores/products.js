// stores/products.js
import { defineStore } from 'pinia'
import { productsAPI, categoriesAPI, TABLES, subscribeToTables } from '@/services/supabase'
import { syncService } from '@/services/syncService'

export const useProductsStore = defineStore('products', {
  state: () => ({
    products: [],
    categories: [],
    loading: false,
    error: null,
    subscription: null,
    // ✅ NOVO: Estado de sincronização
    isOnline: syncService.checkOnlineStatus(),
    pendingSync: syncService.getPendingCount()
  }),

  getters: {
    lowStockProducts: (state) => {
      return state.products.filter(p => p.estoque_atual < p.estoque_minimo)
    },
    
    productsByCategory: (state) => {
      const grouped = {}
      state.products.forEach(product => {
        const catId = product.categoria_id
        const category = state.categories.find(c => c.id === catId)
        const catName = category?.nome || 'Sem Categoria'
        
        if (!grouped[catName]) {
          grouped[catName] = {
            id: catId,
            name: catName,
            products: []
          }
        }
        grouped[catName].products.push(product)
      })
      return grouped
    },

    availableProducts: (state) => {
      return state.products.filter(p => p.estoque_atual > 0 && p.ativo !== false)
    },

    // ✅ NOVO: Produtos disponíveis por categoria
    availableProductsByCategory: (state) => {
      const grouped = {}
      const available = state.products.filter(p => p.estoque_atual > 0 && p.ativo !== false)
      
      available.forEach(product => {
        const catId = product.categoria_id
        const category = state.categories.find(c => c.id === catId)
        const catName = category?.nome || 'Sem Categoria'
        
        if (!grouped[catName]) {
          grouped[catName] = {
            id: catId,
            name: catName,
            products: []
          }
        }
        grouped[catName].products.push(product)
      })
      return grouped
    },

    // ✅ NOVO: Status da conexão
    connectionStatus: (state) => {
      if (!state.isOnline) return 'offline'
      if (state.pendingSync > 0) return 'syncing'
      return 'online'
    },

    // ✅ NOVO: Verificar se há operações pendentes
    hasPendingOperations: (state) => {
      return state.pendingSync > 0
    }
  },

  actions: {
    // ✅ NOVO: Atualizar status de conexão
    updateConnectionStatus() {
      this.isOnline = syncService.checkOnlineStatus()
      this.pendingSync = syncService.getPendingCount()
    },

    async fetchProducts() {
      this.loading = true
      this.error = null
      try {
        this.products = await productsAPI.getAll()
        console.log('✅ Produtos carregados:', this.products.length)
        
        // ✅ Atualizar status de sincronização
        this.updateConnectionStatus()
      } catch (error) {
        this.error = error.message
        console.error('❌ Erro ao buscar produtos:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchCategories() {
      try {
        this.categories = await categoriesAPI.getAll()
        console.log('✅ Categorias carregadas:', this.categories.length)
      } catch (error) {
        console.error('❌ Erro ao buscar categorias:', error)
      }
    },

    async fetchAvailableProducts() {
      this.loading = true
      this.error = null
      try {
        this.products = await productsAPI.getAvailable()
        console.log('✅ Produtos disponíveis carregados:', this.products.length)
        
        // ✅ Atualizar status de sincronização
        this.updateConnectionStatus()
      } catch (error) {
        this.error = error.message
        console.error('❌ Erro ao buscar produtos disponíveis:', error)
      } finally {
        this.loading = false
      }
    },

    // ✅ MODIFICADO: Usando syncService para atualizar estoque
    async updateStock(productId, newStock) {
      try {
        const result = await syncService.update(TABLES.PRODUTOS, productId, { 
          estoque_atual: newStock 
        })
        
        if (result.offline) {
          console.log('📴 Atualização de estoque será sincronizada quando voltar online')
        }
        
        const product = this.products.find(p => p.id === productId)
        if (product) {
          product.estoque_atual = newStock
          
          // ✅ Marcar como pendente se offline
          if (result.offline) {
            product.pendingSync = true
          }
        }
        
        // ✅ Atualizar contador de operações pendentes
        this.updateConnectionStatus()
        
        console.log(`✅ Estoque do produto ${productId} atualizado para ${newStock}`)
      } catch (error) {
        this.error = error.message
        console.error('❌ Erro ao atualizar estoque:', error)
        throw error
      }
    },

    // ✅ MODIFICADO: Usando syncService para criar produto
    async createProduct(productData) {
      try {
        const result = await syncService.insert(TABLES.PRODUTOS, productData)
        
        if (result.offline) {
          console.log('📴 Produto será criado quando voltar online')
          const tempProduct = { 
            ...productData, 
            id: `temp_${Date.now()}`, 
            offline: true,
            pendingSync: true
          }
          this.products.push(tempProduct)
          return tempProduct
        }
        
        if (result.error) throw result.error
        
        const newProduct = result.data?.[0] || result.data
        this.products.push(newProduct)
        
        // ✅ Atualizar status de sincronização
        this.updateConnectionStatus()
        
        return newProduct
      } catch (error) {
        this.error = error.message
        console.error('❌ Erro ao criar produto:', error)
        throw error
      }
    },

    // ✅ MODIFICADO: Usando syncService para atualizar produto
    async updateProduct(productId, productData) {
      try {
        const result = await syncService.update(TABLES.PRODUTOS, productId, productData)
        
        if (result.offline) {
          console.log('📴 Produto será atualizado quando voltar online')
        }
        
        const product = this.products.find(p => p.id === productId)
        if (product) {
          Object.assign(product, productData)
          
          // ✅ Marcar como pendente se offline
          if (result.offline) {
            product.pendingSync = true
          }
        }
        
        // ✅ Atualizar status de sincronização
        this.updateConnectionStatus()
        
        return result
      } catch (error) {
        this.error = error.message
        console.error('❌ Erro ao atualizar produto:', error)
        throw error
      }
    },

    // ✅ MODIFICADO: Usando syncService para deletar produto
    async deleteProduct(productId) {
      try {
        const result = await syncService.delete(TABLES.PRODUTOS, productId)
        
        if (result.offline) {
          console.log('📴 Produto será deletado quando voltar online')
        }
        
        const index = this.products.findIndex(p => p.id === productId)
        if (index !== -1) {
          // ✅ Se offline, marcar como pendente ao invés de remover
          if (result.offline) {
            this.products[index].pendingSync = true
            this.products[index].deletePending = true
          } else {
            this.products.splice(index, 1)
          }
        }
        
        // ✅ Atualizar status de sincronização
        this.updateConnectionStatus()
      } catch (error) {
        this.error = error.message
        console.error('❌ Erro ao deletar produto:', error)
        throw error
      }
    },

    getProductById(id) {
      return this.products.find(p => p.id === id)
    },

    getProductsByCategory(categoryId) {
      return this.products.filter(p => p.categoria_id === categoryId)
    },

    // ✅ NOVO: Iniciar subscription realtime
    startRealtimeSubscription() {
      if (this.subscription) {
        console.log('⚠️ Subscription já está ativa')
        return
      }

      try {
        this.subscription = subscribeToTables([TABLES.PRODUTOS, TABLES.CATEGORIAS], (payload) => {
          console.log('🔄 Realtime update recebido:', payload)
          
          if (payload.table === TABLES.PRODUTOS) {
            this.handleProductUpdate(payload)
          } else if (payload.table === TABLES.CATEGORIAS) {
            this.handleCategoryUpdate(payload)
          }
          
          // ✅ Atualizar status após mudanças realtime
          this.updateConnectionStatus()
        })
        
        console.log('✅ Subscription realtime ativada para produtos e categorias')
      } catch (error) {
        console.error('❌ Erro ao iniciar subscription:', error)
      }
    },

    handleProductUpdate(payload) {
      if (payload.eventType === 'INSERT') {
        this.products.push(payload.new)
        console.log(`✅ Novo produto ${payload.new.nome} adicionado`)
      } else if (payload.eventType === 'UPDATE') {
        const index = this.products.findIndex(p => p.id === payload.new.id)
        if (index !== -1) {
          Object.assign(this.products[index], {
            ...payload.new,
            pendingSync: false // Limpar flag de sincronização pendente
          })
          console.log(`✅ Produto ${payload.new.nome} atualizado`)
        }
      } else if (payload.eventType === 'DELETE') {
        const index = this.products.findIndex(p => p.id === payload.old.id)
        if (index !== -1) {
          this.products.splice(index, 1)
          console.log(`✅ Produto removido`)
        }
      }
    },

    handleCategoryUpdate(payload) {
      if (payload.eventType === 'INSERT') {
        this.categories.push(payload.new)
        console.log(`✅ Nova categoria ${payload.new.nome} adicionada`)
      } else if (payload.eventType === 'UPDATE') {
        const index = this.categories.findIndex(c => c.id === payload.new.id)
        if (index !== -1) {
          Object.assign(this.categories[index], payload.new)
          console.log(`✅ Categoria ${payload.new.nome} atualizada`)
        }
      } else if (payload.eventType === 'DELETE') {
        const index = this.categories.findIndex(c => c.id === payload.old.id)
        if (index !== -1) {
          this.categories.splice(index, 1)
          console.log(`✅ Categoria removida`)
        }
      }
    },

    // ✅ NOVO: Parar subscription
    stopRealtimeSubscription() {
      if (this.subscription) {
        this.subscription()
        this.subscription = null
        console.log('✅ Subscription realtime desativada')
      }
    },

    // ✅ NOVO: Forçar sincronização manual
    async forceSyncPendingOperations() {
      try {
        await syncService.syncPendingOperations()
        this.updateConnectionStatus()
        
        // Limpar flags de sincronização pendente
        this.products.forEach(p => {
          if (p.pendingSync) {
            p.pendingSync = false
          }
        })
        
        console.log('✅ Sincronização manual concluída')
      } catch (error) {
        console.error('❌ Erro na sincronização manual:', error)
      }
    }
  }
})