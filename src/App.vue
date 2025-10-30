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

const tableId = ref(route.query.mesaId || route.params.idMesa)
const tableNumber = ref(route.query.mesaNumero || null)

const products = ref([])
const tables = ref([])
const searchQuery = ref('')
const selectedCategory = ref('all')
const currentPage = ref(1)
const productsPerPage = 6
const currentCartPage = ref(1)
const itemsPerCartPage = 4

const paymentMethods = [
  { id: 'dinheiro', name: 'Dinheiro', icon: 'banknote' },
  { id: 'debito', name: 'Débito', icon: 'credit-card' },
  { id: 'credito', name: 'Crédito', icon: 'credit-card' },
  { id: 'pix', name: 'PIX', icon: 'smartphone' }
]

onMounted(async () => {
  const mode = route.query.mode
  
  if (!tableId.value && mode !== 'balcao') {
    alert('Mesa não especificada!')
    router.push('/tables')
    return
  }

  console.log('🔧 Inicializando mesa no carrinho:', tableId.value)
  
  // NÃO chame initializeTable novamente se o carrinho já existe!
  if (!cartStore.getCartByTable(tableId.value)) {
    await cartStore.initializeTable(tableId.value)
  } else {
    // Apenas define a mesa atual
    cartStore.currentTableId = tableId.value
    console.log('📦 Carrinho existente carregado:', cartStore.cartItems.length, 'itens')
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

// FUNÇÃO CORRIGIDA - Mantém carrinho ao sair
const goBack = () => {
  // Se o carrinho já está persistido (comanda aberta), apenas volta
  if (cartStore.isCartPersisted) {
    console.log('📌 Comanda mantida - voltando para dashboard')
    router.push('/dashboard-gerente')
    return
  }
  
  // Se não está persistido e tem itens, pergunta se quer persistir
  if (cartStore.cartItems.length > 0) {
    const userChoice = confirm('Deseja manter os itens no carrinho? Clique em "OK" para manter ou "Cancelar" para limpar.')
    
    if (userChoice) {
      // Persiste o carrinho antes de sair
      cartStore.persistCart()
      console.log('✅ Carrinho persistido - comanda mantida')
    } else {
      // Usuário escolheu limpar
      cartStore.clearCart()
      console.log('🧹 Carrinho limpo pelo usuário')
    }
  }
  
  // Redireciona para o dashboard do gerente
  router.push('/dashboard-gerente')
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
    
    // Remove o carrinho após finalização
    await cartStore.finalizeCartAfterPayment(tableId.value)
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
  <div class="pdv-professional">
    <!-- Header Profissional -->
    <div class="professional-header">
      <div class="header-container">
        <div class="header-left">
          <button @click="goBack" class="btn-back-pro">
            <ArrowLeft :size="20" />
          </button>
          
          <div class="header-brand">
            <div class="logo-pro">
              <img src="/logo.png" alt="Point da Zefinha" class="logo-image" />
            </div>
            <div class="brand-info">
              <h1 class="brand-title">Point da Zefinha</h1>
              <div class="brand-meta">
                <div class="meta-item">
                  <span class="meta-label">Mesa:</span>
                  <span class="meta-value">{{ getTableNumber(tableId) }}</span>
                </div>
                <div class="meta-divider">|</div>
                <div class="meta-item status-active">
                  <Clock :size="14" />
                  <span>Em Atendimento</span>
                </div>
                <div v-if="cartStore.isCartPersisted" class="meta-item status-persisted">
                  <Check :size="14" />
                  <span>Comanda Aberta</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="header-right">
          <div class="total-display">
            <div class="total-label">Valor Total</div>
            <div class="total-value">R$ {{ formatPrice(cartStore.total) }}</div>
          </div>
          <div class="cart-icon-wrapper">
            <ShoppingCart :size="22" />
            <div v-if="cartItemsCount > 0" class="cart-badge">{{ cartItemsCount }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Conteúdo Principal -->
    <div class="main-content">
      <!-- Seção de Produtos -->
      <div class="products-section">
        <!-- Busca -->
        <div class="search-wrapper">
          <Search :size="20" class="search-icon" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Buscar produtos..." 
            class="search-input-pro"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="search-clear">
            <X :size="18" />
          </button>
        </div>

        <!-- Categorias -->
        <div class="categories-tabs">
          <button 
            v-for="category in categories" 
            :key="category.id"
            @click="selectedCategory = category.id; currentPage = 1"
            class="category-btn"
            :class="{ active: selectedCategory === category.id }">
            <Utensils v-if="category.icon === 'utensils'" :size="18" />
            <Coffee v-else-if="category.icon === 'coffee'" :size="18" />
            <ChefHat v-else-if="category.icon === 'chef-hat'" :size="18" />
            <Package v-else :size="18" />
            {{ category.name }}
          </button>
        </div>

        <!-- Grid de Produtos -->
        <div class="products-grid-wrapper">
          <div v-if="paginatedProducts.length === 0" class="empty-products">
            <Package :size="64" />
            <p>Nenhum produto encontrado</p>
          </div>
          
          <div v-else class="products-grid-pro">
            <div 
              v-for="product in paginatedProducts" 
              :key="product.id"
              class="product-card-pro"
              :class="{ 'out-of-stock': product.estoque_atual <= 0 }">
              
              <div class="product-image-wrapper">
                <img v-if="product.imagem_url" :src="product.imagem_url" :alt="product.nome" class="product-image-pro" />
                <div v-else class="product-icon-wrapper" :class="`icon-${product.categoria}`">
                  <Utensils v-if="getCategoryIcon(product.categoria) === 'utensils'" :size="32" />
                  <Coffee v-else-if="getCategoryIcon(product.categoria) === 'coffee'" :size="32" />
                  <ChefHat v-else-if="getCategoryIcon(product.categoria) === 'chef-hat'" :size="32" />
                  <Package v-else :size="32" />
                </div>
              </div>

              <div class="product-details">
                <div class="product-header">
                  <h3 class="product-name-pro">{{ product.nome }}</h3>
                  <div class="product-price-pro">R$ {{ formatPrice(product.preco) }}</div>
                </div>
                
                <p v-if="product.descricao" class="product-desc-pro">{{ product.descricao }}</p>
                
                <div class="product-footer">
                  <div class="product-stock-pro" :class="{ 'no-stock': product.estoque_atual <= 0 }">
                    {{ product.estoque_atual > 0 ? `${product.estoque_atual} em estoque` : 'Sem estoque' }}
                  </div>

                  <div class="product-actions-pro">
                    <div v-if="getProductQuantity(product.id) > 0" class="quantity-controls-pro">
                      <button @click="decrementQuantity(product.id)" class="qty-btn-pro">
                        <Minus :size="16" />
                      </button>
                      <span class="qty-display-pro">{{ getProductQuantity(product.id) }}</span>
                      <button @click="incrementQuantity(product.id)" class="qty-btn-pro">
                        <Plus :size="16" />
                      </button>
                    </div>
                    
                    <button 
                      @click="addToCart(product)" 
                      class="add-btn-pro"
                      :disabled="product.estoque_atual <= 0">
                      <Plus :size="20" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Paginação -->
        <div v-if="totalPages > 1" class="pagination-pro">
          <button @click="previousPage" :disabled="currentPage === 1" class="pagination-btn-pro">
            <ChevronLeft :size="20" />
          </button>
          <div class="pagination-info">{{ currentPage }} / {{ totalPages }}</div>
          <button @click="nextPage" :disabled="currentPage === totalPages" class="pagination-btn-pro">
            <ChevronRight :size="20" />
          </button>
        </div>
      </div>

      <!-- Seção do Carrinho -->
      <div class="cart-section-pro">
        <div class="cart-container-pro">
          <!-- Header do Carrinho -->
          <div class="cart-header-pro">
            <h2 class="cart-title-pro">Carrinho de Compras</h2>
            <div class="cart-count-badge">{{ cartItemsCount }} {{ cartItemsCount === 1 ? 'item' : 'itens' }}</div>
          </div>

          <!-- Itens do Carrinho -->
          <div class="cart-items-wrapper">
            <div v-if="cartStore.cartItems.length === 0" class="empty-cart-pro">
              <ShoppingCart :size="64" />
              <p>Carrinho vazio</p>
            </div>

            <div v-else>
              <div class="cart-items-pro">
                <div 
                  v-for="item in paginatedCartItems" 
                  :key="item.product.id"
                  class="cart-item-pro">
                  
                  <div class="cart-item-header">
                    <div class="cart-item-info">
                      <div class="cart-item-name">{{ item.product.nome }}</div>
                      <div class="cart-item-prices">
                        <span class="item-unit-price">R$ {{ formatPrice(item.product.preco) }}</span>
                        <span class="item-multiplier">×</span>
                        <span class="item-quantity">{{ item.quantity }}</span>
                        <span class="item-equals">=</span>
                        <span class="item-subtotal">R$ {{ formatPrice(item.product.preco * item.quantity) }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="cart-item-actions">
                    <div class="cart-qty-controls">
                      <button @click="decrementQuantity(item.product.id)" class="cart-qty-btn">
                        <Minus :size="14" />
                      </button>
                      <span class="cart-qty-display">{{ item.quantity }}</span>
                      <button @click="incrementQuantity(item.product.id)" class="cart-qty-btn">
                        <Plus :size="14" />
                      </button>
                    </div>
                    <button @click="removeFromCart(item.product.id)" class="cart-delete-btn">
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Paginação do Carrinho -->
              <div v-if="totalCartPages > 1" class="cart-pagination">
                <button @click="previousCartPage" :disabled="currentCartPage === 1" class="cart-page-btn">
                  <ChevronUp :size="16" />
                </button>
                <span class="cart-page-info">{{ currentCartPage }} / {{ totalCartPages }}</span>
                <button @click="nextCartPage" :disabled="currentCartPage === totalCartPages" class="cart-page-btn">
                  <ChevronDown :size="16" />
                </button>
              </div>
            </div>
          </div>

          <!-- Desconto -->
          <div class="discount-section-pro">
            <div class="section-title-pro">
              <Sparkles :size="16" />
              Desconto
            </div>
            <div class="discount-inputs">
              <select v-model="cartStore.discountType" class="discount-select-pro">
                <option value="percentage">%</option>
                <option value="fixed">R$</option>
              </select>
              <input 
                v-model.number="cartStore.discountValue" 
                type="number" 
                min="0" 
                :max="cartStore.discountType === 'percentage' ? 100 : cartStore.subtotal"
                placeholder="0" 
                class="discount-input-pro"
              />
            </div>
          </div>

          <!-- Forma de Pagamento -->
          <div class="payment-section-pro">
            <div class="section-title-pro">Forma de Pagamento</div>
            <div class="payment-grid">
              <button 
                v-for="method in paymentMethods" 
                :key="method.id"
                @click="cartStore.setPaymentMethod(method.id)"
                class="payment-btn-pro"
                :class="{ active: cartStore.selectedPayment === method.id }">
                <Banknote v-if="method.icon === 'banknote'" :size="18" />
                <CreditCard v-else-if="method.icon === 'credit-card'" :size="18" />
                <Smartphone v-else-if="method.icon === 'smartphone'" :size="18" />
                <span>{{ method.name }}</span>
              </button>
            </div>
          </div>

          <!-- Resumo -->
          <div class="summary-section-pro">
            <div class="summary-row">
              <span>Subtotal</span>
              <span class="summary-value">R$ {{ formatPrice(cartStore.subtotal) }}</span>
            </div>
            <div v-if="cartStore.discountAmount > 0" class="summary-row discount-row">
              <span>Desconto</span>
              <span class="summary-value">- R$ {{ formatPrice(cartStore.discountAmount) }}</span>
            </div>
            <div class="summary-row total-row">
              <span>Total a Pagar</span>
              <span class="summary-value total-value">R$ {{ formatPrice(cartStore.total) }}</span>
            </div>

            <!-- Botões de Ação -->
            <div class="action-buttons-pro">
              <button @click="clearCartConfirm" class="btn-clear-pro" :disabled="cartStore.cartItems.length === 0">
                <Trash2 :size="18" />
                Limpar
              </button>
              <button @click="finalizeOrder" class="btn-confirm-pro" :disabled="cartStore.cartItems.length === 0">
                <Check :size="18" />
                Finalizar Pedido
              </button>
            </div>
          </div>
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
}

/* Container Principal - Sem rolagem */
.pdv-professional {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
  background: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  overflow: hidden;
}

/* Header Profissional */
.professional-header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
  border-bottom: 1px solid #e0e0e0;
  height: 90px;
}

.header-container {
  height: 100%;
  max-width: 100%;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.btn-back-pro {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-back-pro:hover {
  background: #e8e8e8;
  border-color: #d0d0d0;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-pro {
  width: 52px;
  height: 52px;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e0e0e0;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.brand-info {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.brand-title {
  color: #333;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.5px;
}

.brand-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #666;
}

.meta-label {
  color: #999;
  font-weight: 500;
}

.meta-value {
  font-weight: 600;
  color: #333;
}

.meta-divider {
  color: #d0d0d0;
}

.status-active {
  padding: 0.3rem 0.75rem;
  border-radius: 6px;
  background: #e8f5e9;
  border: 1px solid #c8e6c9;
  color: #2e7d32;
  font-weight: 600;
}

.status-persisted {
  padding: 0.3rem 0.75rem;
  border-radius: 6px;
  background: #e3f2fd;
  border: 1px solid #bbdefb;
  color: #1565c0;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.total-display {
  text-align: right;
  padding-right: 1.5rem;
  border-right: 1px solid #e0e0e0;
}

.total-label {
  color: #999;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.total-value {
  color: #333;
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.cart-icon-wrapper {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  position: relative;
}

.cart-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  border-radius: 12px;
  background: #d32f2f;
  color: white;
  font-weight: 700;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(211, 47, 47, 0.3);
}

/* Conteúdo Principal - Sem rolagem */
.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  height: calc(100vh - 90px);
}

/* Seção de Produtos - Sem rolagem interna */
.products-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  gap: 1rem;
  overflow: hidden;
  background: #f5f5f5;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: #999;
  pointer-events: none;
}

.search-input-pro {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  transition: all 0.2s ease;
  color: #333;
}

.search-input-pro:focus {
  outline: none;
  border-color: #999;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
}

.search-clear {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-clear:hover {
  background: #f5f5f5;
  color: #666;
}

.categories-tabs {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: white;
  color: #666;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-btn:hover {
  background: #f5f5f5;
  border-color: #d0d0d0;
  color: #333;
}

.category-btn.active {
  background: #333;
  color: white;
  border-color: #333;
}

/* Grid de produtos - Sem rolagem */
.products-grid-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.empty-products {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
  color: #999;
  gap: 1rem;
  height: 100%;
}

.products-grid-pro {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 0.75rem;
  height: 100%;
  overflow: hidden;
  align-content: start;
}

.product-card-pro {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  display: flex;
  gap: 0.75rem;
  transition: all 0.2s ease;
  height: 140px;
}

.product-card-pro:hover {
  border-color: #d0d0d0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.product-card-pro.out-of-stock {
  opacity: 0.5;
  cursor: not-allowed;
}

.product-image-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  border: 1px solid #e0e0e0;
}

.product-image-pro {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.product-icon-wrapper {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
}

.product-icon-wrapper.icon-espetinho {
  background: #fff3e0;
  color: #e65100;
}

.product-icon-wrapper.icon-bebida {
  background: #e3f2fd;
  color: #1565c0;
}

.product-icon-wrapper.icon-acompanhamento {
  background: #e8f5e9;
  color: #2e7d32;
}

.product-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.product-name-pro {
  font-size: 1rem;
  font-weight: 700;
  color: #333;
  line-height: 1.3;
}

.product-price-pro {
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.product-desc-pro {
  color: #666;
  font-size: 0.8rem;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  gap: 0.75rem;
  padding-top: 0.4rem;
}

.product-stock-pro {
  font-size: 0.7rem;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.product-stock-pro.no-stock {
  color: #d32f2f;
}

.product-actions-pro {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.quantity-controls-pro {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #f5f5f5;
  padding: 0.2rem;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.qty-btn-pro {
  width: 26px;
  height: 26px;
  border-radius: 4px;
  background: white;
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #333;
}

.qty-btn-pro:hover {
  background: #333;
  color: white;
  border-color: #333;
}

.qty-display-pro {
  font-weight: 700;
  min-width: 22px;
  text-align: center;
  color: #333;
  font-size: 0.8rem;
}

.add-btn-pro {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: #333;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.add-btn-pro:hover:not(:disabled) {
  background: #1a1a1a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.add-btn-pro:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.pagination-pro {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.pagination-btn-pro {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: white;
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #333;
}

.pagination-btn-pro:hover:not(:disabled) {
  background: #333;
  color: white;
  border-color: #333;
}

.pagination-btn-pro:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pagination-info {
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  background: #333;
  color: white;
  font-weight: 700;
  font-size: 0.8rem;
}

/* Seção do Carrinho - Sem rolagem */
.cart-section-pro {
  width: 380px;
  flex-shrink: 0;
  border-left: 1px solid #e0e0e0;
  background: white;
}

.cart-container-pro {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cart-header-pro {
  padding: 1rem 1.25rem;
  background: #fafafa;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.cart-title-pro {
  color: #333;
  font-size: 1.1rem;
  font-weight: 700;
}

.cart-count-badge {
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
  background: #333;
  color: white;
  font-weight: 700;
  font-size: 0.75rem;
}

/* Itens do carrinho - Sem rolagem */
.cart-items-wrapper {
  flex: 1;
  overflow: hidden;
  padding: 0.75rem;
  background: white;
  display: flex;
  flex-direction: column;
}

.empty-cart-pro {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  color: #d0d0d0;
  gap: 1rem;
  height: 100%;
}

.cart-items-pro {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1;
  overflow: hidden;
}

.cart-item-pro {
  background: #fafafa;
  padding: 0.35rem 0.4rem;
  border-radius: 5px;
  border: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  transition: all 0.2s ease;
}

.cart-item-pro:hover {
  background: #f5f5f5;
  border-color: #e0e0e0;
}

.cart-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.cart-item-info {
  flex: 1;
  min-width: 0;
}

.cart-item-name {
  font-weight: 700;
  color: #333;
  font-size: 0.65rem;
  margin-bottom: 0.15rem;
  line-height: 1.2;
}

.cart-item-prices {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.6rem;
  font-variant-numeric: tabular-nums;
}

.item-unit-price {
  color: #666;
  font-weight: 500;
}

.item-multiplier,
.item-equals {
  color: #d0d0d0;
  font-weight: 600;
}

.item-quantity {
  color: #333;
  font-weight: 700;
}

.item-subtotal {
  font-weight: 700;
  color: #333;
}

.cart-item-actions {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.cart-qty-controls {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  background: white;
  padding: 0.1rem;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  flex: 1;
}

.cart-qty-btn {
  width: 18px;
  height: 18px;
  border-radius: 3px;
  background: #f5f5f5;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #333;
}

.cart-qty-btn:hover {
  background: #e0e0e0;
  color: #1a1a1a;
}

.cart-qty-display {
  flex: 1;
  text-align: center;
  font-weight: 700;
  color: #333;
  font-size: 0.6rem;
}

.cart-delete-btn {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: #ffebee;
  border: 1px solid #ffcdd2;
  color: #d32f2f;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.cart-delete-btn:hover {
  background: #ffcdd2;
  border-color: #ef9a9a;
}

.cart-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin-top: 0.6rem;
  padding-top: 0.6rem;
  border-top: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.cart-page-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #333;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.cart-page-btn:hover:not(:disabled) {
  background: #1a1a1a;
}

.cart-page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.cart-page-info {
  font-size: 0.7rem;
  font-weight: 600;
  color: #666;
}

.discount-section-pro,
.payment-section-pro,
.summary-section-pro {
  padding: 0.5rem 1.25rem;
  border-top: 1px solid #e0e0e0;
  background: white;
  flex-shrink: 0;
}

.section-title-pro {
  font-size: 0.6rem;
  font-weight: 700;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.3rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.discount-inputs {
  display: flex;
  gap: 0.4rem;
}

.discount-select-pro {
  width: 50px;
  padding: 0.4rem;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  font-weight: 600;
  font-size: 0.75rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #333;
}

.discount-select-pro:focus {
  outline: none;
  border-color: #999;
}

.discount-input-pro {
  flex: 1;
  padding: 0.4rem;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  color: #333;
}

.discount-input-pro:focus {
  outline: none;
  border-color: #999;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
}

.payment-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.3rem;
}

.payment-btn-pro {
  padding: 0.35rem 0.4rem;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  background: white;
  font-weight: 600;
  font-size: 0.65rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.payment-btn-pro:hover {
  border-color: #d0d0d0;
  background: #f5f5f5;
}

.payment-btn-pro.active {
  background: #333;
  color: white;
  border-color: #333;
}

.summary-section-pro {
  background: #fafafa;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
  color: #666;
  font-size: 0.75rem;
}

.summary-value {
  font-weight: 600;
  color: #333;
  font-variant-numeric: tabular-nums;
}

.summary-row.discount-row {
  color: #2e7d32;
}

.summary-row.discount-row .summary-value {
  font-weight: 700;
  color: #2e7d32;
}

.summary-row.total-row {
  border-top: 1px solid #e0e0e0;
  padding-top: 0.4rem;
  margin-top: 0.2rem;
  margin-bottom: 0.6rem;
  font-size: 0.8rem;
  color: #333;
  font-weight: 700;
}

.total-value {
  font-size: 1.1rem;
  color: #333;
  font-weight: 800;
}

.action-buttons-pro {
  display: flex;
  gap: 0.6rem;
}

.btn-clear-pro,
.btn-confirm-pro {
  flex: 1;
  padding: 0.6rem;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  transition: all 0.2s ease;
}

.btn-clear-pro {
  background: #e0e0e0;
  color: #333;
}

.btn-clear-pro:hover:not(:disabled) {
  background: #d0d0d0;
}

.btn-confirm-pro {
  background: #333;
  color: white;
}

.btn-confirm-pro:hover:not(:disabled) {
  background: #1a1a1a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-clear-pro:disabled,
.btn-confirm-pro:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Responsivo */
@media (max-width: 1400px) {
  .products-grid-pro {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
  }
  
  .products-section {
    height: 60vh;
  }
  
  .cart-section-pro {
    width: 100%;
    border-left: none;
    border-top: 1px solid #e0e0e0;
    height: 40vh;
  }
  
  .header-container {
    padding: 1rem 1.5rem;
  }
  
  .brand-title {
    font-size: 1.25rem;
  }
  
  .logo-pro {
    width: 48px;
    height: 48px;
  }
}

@media (max-width: 768px) {
  .header-container {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .header-left,
  .header-right {
    width: 100%;
    justify-content: space-between;
  }
  
  .total-display {
    border-right: none;
    padding-right: 0;
  }
  
  .products-section {
    padding: 0.75rem;
  }
  
  .categories-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 0.5rem;
  }
  
  .categories-tabs::-webkit-scrollbar {
    height: 4px;
  }
  
  .categories-tabs::-webkit-scrollbar-track {
    background: #f0f0f0;
  }
  
  .categories-tabs::-webkit-scrollbar-thumb {
    background: #d0d0d0;
    border-radius: 2px;
  }
  
  .products-grid-pro {
    grid-template-columns: 1fr;
  }
}
</style>
