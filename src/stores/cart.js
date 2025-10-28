// stores/cart.js
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { supabase, TABLES } from '@/services/supabase'

export const useCartStore = defineStore('cart', () => {
  // ========================================
  // ESTADO
  // ========================================
  const carts = ref({}) // { [tableId]: { items: [], discount: 0, payment: '', isPersisted: false, history: [] } }
  const currentTableId = ref(null)
  const syncInProgress = ref(false)
  
  // Configurações
  const CART_EXPIRATION_HOURS = 24 // Carrinhos não persistidos expiram em 24h
  const SYNC_DEBOUNCE_MS = 1000 // Debounce para sincronização

  // ========================================
  // PERSISTÊNCIA LOCALSTORAGE
  // ========================================
  function saveToLocalStorage() {
    try {
      localStorage.setItem('carts', JSON.stringify(carts.value))
      localStorage.setItem('currentTableId', currentTableId.value || '')
      console.log('💾 Carrinho salvo no localStorage')
    } catch (error) {
      console.error('❌ Erro ao salvar carrinho:', error)
    }
  }

  function loadFromLocalStorage() {
    try {
      const savedCarts = localStorage.getItem('carts')
      const savedTableId = localStorage.getItem('currentTableId')
      
      if (savedCarts) {
        carts.value = JSON.parse(savedCarts)
        cleanExpiredCarts() // Limpa carrinhos expirados ao carregar
      }
      
      if (savedTableId) {
        currentTableId.value = savedTableId
      }
      
      console.log('✅ Carrinho carregado do localStorage')
    } catch (error) {
      console.error('❌ Erro ao carregar carrinho:', error)
    }
  }

  // ========================================
  // LIMPEZA DE CARRINHOS EXPIRADOS
  // ========================================
  function cleanExpiredCarts() {
    const now = new Date().getTime()
    const expirationMs = CART_EXPIRATION_HOURS * 60 * 60 * 1000
    let cleanedCount = 0

    Object.keys(carts.value).forEach(tableId => {
      const cart = carts.value[tableId]
      
      // Remove carrinhos não persistidos antigos
      if (!cart.isPersisted && cart.createdAt) {
        const cartAge = now - new Date(cart.createdAt).getTime()
        if (cartAge > expirationMs) {
          delete carts.value[tableId]
          cleanedCount++
          console.log(`🧹 Carrinho expirado removido: Mesa ${tableId}`)
        }
      }
    })

    if (cleanedCount > 0) {
      saveToLocalStorage()
      console.log(`✅ ${cleanedCount} carrinho(s) expirado(s) removido(s)`)
    }
  }

  // ========================================
  // SINCRONIZAÇÃO COM SUPABASE
  // ========================================
  let syncTimeout = null

  async function syncWithBackend(tableId) {
    if (syncInProgress.value) return
    
    // Debounce: espera 1 segundo após última modificação
    clearTimeout(syncTimeout)
    
    syncTimeout = setTimeout(async () => {
      try {
        syncInProgress.value = true
        const cart = carts.value[tableId]
        
        if (!cart || !cart.isPersisted) {
          console.log('⏭️ Carrinho não persistido, ignorando sync')
          return
        }

        // Salva snapshot do carrinho no Supabase
        const { data, error } = await supabase
          .from(TABLES.CART_SNAPSHOTS || 'cart_snapshots')
          .upsert({
            mesa_id: parseInt(tableId),
            items: cart.items,
            discount_type: cart.discountType,
            discount_value: cart.discountValue,
            selected_payment: cart.selectedPayment,
            subtotal: computeSubtotal(cart),
            total: computeTotal(cart),
            updated_at: new Date().toISOString()
          }, { onConflict: 'mesa_id' })

        if (error) {
          console.error('❌ Erro ao sincronizar:', error)
        } else {
          console.log('☁️ Carrinho sincronizado com backend:', tableId)
        }
      } catch (error) {
        console.error('❌ Erro na sincronização:', error)
      } finally {
        syncInProgress.value = false
      }
    }, SYNC_DEBOUNCE_MS)
  }

  async function loadFromBackend(tableId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.CART_SNAPSHOTS || 'cart_snapshots')
        .select('*')
        .eq('mesa_id', parseInt(tableId))
        .single()

      if (error) {
        if (error.code !== 'PGRST116') { // Não é erro de "não encontrado"
          console.error('❌ Erro ao carregar do backend:', error)
        }
        return null
      }

      if (data) {
        console.log('☁️ Carrinho carregado do backend:', tableId)
        return {
          items: data.items || [],
          discountType: data.discount_type || 'percentage',
          discountValue: data.discount_value || 0,
          selectedPayment: data.selected_payment || 'dinheiro',
          isPersisted: true,
          openedAt: data.updated_at
        }
      }

      return null
    } catch (error) {
      console.error('❌ Erro ao carregar do backend:', error)
      return null
    }
  }

  // ========================================
  // HELPERS DE CÁLCULO
  // ========================================
  function computeSubtotal(cart) {
    return cart.items.reduce((total, item) => {
      return total + (item.product.preco * item.quantity)
    }, 0)
  }

  function computeDiscountAmount(cart) {
    const subtotal = computeSubtotal(cart)
    if (cart.discountType === 'percentage') {
      return (subtotal * cart.discountValue) / 100
    }
    return cart.discountValue
  }

  function computeTotal(cart) {
    const subtotal = computeSubtotal(cart)
    const discount = computeDiscountAmount(cart)
    return Math.max(0, subtotal - discount)
  }

  // ========================================
  // HISTÓRICO DE ALTERAÇÕES
  // ========================================
  function addToHistory(tableId, action, details, userId = 'system') {
    const cart = carts.value[tableId]
    if (!cart) return

    if (!cart.history) {
      cart.history = []
    }

    cart.history.push({
      timestamp: new Date().toISOString(),
      action,
      details,
      userId
    })

    // Mantém apenas últimas 50 alterações
    if (cart.history.length > 50) {
      cart.history = cart.history.slice(-50)
    }

    console.log(`📝 Histórico: ${action}`, details)
  }

  // ========================================
  // GETTERS COMPUTADOS
  // ========================================
  const currentCart = computed(() => {
    if (!currentTableId.value) return null
    return carts.value[currentTableId.value] || null
  })

  const cartItems = computed(() => {
    return currentCart.value?.items || []
  })

  const cartItemsCount = computed(() => {
    return cartItems.value.reduce((total, item) => total + item.quantity, 0)
  })

  const discountType = computed({
    get: () => currentCart.value?.discountType || 'percentage',
    set: (value) => {
      if (currentTableId.value) {
        carts.value[currentTableId.value].discountType = value
        saveToLocalStorage()
      }
    }
  })

  const discountValue = computed({
    get: () => currentCart.value?.discountValue || 0,
    set: (value) => {
      if (currentTableId.value) {
        const cart = carts.value[currentTableId.value]
        const subtotal = computeSubtotal(cart)
        
        // ✅ VALIDAÇÃO: Desconto não pode ser maior que subtotal
        if (cart.discountType === 'percentage') {
          value = Math.min(Math.max(0, value), 100)
        } else {
          value = Math.min(Math.max(0, value), subtotal)
        }
        
        cart.discountValue = value
        addToHistory(currentTableId.value, 'DISCOUNT_CHANGED', {
          type: cart.discountType,
          value
        })
        saveToLocalStorage()
        syncWithBackend(currentTableId.value)
      }
    }
  })

  const selectedPayment = computed({
    get: () => currentCart.value?.selectedPayment || 'dinheiro',
    set: (value) => {
      if (currentTableId.value) {
        carts.value[currentTableId.value].selectedPayment = value
        saveToLocalStorage()
      }
    }
  })

  const subtotal = computed(() => {
    if (!currentCart.value) return 0
    return computeSubtotal(currentCart.value)
  })

  const discountAmount = computed(() => {
    if (!currentCart.value) return 0
    return computeDiscountAmount(currentCart.value)
  })

  const total = computed(() => {
    if (!currentCart.value) return 0
    return computeTotal(currentCart.value)
  })

  const isEmpty = computed(() => {
    return cartItems.value.length === 0
  })

  const isCartPersisted = computed(() => {
    return currentCart.value?.isPersisted || false
  })

  // ========================================
  // ACTIONS
  // ========================================
  async function initializeTable(tableId, userId = 'system') {
  const id = String(tableId)
  console.log('🎯 Inicializando mesa:', id)
  
  // ✅ CORREÇÃO: Verifica se já existe carrinho LOCAL PRIMEIRO
  if (carts.value[id]) {
    console.log('📦 Carrinho local encontrado para mesa', id)
    currentTableId.value = id
    return
  }
  
  currentTableId.value = id
  
  // Tenta carregar do backend (se persistido)
  const backendCart = await loadFromBackend(id)
  
  if (backendCart) {
    carts.value[id] = {
      ...backendCart,
      createdAt: backendCart.openedAt || new Date().toISOString(),
      history: []
    }
    console.log('☁️ Carrinho carregado do backend para mesa', id)
    saveToLocalStorage()
    return
  }
  
  // Cria novo carrinho apenas se não existe em lugar nenhum
  carts.value[id] = {
    items: [],
    discountType: 'percentage',
    discountValue: 0,
    selectedPayment: 'dinheiro',
    isPersisted: false,
    openedAt: null,
    createdAt: new Date().toISOString(),
    history: []
  }
  
  addToHistory(id, 'CART_CREATED', { tableId: id }, userId)
  console.log('✅ Novo carrinho criado para mesa:', id)
  saveToLocalStorage()
}

  function addToCart(product, userId = 'system') {
    if (!currentTableId.value) {
      console.error('❌ Mesa não inicializada!')
      return false
    }

    const cart = carts.value[currentTableId.value]
    const existingItem = cart.items.find(item => item.product.id === product.id)

    if (existingItem) {
      if (existingItem.quantity < product.estoque_atual) {
        existingItem.quantity++
        addToHistory(currentTableId.value, 'QUANTITY_INCREASED', {
          productId: product.id,
          productName: product.nome,
          newQuantity: existingItem.quantity
        }, userId)
        console.log('➕ Quantidade aumentada:', existingItem.product.nome, 'x', existingItem.quantity)
      } else {
        console.warn('⚠️ Estoque insuficiente para:', product.nome)
        return false
      }
    } else {
      if (product.estoque_atual > 0) {
        cart.items.push({
          product: { ...product },
          quantity: 1,
          addedAt: new Date().toISOString(),
          addedBy: userId
        })
        addToHistory(currentTableId.value, 'ITEM_ADDED', {
          productId: product.id,
          productName: product.nome,
          price: product.preco
        }, userId)
        console.log('✅ Produto adicionado ao carrinho:', product.nome)
      } else {
        console.warn('⚠️ Produto sem estoque:', product.nome)
        return false
      }
    }
    
    carts.value = { ...carts.value }
    saveToLocalStorage()
    syncWithBackend(currentTableId.value)
    return true
  }

  function removeFromCart(productId, userId = 'system') {
    if (!currentTableId.value) return
    
    const cart = carts.value[currentTableId.value]
    const indexToRemove = cart.items.findIndex(item => item.product.id === productId)
    
    if (indexToRemove !== -1) {
      const removedItem = cart.items[indexToRemove]
      cart.items.splice(indexToRemove, 1)
      
      addToHistory(currentTableId.value, 'ITEM_REMOVED', {
        productId: removedItem.product.id,
        productName: removedItem.product.nome,
        quantity: removedItem.quantity
      }, userId)
      
      console.log('🗑️ Produto removido do carrinho:', removedItem.product.nome)
      
      carts.value = { ...carts.value }
      saveToLocalStorage()
      syncWithBackend(currentTableId.value)
    }
  }

  function updateQuantity(productId, quantity, userId = 'system') {
    if (!currentTableId.value) return false
    
    const cart = carts.value[currentTableId.value]
    const item = cart.items.find(item => item.product.id === productId)
    
    if (item) {
      if (quantity <= 0) {
        removeFromCart(productId, userId)
        return true
      }
      
      if (quantity > item.product.estoque_atual) {
        console.warn('⚠️ Quantidade excede estoque disponível')
        return false
      }
      
      const oldQuantity = item.quantity
      item.quantity = quantity
      
      addToHistory(currentTableId.value, 'QUANTITY_UPDATED', {
        productId: item.product.id,
        productName: item.product.nome,
        oldQuantity,
        newQuantity: quantity
      }, userId)
      
      console.log('🔄 Quantidade atualizada:', item.product.nome, 'x', quantity)
      
      carts.value = { ...carts.value }
      saveToLocalStorage()
      syncWithBackend(currentTableId.value)
      return true
    }
    
    return false
  }

  function increaseQuantity(productId, userId = 'system') {
    if (!currentTableId.value) return false
    
    const cart = carts.value[currentTableId.value]
    const item = cart.items.find(item => item.product.id === productId)
    
    if (item && item.quantity < item.product.estoque_atual) {
      item.quantity++
      addToHistory(currentTableId.value, 'QUANTITY_INCREASED', {
        productId: item.product.id,
        productName: item.product.nome,
        newQuantity: item.quantity
      }, userId)
      carts.value = { ...carts.value }
      saveToLocalStorage()
      syncWithBackend(currentTableId.value)
      return true
    }
    
    return false
  }

  function decreaseQuantity(productId, userId = 'system') {
    if (!currentTableId.value) return false
    
    const cart = carts.value[currentTableId.value]
    const item = cart.items.find(item => item.product.id === productId)
    
    if (item) {
      if (item.quantity > 1) {
        item.quantity--
        addToHistory(currentTableId.value, 'QUANTITY_DECREASED', {
          productId: item.product.id,
          productName: item.product.nome,
          newQuantity: item.quantity
        }, userId)
        carts.value = { ...carts.value }
        saveToLocalStorage()
        syncWithBackend(currentTableId.value)
      } else {
        removeFromCart(productId, userId)
      }
      return true
    }
    
    return false
  }

  function setDiscount(type, value, userId = 'system') {
    if (!currentTableId.value) return
    
    const cart = carts.value[currentTableId.value]
    const subtotal = computeSubtotal(cart)
    
    // ✅ VALIDAÇÃO: Limita desconto
    if (type === 'percentage') {
      value = Math.min(Math.max(0, value), 100)
    } else {
      value = Math.min(Math.max(0, value), subtotal)
    }
    
    cart.discountType = type
    cart.discountValue = value
    
    addToHistory(currentTableId.value, 'DISCOUNT_APPLIED', {
      type,
      value
    }, userId)
    
    console.log('💰 Desconto aplicado:', type, value)
    carts.value = { ...carts.value }
    saveToLocalStorage()
    syncWithBackend(currentTableId.value)
  }

  function setPaymentMethod(method, userId = 'system') {
    if (!currentTableId.value) return
    
    const cart = carts.value[currentTableId.value]
    cart.selectedPayment = method
    
    addToHistory(currentTableId.value, 'PAYMENT_METHOD_CHANGED', {
      method
    }, userId)
    
    console.log('💳 Forma de pagamento:', method)
    carts.value = { ...carts.value }
    saveToLocalStorage()
    syncWithBackend(currentTableId.value)
  }

  function persistCart(userId = 'system') {
    if (!currentTableId.value) return false
    
    const cart = carts.value[currentTableId.value]
    
    if (!cart || cart.items.length === 0) {
      console.warn('⚠️ Carrinho vazio, não pode persistir')
      return false
    }
    
    cart.isPersisted = true
    cart.openedAt = new Date().toISOString()
    
    addToHistory(currentTableId.value, 'CART_PERSISTED', {
      itemCount: cart.items.length,
      total: computeTotal(cart)
    }, userId)
    
    console.log('📌 Comanda aberta para mesa:', currentTableId.value)
    carts.value = { ...carts.value }
    saveToLocalStorage()
    syncWithBackend(currentTableId.value)
    
    return true
  }

  function getCartData() {
    if (!currentTableId.value) return null
    
    const cart = carts.value[currentTableId.value]
    
    if (!cart || cart.items.length === 0) {
      console.warn('⚠️ Carrinho vazio')
      return null
    }
    
    const data = {
      tableId: currentTableId.value,
      items: cart.items.map(item => ({
        produto_id: item.product.id,
        nome: item.product.nome,
        preco_unitario: item.product.preco,
        quantidade: item.quantity,
        subtotal: item.product.preco * item.quantity
      })),
      discountType: cart.discountType,
      discountValue: cart.discountValue,
      selectedPayment: cart.selectedPayment,
      subtotal: computeSubtotal(cart),
      desconto: computeDiscountAmount(cart),
      total: computeTotal(cart),
      openedAt: cart.openedAt,
      history: cart.history || []
    }
    
    console.log('📄 Dados do carrinho:', data)
    return data
  }

  async function finalizeCartAfterPayment(tableId = null, userId = 'system') {
    const id = tableId || currentTableId.value
    
    if (!id) {
      console.warn('⚠️ ID da mesa não fornecido')
      return false
    }
    
    console.log('✅ Finalizando carrinho da mesa:', id)
    
    // Remove do backend
    try {
      await supabase
        .from(TABLES.CART_SNAPSHOTS || 'cart_snapshots')
        .delete()
        .eq('mesa_id', parseInt(id))
      
      console.log('☁️ Carrinho removido do backend')
    } catch (error) {
      console.error('❌ Erro ao remover do backend:', error)
    }
    
    // Remove o carrinho local
    delete carts.value[id]
    
    // Se for a mesa atual, limpa a referência
    if (currentTableId.value === id) {
      currentTableId.value = null
    }
    
    saveToLocalStorage()
    return true
  }

  function clearCart(userId = 'system') {
    if (!currentTableId.value) return
    
    const cart = carts.value[currentTableId.value]
    const itemCount = cart.items.length
    
    cart.items = []
    cart.discountValue = 0
    cart.selectedPayment = 'dinheiro'
    cart.isPersisted = false
    cart.openedAt = null
    
    addToHistory(currentTableId.value, 'CART_CLEARED', {
      itemsCleared: itemCount
    }, userId)
    
    console.log('🧹 Carrinho limpo')
    carts.value = { ...carts.value }
    saveToLocalStorage()
    syncWithBackend(currentTableId.value)
  }

  function getCartByTable(tableId) {
    return carts.value[tableId] || null
  }

  function hasOpenOrder(tableId) {
    const cart = carts.value[tableId]
    return cart && cart.items.length > 0 && cart.isPersisted
  }

  function getTableTotal(tableId) {
    const cart = carts.value[tableId]
    if (!cart || cart.items.length === 0) return 0
    return computeTotal(cart)
  }

  function getTableHistory(tableId) {
    const cart = carts.value[tableId]
    return cart?.history || []
  }

  function clearAllCarts() {
    carts.value = {}
    currentTableId.value = null
    
    try {
      localStorage.removeItem('carts')
      localStorage.removeItem('currentTableId')
    } catch (error) {
      console.error('❌ Erro ao limpar localStorage:', error)
    }
    
    console.log('🧹 Todos os carrinhos limpos')
  }

  // ========================================
  // INICIALIZAÇÃO
  // ========================================
  loadFromLocalStorage()
  
  // Limpa carrinhos expirados a cada hora
  setInterval(cleanExpiredCarts, 60 * 60 * 1000)

  return {
    // State
    carts,
    currentTableId,
    syncInProgress,
    
    // Computed
    currentCart,
    cartItems,
    cartItemsCount,
    discountType,
    discountValue,
    selectedPayment,
    subtotal,
    discountAmount,
    total,
    isEmpty,
    isCartPersisted,

    // Actions
    initializeTable,
    addToCart,
    removeFromCart,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    setDiscount,
    setPaymentMethod,
    persistCart,
    getCartData,
    finalizeCartAfterPayment,
    clearCart,
    getCartByTable,
    hasOpenOrder,
    getTableTotal,
    getTableHistory,
    clearAllCarts,
    loadFromLocalStorage,
    saveToLocalStorage,
    cleanExpiredCarts,
    syncWithBackend,
    loadFromBackend
  }
})
