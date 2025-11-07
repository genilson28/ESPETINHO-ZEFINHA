<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useNavigationStore } from '@/stores/navigation'
import { useUserStore } from '@/stores/user'
import { ShoppingCart, Plus, Search, X, Utensils, Coffee, ChefHat, Package, Minus, Trash2, ArrowLeft, Check, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Sparkles, Clock, Banknote, CreditCard, Smartphone } from 'lucide-vue-next'
import { supabase, TABLES } from '@/services/supabase'
import { syncService } from '@/services/syncService'

const router = useRouter()
const route = useRoute()
const cartStore = useCartStore()
const navigationStore = useNavigationStore()
const userStore = useUserStore()

const tableId = ref(null)
const tableNumber = ref(null)

const products = ref([])
const tables = ref([])
const searchQuery = ref('')
const selectedCategory = ref('all')
const currentPage = ref(1)
const productsPerPage = 20
const currentCartPage = ref(1)
const itemsPerCartPage = 4

const paymentMethods = [
  { id: 'dinheiro', name: 'Dinheiro', icon: 'banknote' },
  { id: 'debito', name: 'Débito', icon: 'credit-card' },
  { id: 'credito', name: 'Crédito', icon: 'credit-card' },
  { id: 'pix', name: 'PIX', icon: 'smartphone' }
]

onMounted(async () => {
  tableId.value = route.query.mesaId || route.query.mesa
  tableNumber.value = route.query.mesaNumero
  
  const mode = route.query.mode
  
  if (!tableId.value && mode !== 'balcao') {
    alert('Mesa não especificada!')
    router.push('/dashboard-garcom')
    return
  }

  if (!cartStore.getCartByTable(tableId.value)) {
    await cartStore.initializeTable(tableId.value)
  } else {
    cartStore.currentTableId = tableId.value
  }
  
  const from = route.query.from || navigationStore.currentContext.from || 'tables'
  navigationStore.setContext({
    from: from,
    tableId: tableId.value,
    tableNumber: tableNumber.value,
    returnTo: from === 'dashboard' ? 'dashboard' : 'tables'
  })
  navigationStore.addToHistory(route)

  await fetchProducts()
  await fetchTables()
})

watch(() => cartStore.cartItems.length, async (newLength, oldLength) => {
  if (oldLength === 0 && newLength > 0) await updateTableStatusOccupied()
  else if (oldLength > 0 && newLength === 0) await updateTableStatusAvailable()
})

async function updateTableStatusOccupied() {
  try {
    await syncService.update(TABLES.MESAS, parseInt(tableId.value), { status: 'occupied' })
  } catch (error) {
    console.error('Erro ao marcar mesa como ocupada:', error)
  }
}

async function updateTableStatusAvailable() {
  try {
    await syncService.update(TABLES.MESAS, parseInt(tableId.value), { status: 'available' })
  } catch (error) {
    console.error('Erro ao marcar mesa como disponível:', error)
  }
}

const categories = computed(() => {
  const cats = ['all', ...new Set(products.value.map(p => p.categoria))]
  return cats.filter(cat => cat).map(cat => ({
    id: cat,
    name: getCategoryName(cat),
    icon: cat === 'espetinho' ? 'utensils' : cat === 'bebida' ? 'coffee' : cat === 'acompanhamento' ? 'chef-hat' : 'package'
  }))
})

const filteredProducts = computed(() => {
  let filtered = products.value
  if (selectedCategory.value !== 'all') filtered = filtered.filter(p => p.categoria === selectedCategory.value)
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p => p.nome.toLowerCase().includes(query) || p.descricao?.toLowerCase().includes(query))
  }
  return filtered
})

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / productsPerPage))
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * productsPerPage
  return filteredProducts.value.slice(start, start + productsPerPage)
})

const totalCartPages = computed(() => Math.ceil(cartStore.cartItems.length / itemsPerCartPage))
const paginatedCartItems = computed(() => {
  const start = (currentCartPage.value - 1) * itemsPerCartPage
  return cartStore.cartItems.slice(start, start + itemsPerCartPage)
})

const cartItemsCount = computed(() => cartStore.cartItems.length)

const formatPrice = (price) => parseFloat(price).toFixed(2).replace('.', ',')

const getCategoryName = (category) => {
  const names = { 'all': 'Todos', 'espetinho': 'Espetinhos', 'bebida': 'Bebidas', 'acompanhamento': 'Acompanhamentos' }
  return names[category] || category
}

const getTableNumber = (tableId) => {
  const table = tables.value.find(t => t.id === parseInt(tableId))
  return table?.numero || tableNumber.value || tableId || 'N/A'
}

const getProductQuantity = (productId) => {
  const item = cartStore.cartItems.find(item => item.product.id === productId)
  return item ? item.quantity : 0
}

const getCategoryIcon = (category) => {
  if (category === 'espetinho') return 'utensils'
  if (category === 'bebida') return 'coffee'
  if (category === 'acompanhamento') return 'chef-hat'
  return 'package'
}

const goBack = () => {
  if (cartStore.isCartPersisted) {
    router.push('/dashboard-garcom')
    return
  }
  
  if (cartStore.cartItems.length > 0) {
    const userChoice = confirm('Deseja manter os itens no carrinho? Clique em "OK" para manter ou "Cancelar" para limpar.')
    
    if (userChoice) {
      cartStore.persistCart()
    } else {
      cartStore.clearCart()
    }
  }
  
  router.push('/dashboard-garcom')
}

const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }
const previousPage = () => { if (currentPage.value > 1) currentPage.value-- }
const nextCartPage = () => { if (currentCartPage.value < totalCartPages.value) currentCartPage.value++ }
const previousCartPage = () => { if (currentCartPage.value > 1) currentCartPage.value-- }

const addToCart = (product) => {
  if (product.estoque_atual <= 0) {
    alert('Produto sem estoque!')
    return
  }
  
  const existingItem = cartStore.cartItems.find(item => item.product.id === product.id)
  if (existingItem && existingItem.quantity >= product.estoque_atual) {
    alert(`Estoque insuficiente! Apenas ${product.estoque_atual} disponíveis.`)
    return
  }
  
  cartStore.addToCart(product)
}

const incrementQuantity = (productId) => {
  const item = cartStore.cartItems.find(i => i.product.id === productId)
  if (!item) return
  
  if (item.quantity >= item.product.estoque_atual) {
    alert(`Estoque insuficiente! Apenas ${item.product.estoque_atual} disponíveis.`)
    return
  }
  
  cartStore.updateQuantity(productId, item.quantity + 1)
}

const decrementQuantity = (productId) => {
  const item = cartStore.cartItems.find(i => i.product.id === productId)
  if (!item) return
  
  const newQty = item.quantity - 1
  if (newQty <= 0) {
    if (confirm('Remover item do carrinho?')) {
      cartStore.removeFromCart(productId)
    }
  } else {
    cartStore.updateQuantity(productId, newQty)
  }
}

const removeFromCart = (productId) => {
  if (confirm('Remover item do carrinho?')) {
    cartStore.removeFromCart(productId)
  }
}

const clearCartConfirm = () => {
  if (confirm('Tem certeza que deseja limpar o carrinho?')) {
    cartStore.clearCart()
  }
}

async function finalizeOrder() {
  if (cartStore.cartItems.length === 0) {
    alert('Carrinho vazio!')
    return
  }
  
  if (!cartStore.selectedPayment) {
    alert('Selecione uma forma de pagamento!')
    return
  }
  
  try {
    const orderData = {
      mesa_id: parseInt(tableId.value),
      itens: cartStore.cartItems.map(item => ({
        produto_id: item.product.id,
        quantidade: item.quantity,
        preco_unitario: item.product.preco,
        subtotal: item.product.preco * item.quantity
      })),
      valor_total: cartStore.total,
      status: 'confirmado',
      observacoes: `Pagamento: ${cartStore.selectedPayment}. Desconto: R$ ${cartStore.discountAmount.toFixed(2)}`
    }

    const { data, error } = await supabase
      .from(TABLES.PEDIDOS)
      .insert(orderData)
      .select()
      .single()
      
    if (error) throw error

    for (const item of cartStore.cartItems) {
      const newStock = item.product.estoque_atual - item.quantity
      const { error: stockError } = await supabase
        .from(TABLES.PRODUTOS)
        .update({ estoque_atual: newStock })
        .eq('id', item.product.id)
      if (stockError) console.error('Erro ao atualizar estoque:', stockError)
    }

    alert('Pedido registrado com sucesso!')
    
    await cartStore.finalizeCartAfterPayment(tableId.value)
    await fetchProducts()
    
    router.push('/dashboard-garcom')
  } catch (error) {
    console.error('Erro ao finalizar pedido:', error)
    alert('Erro ao registrar pedido. Tente novamente.')
  }
}

async function fetchProducts() {
  try {
    const { data, error } = await supabase.from(TABLES.PRODUTOS).select('*').order('nome')
    if (error) throw error
    products.value = data || []
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
  }
}

async function fetchTables() {
  try {
    const { data, error } = await supabase.from(TABLES.MESAS).select('*').order('numero')
    if (error) throw error
    tables.value = data || []
  } catch (error) {
    console.error('Erro ao buscar mesas:', error)
  }
}
</script>

<template>
  <div class="pdv-mobile">
    <!-- Header Mobile -->
    <div class="mobile-header">
      <div class="header-top">
        <button @click="goBack" class="btn-back">
          <ArrowLeft :size="24" />
        </button>
        <div class="header-info">
          <h1 class="title">Mesa {{ getTableNumber(tableId) }}</h1>
          <div class="total-badge">R$ {{ formatPrice(cartStore.total) }}</div>
        </div>
        <div class="cart-indicator">
          <ShoppingCart :size="24" />
          <span v-if="cartItemsCount > 0" class="badge">{{ cartItemsCount }}</span>
        </div>
      </div>
    </div>

    <!-- Busca -->
    <div class="search-section">
      <div class="search-box">
        <Search :size="20" class="search-icon" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar produtos..." 
          class="search-input"
        />
        <button v-if="searchQuery" @click="searchQuery = ''" class="search-clear">
          <X :size="20" />
        </button>
      </div>
    </div>

    <!-- Categorias -->
    <div class="categories-section">
      <button 
        v-for="category in categories" 
        :key="category.id"
        @click="selectedCategory = category.id; currentPage = 1"
        class="category-chip"
        :class="{ active: selectedCategory === category.id }">
        {{ category.name }}
      </button>
    </div>

    <!-- Lista de Produtos -->
    <div class="products-list">
      <div v-if="paginatedProducts.length === 0" class="empty-state">
        <Package :size="48" />
        <p>Nenhum produto encontrado</p>
      </div>
      
      <div 
        v-for="product in paginatedProducts" 
        :key="product.id"
        class="product-item"
        :class="{ 'out-of-stock': product.estoque_atual <= 0 }">
        
        <div class="product-image">
          <img v-if="product.imagem_url" :src="product.imagem_url" :alt="product.nome" />
          <div v-else class="product-icon" :class="`icon-${product.categoria}`">
            <Utensils v-if="getCategoryIcon(product.categoria) === 'utensils'" :size="40" />
            <Coffee v-else-if="getCategoryIcon(product.categoria) === 'coffee'" :size="40" />
            <ChefHat v-else-if="getCategoryIcon(product.categoria) === 'chef-hat'" :size="40" />
            <Package v-else :size="40" />
          </div>
        </div>

        <div class="product-info">
          <h3 class="product-name">{{ product.nome }}</h3>
          <p v-if="product.descricao" class="product-desc">{{ product.descricao }}</p>
          <div class="product-meta">
            <span class="product-price">R$ {{ formatPrice(product.preco) }}</span>
            <span class="product-stock" :class="{ 'no-stock': product.estoque_atual <= 0 }">
              {{ product.estoque_atual > 0 ? `${product.estoque_atual} disponíveis` : 'Sem estoque' }}
            </span>
          </div>
        </div>

        <div class="product-actions">
          <div v-if="getProductQuantity(product.id) > 0" class="qty-controls">
            <button @click="decrementQuantity(product.id)" class="qty-btn">
              <Minus :size="20" />
            </button>
            <span class="qty-display">{{ getProductQuantity(product.id) }}</span>
            <button @click="incrementQuantity(product.id)" class="qty-btn">
              <Plus :size="20" />
            </button>
          </div>
          
          <button 
            @click="addToCart(product)" 
            class="add-btn"
            :disabled="product.estoque_atual <= 0">
            <Plus :size="24" />
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom Sheet Carrinho -->
    <div v-if="cartItemsCount > 0" class="cart-bottom-sheet">
      <div class="cart-summary">
        <div class="summary-info">
          <span class="summary-label">{{ cartItemsCount }} {{ cartItemsCount === 1 ? 'item' : 'itens' }}</span>
          <span class="summary-total">R$ {{ formatPrice(cartStore.total) }}</span>
        </div>
        
        <div class="payment-quick">
          <button 
            v-for="method in paymentMethods" 
            :key="method.id"
            @click="cartStore.setPaymentMethod(method.id)"
            class="payment-chip"
            :class="{ active: cartStore.selectedPayment === method.id }">
            {{ method.name }}
          </button>
        </div>

        <div class="cart-actions">
          <button @click="clearCartConfirm" class="btn-clear">
            <Trash2 :size="20" />
          </button>
          <button @click="finalizeOrder" class="btn-finalize">
            <Check :size="20" />
            Finalizar Pedido
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

.pdv-mobile {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 180px;
}

/* HEADER */
.mobile-header {
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-top {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}

.btn-back {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #f5f5f5;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.header-info {
  flex: 1;
}

.title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.25rem;
}

.total-badge {
  font-size: 1rem;
  font-weight: 600;
  color: #2e7d32;
}

.cart-indicator {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #d32f2f;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
}

/* BUSCA */
.search-section {
  padding: 1rem;
  background: white;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: #999;
}

.search-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  background: #f8f9fa;
}

.search-input:focus {
  outline: none;
  border-color: #333;
  background: white;
}

.search-clear {
  position: absolute;
  right: 0.5rem;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #f5f5f5;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* CATEGORIAS */
.categories-section {
  padding: 1rem;
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.categories-section::-webkit-scrollbar {
  display: none;
}

.category-chip {
  padding: 0.75rem 1.25rem;
  border-radius: 20px;
  border: 2px solid #e0e0e0;
  background: white;
  color: #666;
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
}

.category-chip.active {
  background: #333;
  color: white;
  border-color: #333;
}

/* PRODUTOS */
.products-list {
  padding: 0 1rem 1rem;
}

.empty-state {
  padding: 4rem 2rem;
  text-align: center;
  color: #999;
}

.product-item {
  background: white;
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  display: flex;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.product-item.out-of-stock {
  opacity: 0.5;
}

.product-image {
  width: 90px;
  height: 90px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f5f5f5;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-icon.icon-espetinho {
  background: #fff3e0;
  color: #e65100;
}

.product-icon.icon-bebida {
  background: #e3f2fd;
  color: #1565c0;
}

.product-icon.icon-acompanhamento {
  background: #e8f5e9;
  color: #2e7d32;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.25rem;
}

.product-desc {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2e7d32;
}

.product-stock {
  font-size: 0.75rem;
  color: #999;
  font-weight: 600;
}

.product-stock.no-stock {
  color: #d32f2f;
}

.product-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: center;
}

.qty-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f5f5f5;
  border-radius: 12px;
  padding: 0.25rem;
}

.qty-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.qty-display {
  font-weight: 700;
  font-size: 1rem;
  min-width: 30px;
  text-align: center;
}

.add-btn {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: #333;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.add-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* BOTTOM SHEET */
.cart-bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  z-index: 200;
}

.cart-summary {
  padding: 1.5rem 1rem;
}

.summary-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.summary-label {
  font-size: 1rem;
  color: #666;
  font-weight: 600;
}

.summary-total {
  font-size: 1.75rem;
  font-weight: 700;
  color: #333;
}

.payment-quick {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  overflow-x: auto;
}

.payment-chip {
  padding: 0.625rem 1rem;
  border-radius: 12px;
  border: 2px solid #e0e0e0;
  background: white;
  color: #666;
  font-weight: 600;
  font-size: 0.85rem;
  white-space: nowrap;
  cursor: pointer;
}

.payment-chip.active {
  background: #333;
  color: white;
  border-color: #333;
}

.cart-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-clear {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: #ffebee;
  color: #d32f2f;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.btn-finalize {
  flex: 1;
  height: 56px;
  border-radius: 12px;
  background: #333;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
}

/* DESKTOP */
@media (min-width: 769px) {
  .pdv-mobile {
    max-width: 480px;
    margin: 0 auto;
  }
}
</style>
