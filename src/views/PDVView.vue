<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useNavigationStore } from '@/stores/navigation'
import { useUserStore } from '@/stores/user'
import { ShoppingCart, Plus, Search, X, Utensils, Coffee, ChefHat, Package, Minus, Trash2, ArrowLeft, Check, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { supabase, TABLES } from '@/services/supabase'
import { syncService } from '@/services/syncService'

const router = useRouter()
const route = useRoute()
const cartStore = useCartStore()
const navigationStore = useNavigationStore()
const userStore = useUserStore()

const tableId = ref(route.query.mesaId || route.params.idMesa)
const tableNumber = ref(route.query.mesaNumero || null)

const products = ref([])
const tables = ref([])
const searchQuery = ref('')
const selectedCategory = ref('all')
const currentPage = ref(1)
const productsPerPage = 6
const currentCartPage = ref(1)
const itemsPerCartPage = 6

const paymentMethods = [
  { id: 'dinheiro', name: 'Dinheiro' },
  { id: 'debito', name: 'Débito' },
  { id: 'credito', name: 'Crédito' },
  { id: 'pix', name: 'PIX' }
]

onMounted(async () => {
  const mode = route.query.mode
  
  if (!tableId.value && mode !== 'balcao') {
    alert('Mesa não especificada!')
    router.push('/tables')
    return
  }

  console.log('🔧 Inicializando mesa no carrinho:', tableId.value)
  cartStore.initializeTable(tableId.value)
  
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
  return cats.filter(cat => cat)
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

const goBack = () => {
  const from = route.query.from || 'tables'
  if (from === 'dashboard') {
    router.push({ name: 'tables', query: { from: 'dashboard' } })
  } else {
    router.push({ name: 'tables' })
  }
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
    cartStore.clearCart()
    await fetchProducts()
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
  <div class="pdv-container">
    <!-- PRODUTOS -->
    <div class="products-section">
      <!-- ✅ HEADER CORRIGIDO - AGORA APARECE O NOME -->
      <div class="pdv-header">
        <div class="header-content">
          <button @click="goBack" class="btn-back" title="Voltar">
            <ArrowLeft :size="20" />
          </button>
          <h1 class="pdv-title">
            <ShoppingCart :size="24" />
            PDV - Mesa {{ getTableNumber(tableId) }}
          </h1>
        </div>
      </div>

      <!-- Search -->
      <div class="search-section">
        <div class="search-input-wrapper">
          <Search class="search-icon" :size="18" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Buscar produto..." 
            class="search-input"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search">
            <X :size="18" />
          </button>
        </div>
      </div>

      <!-- Categories -->
      <div class="category-tabs">
        <button 
          v-for="cat in categories" 
          :key="cat"
          @click="selectedCategory = cat; currentPage = 1"
          class="category-tab"
          :class="{ active: selectedCategory === cat }">
          {{ getCategoryName(cat) }}
        </button>
      </div>

      <!-- Products -->
      <div class="products-grid">
        <div v-if="paginatedProducts.length === 0" class="empty-state">
          <Package class="empty-icon" :size="48" />
          <p>Nenhum produto encontrado</p>
        </div>

        <div 
          v-for="product in paginatedProducts" 
          :key="product.id"
          class="product-card"
          :class="{ 'out-of-stock': product.estoque_atual <= 0 }">
          
          <div class="product-image">
            <Utensils v-if="product.categoria === 'espetinho'" :size="28" />
            <Coffee v-else-if="product.categoria === 'bebida'" :size="28" />
            <ChefHat v-else :size="28" />
          </div>

          <div class="product-info">
            <div class="product-name">{{ product.nome }}</div>
            <div class="product-description">{{ product.descricao || 'Sem descrição' }}</div>
            <div class="product-price">R$ {{ formatPrice(product.preco) }}</div>
            <div class="product-stock">
              {{ product.estoque_atual > 0 ? `Estoque: ${product.estoque_atual}` : 'Sem estoque' }}
            </div>
          </div>

          <div class="product-actions">
            <div v-if="getProductQuantity(product.id) > 0" class="quantity-controls">
              <button @click="decrementQuantity(product.id)" class="quantity-btn small">
                <Minus :size="14" />
              </button>
              <span class="quantity">{{ getProductQuantity(product.id) }}</span>
              <button @click="incrementQuantity(product.id)" class="quantity-btn small">
                <Plus :size="14" />
              </button>
            </div>
            <button 
              @click="addToCart(product)" 
              class="add-btn"
              :disabled="product.estoque_atual <= 0"
              :title="product.estoque_atual <= 0 ? 'Sem estoque' : 'Adicionar ao carrinho'">
              <Plus :size="20" />
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination-controls">
        <button @click="previousPage" :disabled="currentPage === 1" class="pagination-btn">
          <ChevronLeft :size="20" />
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages" class="pagination-btn">
          <ChevronRight :size="20" />
        </button>
      </div>
    </div>

    <!-- CARRINHO -->
    <div class="cart-panel">
      <div class="cart-panel-header">
        <div class="header-top">
          <div class="table-info">
            <span class="label">Mesa</span>
            <span class="table-number">{{ getTableNumber(tableId) }}</span>
          </div>
          <div class="item-count">
            {{ cartItemsCount }} {{ cartItemsCount === 1 ? 'item' : 'itens' }}
          </div>
        </div>
      </div>

      <!-- Área dos Itens do Carrinho -->
      <div class="cart-items-section">
        <h3 class="section-title">Itens do Pedido</h3>
        <div v-if="cartStore.cartItems.length === 0" class="empty-cart">
          <Package :size="32" />
          <p>Nenhum item adicionado</p>
        </div>
        <div v-else class="cart-items-container">
          <div class="cart-items">
            <div v-for="item in paginatedCartItems" :key="item.product.id" class="cart-item">
              <div class="item-details">
                <div class="item-name">{{ item.product.nome }}</div>
                <div class="item-meta">
                  <span class="item-price">R$ {{ formatPrice(item.product.preco) }} cada</span>
                  <span class="item-subtotal">R$ {{ formatPrice(item.product.preco * item.quantity) }}</span>
                </div>
              </div>
              <div class="item-controls">
                <div class="quantity-section">
                  <button @click="decrementQuantity(item.product.id)" class="quantity-btn">
                    <Minus :size="14" />
                  </button>
                  <span class="quantity-display">{{ item.quantity }}</span>
                  <button @click="incrementQuantity(item.product.id)" class="quantity-btn">
                    <Plus :size="14" />
                  </button>
                </div>
                <button @click="removeFromCart(item.product.id)" class="delete-btn">
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>
          </div>

          <div v-if="totalCartPages > 1" class="cart-pagination">
            <button @click="previousCartPage" :disabled="currentCartPage === 1" class="pagination-btn">
              <ChevronUp :size="16" />
            </button>
            <span class="page-info">Página {{ currentCartPage }} de {{ totalCartPages }}</span>
            <button @click="nextCartPage" :disabled="currentCartPage === totalCartPages" class="pagination-btn">
              <ChevronDown :size="16" />
            </button>
          </div>
        </div>
      </div>

      <!-- Desconto -->
      <div class="discount-section">
        <h3 class="section-title">Desconto</h3>
        <div class="discount-input-group">
          <select 
            :value="cartStore.discountType" 
            @change="cartStore.setDiscount($event.target.value, cartStore.discountValue)" 
            class="discount-select">
            <option value="percentage">%</option>
            <option value="fixed">R$</option>
          </select>
          <input 
            :value="cartStore.discountValue" 
            @input="cartStore.setDiscount(cartStore.discountType, parseFloat($event.target.value) || 0)"
            type="number" 
            min="0" 
            :max="cartStore.discountType === 'percentage' ? 100 : cartStore.subtotal"
            placeholder="0"
            class="discount-input"
          />
        </div>
      </div>

      <!-- ✅ BOTÕES DE PAGAMENTO CORRIGIDOS E MENORES -->
      <div class="payment-section">
        <h3 class="section-title">Forma de Pagamento</h3>
        <div class="payment-options">
          <button 
            v-for="method in paymentMethods" 
            :key="method.id"
            @click="cartStore.setPaymentMethod(method.id)"
            class="payment-option"
            :class="{ active: cartStore.selectedPayment === method.id }">
            {{ method.name }}
          </button>
        </div>
      </div>

      <!-- Resumo -->
      <div class="summary-section">
        <div class="summary-row">
          <span>Subtotal:</span>
          <span>R$ {{ formatPrice(cartStore.subtotal) }}</span>
        </div>
        <div v-if="cartStore.discountAmount > 0" class="summary-row discount">
          <span>Desconto:</span>
          <span>- R$ {{ formatPrice(cartStore.discountAmount) }}</span>
        </div>
        <div class="summary-row total">
          <span>Total:</span>
          <span>R$ {{ formatPrice(cartStore.total) }}</span>
        </div>
      </div>

      <!-- Ações -->
      <div class="panel-actions">
        <button @click="clearCartConfirm" class="btn-secondary" :disabled="cartStore.cartItems.length === 0">
          <Trash2 :size="16" />Limpar
        </button>
        <button @click="finalizeOrder" class="btn-primary" :disabled="cartStore.cartItems.length === 0">
          <Check :size="16" />Confirmar
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.pdv-container { 
  display: flex; 
  height: 100vh; 
  background: #f8fafc; 
  position: fixed; 
  top: 0; 
  left: 0; 
  right: 0; 
  bottom: 0; 
  z-index: 9999; 
  width: 100%; 
  overflow: hidden; 
}

.products-section { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  overflow: hidden; 
  border-right: 1px solid #e5e7eb; 
  max-width: calc(100% - 400px); 
}

/* ✅ HEADER CORRIGIDO - AGORA VISÍVEL */
.pdv-header { 
  background: white; 
  padding: 1rem; 
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); 
  position: sticky; 
  top: 0; 
  z-index: 20; 
  border-bottom: 1px solid #e5e7eb;
}

.header-content { 
  display: flex; 
  align-items: center; 
  gap: 1rem; 
}

.btn-back { 
  background: #C41E3A; 
  color: white; 
  border: none; 
  border-radius: 50%; 
  width: 40px; 
  height: 40px; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  cursor: pointer; 
  transition: all 0.3s ease; 
  flex-shrink: 0; 
}

.btn-back:hover { 
  background: #a51830; 
  transform: scale(1.05); 
}

.pdv-title { 
  color: #C41E3A; 
  font-size: 1.5rem; 
  font-weight: bold; 
  display: flex; 
  align-items: center; 
  gap: 0.5rem; 
  margin: 0;
}

.search-section { 
  padding: 1rem; 
  background: white; 
  border-bottom: 1px solid #e5e7eb; 
  position: sticky; 
  top: 80px; 
  z-index: 19; 
}

.search-input-wrapper { 
  position: relative; 
  display: flex; 
  align-items: center; 
}

.search-icon { 
  position: absolute; 
  left: 0.75rem; 
  color: #6b7280; 
}

.search-input { 
  width: 100%; 
  padding: 0.75rem 2.5rem; 
  border: 1px solid #e5e7eb; 
  border-radius: 12px; 
  font-size: 1rem; 
}

.clear-search { 
  position: absolute; 
  right: 0.75rem; 
  background: none; 
  border: none; 
  color: #6b7280; 
  cursor: pointer; 
}

.category-tabs { 
  display: flex; 
  gap: 0.5rem; 
  padding: 0.75rem 1rem; 
  background: white; 
  border-bottom: 1px solid #e5e7eb; 
  overflow-x: auto; 
  position: sticky; 
  top: 150px; 
  z-index: 18; 
}

.category-tab { 
  padding: 0.5rem 1rem; 
  border: 1px solid #e5e7eb; 
  border-radius: 20px; 
  background: white; 
  color: #6b7280; 
  cursor: pointer; 
  white-space: nowrap; 
  transition: all 0.3s ease; 
}

.category-tab.active { 
  background: #C41E3A; 
  color: white; 
  border-color: #C41E3A; 
}

.products-grid { 
  flex: 1; 
  overflow-y: auto; 
  padding: 1rem; 
  display: grid; 
  grid-template-columns: 1fr; 
  gap: 1rem; 
  align-content: start; 
}

.product-card { 
  background: white; 
  padding: 1rem; 
  border-radius: 12px; 
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); 
  display: flex; 
  align-items: center; 
  gap: 1rem; 
  transition: all 0.3s ease; 
}

.product-card:hover { 
  transform: translateY(-2px); 
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12); 
}

.product-card.out-of-stock { 
  opacity: 0.6; 
}

.product-image { 
  width: 60px; 
  height: 60px; 
  border-radius: 12px; 
  background: linear-gradient(135deg, #C41E3A20, #FF6B3520); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  color: #C41E3A; 
  flex-shrink: 0; 
}

.product-info { 
  flex: 1; 
  min-width: 0; 
}

.product-name { 
  font-weight: 600; 
  color: #1f2937; 
  margin-bottom: 0.25rem; 
  font-size: 0.95rem; 
}

.product-description { 
  color: #6b7280; 
  font-size: 0.8rem; 
  margin-bottom: 0.5rem; 
}

.product-price { 
  color: #C41E3A; 
  font-weight: bold; 
  font-size: 1rem; 
}

.product-stock { 
  font-size: 0.7rem; 
  color: #6b7280; 
  margin-top: 0.25rem; 
}

.product-actions { 
  display: flex; 
  align-items: center; 
  gap: 0.5rem; 
  flex-shrink: 0; 
}

.quantity-controls { 
  display: flex; 
  align-items: center; 
  gap: 0.5rem; 
  background: #f8fafc; 
  padding: 0.25rem; 
  border-radius: 8px; 
}

.quantity-btn { 
  width: 24px; 
  height: 24px; 
  border-radius: 6px; 
  background: white; 
  border: 1px solid #e5e7eb; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  cursor: pointer; 
  transition: all 0.3s ease; 
}

.quantity-btn:hover:not(:disabled) { 
  background: #C41E3A; 
  color: white; 
  border-color: #C41E3A; 
}

.quantity-btn:disabled { 
  opacity: 0.5; 
  cursor: not-allowed; 
}

.quantity-btn.small { 
  width: 20px; 
  height: 20px; 
}

.quantity { 
  font-weight: 600; 
  min-width: 20px; 
  text-align: center; 
  font-size: 0.9rem; 
}

.add-btn { 
  width: 40px; 
  height: 40px; 
  border-radius: 50%; 
  background: linear-gradient(135deg, #C41E3A, #FF6B35); 
  color: white; 
  border: none; 
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  box-shadow: 0 4px 12px #C41E3A40; 
  transition: all 0.3s ease; 
}

.add-btn:hover:not(:disabled) { 
  transform: scale(1.05); 
}

.add-btn:disabled { 
  opacity: 0.5; 
  cursor: not-allowed; 
}

.empty-state { 
  text-align: center; 
  padding: 3rem 1rem; 
  color: #6b7280; 
}

.empty-icon { 
  color: #d1d5db; 
  margin-bottom: 1rem; 
}

.pagination-controls { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 1rem; 
  padding: 1rem; 
  border-top: 1px solid #e5e7eb; 
  background: white; 
}

.pagination-btn { 
  width: 40px; 
  height: 40px; 
  border-radius: 8px; 
  background: #C41E3A; 
  color: white; 
  border: none; 
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  transition: all 0.3s ease; 
}

.pagination-btn:hover:not(:disabled) { 
  background: #a51830; 
  transform: translateY(-2px); 
}

.pagination-btn:disabled { 
  background: #d1d5db; 
  cursor: not-allowed; 
}

.page-info { 
  font-weight: 600; 
  color: #6b7280; 
  min-width: 50px; 
  text-align: center; 
  font-size: 0.9rem; 
}

/* CARRINHO */
.cart-panel { 
  position: fixed; 
  right: 0; 
  top: 0; 
  width: 400px; 
  height: 100vh; 
  background: white; 
  display: flex; 
  flex-direction: column; 
  border-left: 2px solid #C41E3A; 
  z-index: 15; 
}

.cart-panel-header { 
  padding: 1rem; 
  background: linear-gradient(135deg, #C41E3A, #FF6B35); 
  color: white; 
  flex-shrink: 0; 
}

.header-top { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
}

.table-info { 
  display: flex; 
  flex-direction: column; 
  gap: 0.25rem; 
}

.label { 
  font-size: 0.75rem; 
  opacity: 0.9; 
  text-transform: uppercase; 
  font-weight: 600; 
}

.table-number { 
  font-size: 1.5rem; 
  font-weight: bold; 
}

.item-count { 
  background: rgba(255, 255, 255, 0.2); 
  padding: 0.5rem 1rem; 
  border-radius: 20px; 
  font-size: 0.85rem; 
  font-weight: 600; 
}

.section-title { 
  font-size: 0.8rem; 
  font-weight: 700; 
  color: #6b7280; 
  text-transform: uppercase; 
  margin: 0; 
  margin-bottom: 0.75rem; 
  letter-spacing: 0.5px; 
}

.cart-items-section { 
  padding: 1rem; 
  border-bottom: 1px solid #e5e7eb; 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  overflow: hidden; 
}

.cart-items-container { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  overflow: hidden; 
}

.cart-items { 
  flex: 1; 
  overflow-y: auto; 
  display: flex; 
  flex-direction: column; 
  gap: 0.75rem; 
  padding-right: 0.25rem; 
}

.empty-cart { 
  text-align: center; 
  padding: 2rem 0; 
  color: #9ca3af; 
  font-size: 0.85rem; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  gap: 0.5rem; 
}

.cart-item { 
  background: #f8fafc; 
  padding: 1rem; 
  border-radius: 12px; 
  display: flex; 
  gap: 1rem; 
  align-items: center; 
  font-size: 0.9rem; 
  border: 1px solid #e5e7eb; 
  transition: all 0.3s ease; 
}

.cart-item:hover { 
  background: #f1f5f9; 
  transform: translateY(-1px); 
}

.item-details { 
  flex: 1; 
  min-width: 0; 
}

.item-name { 
  font-weight: 600; 
  color: #1f2937; 
  font-size: 0.9rem; 
  margin-bottom: 0.5rem; 
  line-height: 1.2; 
}

.item-meta { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  gap: 0.5rem; 
}

.item-price { 
  color: #6b7280; 
  font-size: 0.8rem; 
}

.item-subtotal { 
  font-weight: 600; 
  color: #C41E3A; 
  font-size: 0.85rem; 
}

.item-controls { 
  display: flex; 
  align-items: center; 
  gap: 0.75rem; 
  flex-shrink: 0; 
}

.quantity-section { 
  display: flex; 
  align-items: center; 
  gap: 0.5rem; 
  background: white; 
  padding: 0.25rem; 
  border-radius: 8px; 
  border: 1px solid #e5e7eb; 
}

.quantity-display { 
  font-weight: 600; 
  min-width: 24px; 
  text-align: center; 
  font-size: 0.85rem; 
}

.delete-btn { 
  width: 32px; 
  height: 32px; 
  border-radius: 6px; 
  background: #fef2f2; 
  border: 1px solid #fecaca; 
  color: #dc2626; 
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  transition: all 0.3s ease; 
}

.delete-btn:hover { 
  background: #fecaca; 
  transform: scale(1.05); 
}

.cart-pagination { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 0.75rem; 
  margin-top: 1rem; 
  padding-top: 1rem; 
  border-top: 1px solid #e5e7eb; 
  flex-shrink: 0; 
}

.discount-section { 
  padding: 1rem; 
  border-bottom: 1px solid #e5e7eb; 
  flex-shrink: 0; 
}

.discount-input-group { 
  display: flex; 
  gap: 0.5rem; 
}

.discount-select { 
  width: 70px; 
  padding: 0.6rem; 
  border: 1px solid #e5e7eb; 
  border-radius: 8px; 
  font-weight: 600; 
  font-size: 0.9rem; 
}

.discount-input { 
  flex: 1; 
  padding: 0.6rem; 
  border: 1px solid #e5e7eb; 
  border-radius: 8px; 
  font-size: 0.9rem; 
}

/* ✅ BOTÕES DE PAGAMENTO CORRIGIDOS E MENORES */
.payment-section { 
  padding: 1rem; 
  border-bottom: 1px solid #e5e7eb; 
  flex-shrink: 0; 
}

.payment-options { 
  display: grid; 
  grid-template-columns: 1fr 1fr; 
  gap: 0.5rem; 
}

.payment-option { 
  padding: 0.6rem 0.5rem; 
  border: 2px solid #e5e7eb; 
  background: white; 
  border-radius: 8px; 
  cursor: pointer; 
  font-size: 0.8rem; 
  font-weight: 600; 
  transition: all 0.3s ease; 
  text-align: center; 
  white-space: nowrap;
}

.payment-option:hover { 
  border-color: #C41E3A; 
  background: #C41E3A10; 
}

.payment-option.active { 
  background: #C41E3A; 
  color: white; 
  border-color: #C41E3A; 
}

.summary-section { 
  padding: 1rem; 
  border-bottom: 1px solid #e5e7eb; 
  background: #f8fafc; 
  flex-shrink: 0; 
}

.summary-row { 
  display: flex; 
  justify-content: space-between; 
  margin-bottom: 0.75rem; 
  font-size: 0.9rem; 
  color: #6b7280; 
}

.summary-row.discount { 
  color: #10b981; 
  font-weight: 600; 
}

.summary-row.total { 
  border-top: 2px solid #e5e7eb; 
  padding-top: 0.75rem; 
  margin-top: 0.5rem; 
  font-weight: 700; 
  color: #1f2937; 
  font-size: 1.1rem; 
}

.panel-actions { 
  padding: 1rem; 
  display: flex; 
  gap: 0.75rem; 
  background: white; 
  border-top: 2px solid #e5e7eb; 
  flex-shrink: 0; 
}

.btn-primary, .btn-secondary { 
  flex: 1; 
  padding: 0.85rem; 
  border: none; 
  border-radius: 10px; 
  font-weight: 600; 
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 0.5rem; 
  font-size: 0.95rem; 
  transition: all 0.3s ease; 
}

.btn-primary { 
  background: #C41E3A; 
  color: white; 
  box-shadow: 0 4px 12px #C41E3A40; 
}

.btn-primary:hover:not(:disabled) { 
  background: #a51830; 
  transform: translateY(-2px); 
  box-shadow: 0 6px 16px #C41E3A60; 
}

.btn-primary:disabled { 
  opacity: 0.5; 
  cursor: not-allowed; 
  transform: none; 
}

.btn-secondary { 
  background: #e5e7eb; 
  color: #6b7280; 
}

.btn-secondary:hover:not(:disabled) { 
  background: #d1d5db; 
  transform: translateY(-2px); 
}

.btn-secondary:disabled { 
  opacity: 0.5; 
  cursor: not-allowed; 
}

@media (max-width: 768px) { 
  .pdv-container { flex-direction: column; } 
  .products-section { border-right: none; border-bottom: 1px solid #e5e7eb; flex: 1; max-width: 100%; } 
  .cart-panel { position: relative; width: 100%; right: auto; top: auto; border-left: none; border-top: 2px solid #C41E3A; height: 45%; max-height: 45%; } 
}
</style>