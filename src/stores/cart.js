// stores/cart.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  // Estado
  const carts = ref({}) // { [tableId]: { items: [], discount: 0, payment: '' } }
  const currentTableId = ref(null)

  // ✅ NOVO: Persistir carrinho no localStorage
  function saveToLocalStorage() {
    try {
      localStorage.setItem('carts', JSON.stringify(carts.value))
      localStorage.setItem('currentTableId', currentTableId.value || '')
    } catch (error) {
      console.error('Erro ao salvar carrinho:', error)
    }
  }

  // ✅ NOVO: Carregar carrinho do localStorage
  function loadFromLocalStorage() {
    try {
      const savedCarts = localStorage.getItem('carts')
      const savedTableId = localStorage.getItem('currentTableId')
      
      if (savedCarts) {
        carts.value = JSON.parse(savedCarts)
      }
      
      if (savedTableId) {
        currentTableId.value = savedTableId
      }
      
      console.log('✅ Carrinho carregado do localStorage')
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error)
    }
  }

  // Getters
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

  const discountType = computed(() => {
    return currentCart.value?.discountType || 'percentage'
  })

  const discountValue = computed(() => {
    return currentCart.value?.discountValue || 0
  })

  const selectedPayment = computed(() => {
    return currentCart.value?.selectedPayment || 'dinheiro'
  })

  const subtotal = computed(() => {
    return cartItems.value.reduce((total, item) => {
      return total + (item.product.preco * item.quantity)
    }, 0)
  })

  const discountAmount = computed(() => {
    if (discountType.value === 'percentage') {
      return (subtotal.value * discountValue.value) / 100
    }
    return discountValue.value
  })

  const total = computed(() => {
    return Math.max(0, subtotal.value - discountAmount.value)
  })

  const isEmpty = computed(() => {
    return cartItems.value.length === 0
  })

  // Actions
  function initializeTable(tableId) {
    const id = String(tableId) // Garante que seja string
    console.log('🎯 Inicializando mesa:', id, 'Tipo:', typeof id)
    currentTableId.value = id
    
    if (!carts.value[id]) {
      carts.value[id] = {
        items: [],
        discountType: 'percentage',
        discountValue: 0,
        selectedPayment: 'dinheiro'
      }
    }
    
    console.log('✅ Carrinho da mesa criado:', carts.value[id])
    console.log('📍 CurrentTableId definido como:', currentTableId.value)
    
    // ✅ Salvar no localStorage
    saveToLocalStorage()
  }

  function addToCart(product) {
    if (!currentTableId.value) {
      console.error('❌ Mesa não inicializada!')
      return false
    }

    const cart = carts.value[currentTableId.value]
    const existingItem = cart.items.find(item => item.product.id === product.id)

    if (existingItem) {
      // Verifica se tem estoque disponível
      if (existingItem.quantity < product.estoque_atual) {
        existingItem.quantity++
        console.log('➕ Quantidade aumentada:', existingItem.product.nome, 'x', existingItem.quantity)
      } else {
        console.warn('⚠️ Estoque insuficiente para:', product.nome)
        return false
      }
    } else {
      // Adiciona novo item se tiver estoque
      if (product.estoque_atual > 0) {
        cart.items.push({
          product: { ...product },
          quantity: 1
        })
        console.log('✅ Produto adicionado ao carrinho:', product.nome)
        console.log('📦 Total de itens:', cart.items.length)
      } else {
        console.warn('⚠️ Produto sem estoque:', product.nome)
        return false
      }
    }
    
    // Força atualização reativa
    carts.value = { ...carts.value }
    
    // ✅ Salvar no localStorage
    saveToLocalStorage()
    
    return true
  }

  function removeFromCart(productId) {
    if (!currentTableId.value) return
    
    const cart = carts.value[currentTableId.value]
    const indexToRemove = cart.items.findIndex(item => item.product.id === productId)
    
    if (indexToRemove !== -1) {
      const removedItem = cart.items[indexToRemove]
      cart.items.splice(indexToRemove, 1)
      console.log('🗑️ Produto removido do carrinho:', removedItem.product.nome)
      
      // Força atualização reativa
      carts.value = { ...carts.value }
      
      // ✅ Salvar no localStorage
      saveToLocalStorage()
    }
  }

  function updateQuantity(productId, quantity) {
    if (!currentTableId.value) return
    
    const cart = carts.value[currentTableId.value]
    const item = cart.items.find(item => item.product.id === productId)
    
    if (item) {
      if (quantity > 0 && quantity <= item.product.estoque_atual) {
        item.quantity = quantity
        console.log('🔄 Quantidade atualizada:', item.product.nome, 'x', quantity)
      } else if (quantity <= 0) {
        removeFromCart(productId)
        return
      } else {
        console.warn('⚠️ Quantidade excede estoque disponível')
        return false
      }
      
      // Força atualização reativa
      carts.value = { ...carts.value }
      
      // ✅ Salvar no localStorage
      saveToLocalStorage()
      
      return true
    }
    
    return false
  }

  function increaseQuantity(productId) {
    if (!currentTableId.value) return
    
    const cart = carts.value[currentTableId.value]
    const item = cart.items.find(item => item.product.id === productId)
    
    if (item && item.quantity < item.product.estoque_atual) {
      item.quantity++
      
      // Força atualização reativa
      carts.value = { ...carts.value }
      
      // ✅ Salvar no localStorage
      saveToLocalStorage()
      
      return true
    }
    
    return false
  }

  function decreaseQuantity(productId) {
    if (!currentTableId.value) return
    
    const cart = carts.value[currentTableId.value]
    const item = cart.items.find(item => item.product.id === productId)
    
    if (item) {
      if (item.quantity > 1) {
        item.quantity--
        
        // Força atualização reativa
        carts.value = { ...carts.value }
        
        // ✅ Salvar no localStorage
        saveToLocalStorage()
      } else {
        removeFromCart(productId)
      }
      
      return true
    }
    
    return false
  }

  function setDiscount(type, value) {
    if (!currentTableId.value) return
    
    const cart = carts.value[currentTableId.value]
    cart.discountType = type
    cart.discountValue = value
    
    console.log('💰 Desconto aplicado:', type, value)
    
    // Força atualização reativa
    carts.value = { ...carts.value }
    
    // ✅ Salvar no localStorage
    saveToLocalStorage()
  }

  function setPaymentMethod(method) {
    if (!currentTableId.value) return
    
    const cart = carts.value[currentTableId.value]
    cart.selectedPayment = method
    
    console.log('💳 Forma de pagamento:', method)
    
    // Força atualização reativa
    carts.value = { ...carts.value }
    
    // ✅ Salvar no localStorage
    saveToLocalStorage()
  }

  function clearCart() {
    if (!currentTableId.value) return
    
    const cart = carts.value[currentTableId.value]
    cart.items = []
    cart.discountValue = 0
    cart.selectedPayment = 'dinheiro'
    
    console.log('🧹 Carrinho limpo')
    
    // Força atualização reativa
    carts.value = { ...carts.value }
    
    // ✅ Salvar no localStorage
    saveToLocalStorage()
  }

  function finalizeCart() {
    if (!currentTableId.value) return null
    
    const cart = carts.value[currentTableId.value]
    
    if (!cart || cart.items.length === 0) {
      console.warn('⚠️ Carrinho vazio, não pode finalizar')
      return null
    }
    
    const data = {
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
      subtotal: subtotal.value,
      desconto: discountAmount.value,
      total: total.value
    }
    
    console.log('✅ Carrinho finalizado:', data)
    
    // Limpar carrinho após finalizar
    delete carts.value[currentTableId.value]
    currentTableId.value = null
    
    // ✅ Salvar no localStorage
    saveToLocalStorage()
    
    return data
  }

  function getCartByTable(tableId) {
    return carts.value[tableId] || null
  }

  // ✅ NOVO: Limpar todos os carrinhos
  function clearAllCarts() {
    carts.value = {}
    currentTableId.value = null
    
    // Limpar localStorage
    try {
      localStorage.removeItem('carts')
      localStorage.removeItem('currentTableId')
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error)
    }
    
    console.log('🧹 Todos os carrinhos limpos')
  }

  // ✅ Carregar do localStorage ao inicializar
  loadFromLocalStorage()

  return {
    // State
    carts,
    currentTableId,
    
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

    // Actions
    initializeTable,
    addToCart,
    removeFromCart,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    setDiscount,
    setPaymentMethod,
    clearCart,
    finalizeCart,
    getCartByTable,
    clearAllCarts,
    loadFromLocalStorage,
    saveToLocalStorage
  }
})