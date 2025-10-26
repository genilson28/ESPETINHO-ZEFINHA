<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
    <!-- Header -->
    <div class="card-gradient text-white p-6 mb-6 sticky top-0 z-50 shadow-lg">
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-2">
          <div class="table-badge">
            🪑 Mesa {{ tableInfo?.numero || tableId }}
          </div>
          <button @click="toggleDebug" class="debug-btn" title="Debug">
            🐛
          </button>
        </div>
        <h1 class="text-3xl font-bold mb-1">Cardápio Digital</h1>
        <p class="text-white/90 text-sm">Faça seu pedido aqui!</p>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4">
      <!-- Debug Info -->
      <div v-if="showDebug" class="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
        <h3 class="font-bold text-yellow-800 mb-2">🐛 DEBUG INFO:</h3>
        <div class="text-sm space-y-1 text-yellow-800">
          <p><strong>Mesa ID:</strong> {{ tableId }}</p>
          <p><strong>Mesa Info:</strong> {{ tableInfo }}</p>
          <p><strong>Total produtos carregados:</strong> {{ products.length }}</p>
          <p><strong>Espetinhos:</strong> {{ espetinhos.length }}</p>
          <p><strong>Bebidas:</strong> {{ bebidas.length }}</p>
          <p><strong>Acompanhamentos:</strong> {{ acompanhamentos.length }}</p>
          <p><strong>Loading:</strong> {{ loading }}</p>
          <p><strong>Erro:</strong> {{ error || 'Nenhum' }}</p>
          <details class="mt-2">
            <summary class="cursor-pointer font-bold">Ver Produtos (JSON)</summary>
            <pre class="mt-2 bg-white p-2 rounded text-xs overflow-auto max-h-40">{{ JSON.stringify(products, null, 2) }}</pre>
          </details>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto"></div>
        <p class="mt-4 text-gray-600 font-semibold">Carregando cardápio...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border-2 border-red-300 rounded-xl p-6 text-center">
        <div class="text-red-600 text-5xl mb-3">⚠️</div>
        <h3 class="text-xl font-bold text-red-800 mb-2">Erro ao carregar</h3>
        <p class="text-red-600 mb-4">{{ error }}</p>
        <button @click="loadData" class="btn-primary">
          Tentar Novamente
        </button>
      </div>

      <!-- Cardápio -->
      <template v-else>
        <!-- Espetinhos -->
        <section class="mb-8">
          <h2 class="section-title">
            <span class="section-icon">🔥</span>
            Nossos Espetinhos
          </h2>
          
          <div v-if="espetinhos.length === 0" class="empty-state">
            <div class="text-6xl mb-3">🍢</div>
            <p class="text-gray-500">Nenhum espetinho disponível no momento</p>
          </div>
          
          <div v-else class="space-y-4">
            <div 
              v-for="product in espetinhos" 
              :key="product.id" 
              class="product-card"
              :class="{ 'out-of-stock': product.estoque_atual <= 0 }">
              
              <div class="product-image">
                <img 
                  v-if="product.imagem_url" 
                  :src="product.imagem_url" 
                  :alt="product.nome"
                  @error="onImageError"
                  class="w-full h-full object-cover"
                />
                <div v-else class="placeholder-icon">
                  🍢
                </div>
              </div>
              
              <div class="product-content">
                <h3 class="product-name">{{ product.nome }}</h3>
                <p v-if="product.descricao" class="product-description">
                  {{ product.descricao }}
                </p>
                
                <div class="product-footer">
                  <div class="product-price">
                    R$ {{ formatPrice(product.preco_venda) }}
                  </div>
                  <button 
                    class="btn-add" 
                    @click="addToCart(product)"
                    :disabled="product.estoque_atual <= 0">
                    <Plus :size="18" />
                    {{ product.estoque_atual <= 0 ? 'Indisponível' : 'Adicionar' }}
                  </button>
                </div>

                <div v-if="product.estoque_atual <= 0" class="badge-unavailable">
                  Esgotado
                </div>
                <div v-else-if="product.estoque_atual < product.estoque_minimo" class="badge-limited">
                  Últimas unidades!
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Bebidas -->
        <section class="mb-8">
          <h2 class="section-title">
            <span class="section-icon">🥤</span>
            Bebidas
          </h2>
          
          <div v-if="bebidas.length === 0" class="empty-state">
            <div class="text-6xl mb-3">🥤</div>
            <p class="text-gray-500">Nenhuma bebida disponível no momento</p>
          </div>
          
          <div v-else class="grid grid-cols-2 gap-4">
            <div 
              v-for="product in bebidas" 
              :key="product.id" 
              class="drink-card"
              :class="{ 'out-of-stock': product.estoque_atual <= 0 }">
              
              <div class="drink-image">
                <img 
                  v-if="product.imagem_url" 
                  :src="product.imagem_url" 
                  :alt="product.nome"
                  @error="onImageError"
                  class="w-full h-full object-cover rounded-full"
                />
                <div v-else class="placeholder-icon">
                  🥤
                </div>
              </div>
              
              <h3 class="drink-name">{{ product.nome }}</h3>
              <div class="drink-price">R$ {{ formatPrice(product.preco_venda) }}</div>
              
              <button 
                class="btn-small" 
                @click="addToCart(product)"
                :disabled="product.estoque_atual <= 0">
                <Plus :size="16" />
                {{ product.estoque_atual <= 0 ? 'Indisponível' : 'Adicionar' }}
              </button>
            </div>
          </div>
        </section>

        <!-- Acompanhamentos -->
        <section v-if="acompanhamentos.length > 0" class="mb-8">
          <h2 class="section-title">
            <span class="section-icon">🍟</span>
            Acompanhamentos
          </h2>
          
          <div class="grid grid-cols-2 gap-4">
            <div 
              v-for="product in acompanhamentos" 
              :key="product.id" 
              class="drink-card"
              :class="{ 'out-of-stock': product.estoque_atual <= 0 }">
              
              <div class="drink-image">
                <img 
                  v-if="product.imagem_url" 
                  :src="product.imagem_url" 
                  :alt="product.nome"
                  @error="onImageError"
                  class="w-full h-full object-cover rounded-full"
                />
                <div v-else class="placeholder-icon">
                  🍟
                </div>
              </div>
              
              <h3 class="drink-name">{{ product.nome }}</h3>
              <div class="drink-price">R$ {{ formatPrice(product.preco_venda) }}</div>
              
              <button 
                class="btn-small" 
                @click="addToCart(product)"
                :disabled="product.estoque_atual <= 0">
                <Plus :size="16" />
                {{ product.estoque_atual <= 0 ? 'Indisponível' : 'Adicionar' }}
              </button>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Plus } from 'lucide-vue-next'
import { supabase, TABLES } from '@/services/supabase'

const route = useRoute()

// Estados
const products = ref([])
const tableInfo = ref(null)
const loading = ref(true)
const error = ref(null)
const showDebug = ref(false)

// Parâmetros da rota
const tableId = computed(() => route.params.tableId)

// Carregar dados
onMounted(async () => {
  console.log('🔍 ClientMenuView montado')
  console.log('📍 Mesa ID:', tableId.value)
  await loadData()
})

const loadData = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Buscar informações da mesa
    console.log('🔄 Buscando informações da mesa...')
    const { data: table, error: tableError } = await supabase
      .from(TABLES.MESAS)
      .select('*')
      .eq('id', tableId.value)
      .single()
    
    if (tableError) {
      console.error('❌ Erro ao buscar mesa:', tableError)
      throw new Error('Mesa não encontrada')
    }
    
    console.log('✅ Mesa encontrada:', table)
    tableInfo.value = table
    
    // Buscar produtos
    console.log('🔄 Buscando produtos no Supabase...')
    const { data: productsData, error: productsError } = await supabase
      .from(TABLES.PRODUTOS)
      .select('*')
      .eq('ativo', true)
      .order('categoria', { ascending: true })
      .order('nome', { ascending: true })
    
    if (productsError) {
      console.error('❌ Erro ao buscar produtos:', productsError)
      throw productsError
    }
    
    console.log('✅ Produtos carregados:', productsData?.length || 0)
    products.value = productsData || []
    
    if (products.value.length === 0) {
      console.warn('⚠️ Nenhum produto encontrado no banco!')
    }
    
  } catch (err) {
    console.error('❌ Erro ao carregar dados:', err)
    error.value = err.message || 'Erro ao carregar o cardápio. Verifique sua conexão.'
  } finally {
    loading.value = false
  }
}

// Filtrar produtos por categoria (case-insensitive)
const espetinhos = computed(() => {
  const filtered = products.value.filter(p => {
    const cat = (p.categoria || '').toLowerCase().trim()
    return cat.includes('espetinho')
  })
  console.log('🍢 Espetinhos filtrados:', filtered.length)
  return filtered
})

const bebidas = computed(() => {
  const filtered = products.value.filter(p => {
    const cat = (p.categoria || '').toLowerCase().trim()
    return cat.includes('bebida')
  })
  console.log('🥤 Bebidas filtradas:', filtered.length)
  return filtered
})

const acompanhamentos = computed(() => {
  const filtered = products.value.filter(p => {
    const cat = (p.categoria || '').toLowerCase().trim()
    return cat.includes('acompanhamento')
  })
  console.log('🍟 Acompanhamentos filtrados:', filtered.length)
  return filtered
})

// Formatar preço
const formatPrice = (price) => {
  const num = Number(price) || 0
  return num.toFixed(2).replace('.', ',')
}

// Adicionar ao carrinho
const addToCart = (product) => {
  if (product.estoque_atual <= 0) {
    alert('❌ Produto indisponível no momento!')
    return
  }
  
  console.log('🛒 Adicionar ao carrinho:', product)
  console.log('📍 Mesa:', tableInfo.value)
  
  // TODO: Implementar lógica do carrinho real
  alert(`✅ ${product.nome} adicionado ao carrinho!\n\nPreço: R$ ${formatPrice(product.preco_venda)}\nMesa: ${tableInfo.value?.numero}\n\n🚧 Carrinho em desenvolvimento...`)
}

// Toggle debug
const toggleDebug = () => {
  showDebug.value = !showDebug.value
}

// Erro ao carregar imagem
const onImageError = (event) => {
  console.warn('⚠️ Erro ao carregar imagem:', event.target.src)
  event.target.style.display = 'none'
}
</script>

<style scoped>
.card-gradient {
  background: linear-gradient(135deg, #C41E3A 0%, #8B0000 100%);
}

.table-badge {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.95rem;
}

.debug-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.debug-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 3px solid #C41E3A;
}

.section-icon {
  font-size: 2rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 1rem;
  border: 2px dashed #e5e7eb;
}

/* Product Cards */
.product-card {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}

.product-card:active {
  transform: scale(0.98);
}

.product-card.out-of-stock {
  opacity: 0.6;
}

.product-image {
  width: 100%;
  height: 180px;
  background: linear-gradient(135deg, #C41E3A15, #FF6B3515);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.placeholder-icon {
  font-size: 4rem;
}

.product-content {
  padding: 1.25rem;
}

.product-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.product-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.product-price {
  font-size: 1.75rem;
  font-weight: 700;
  color: #C41E3A;
}

.btn-add {
  background: #C41E3A;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-add:hover:not(:disabled) {
  background: #8B0000;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
}

.btn-add:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.badge-unavailable {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #ef4444;
  color: white;
  padding: 0.375rem 0.875rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
}

.badge-limited {
  margin-top: 0.5rem;
  color: #d97706;
  font-size: 0.875rem;
  font-weight: 600;
}

/* Drink Cards */
.drink-card {
  background: white;
  border-radius: 1rem;
  padding: 1.25rem;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s;
}

.drink-card:active {
  transform: scale(0.98);
}

.drink-card.out-of-stock {
  opacity: 0.6;
}

.drink-image {
  width: 100px;
  height: 100px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #C41E3A10, #FF6B3510);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.drink-image .placeholder-icon {
  font-size: 3rem;
}

.drink-name {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.drink-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: #C41E3A;
  margin-bottom: 1rem;
}

.btn-small {
  background: #C41E3A;
  color: white;
  border: none;
  padding: 0.625rem 1rem;
  border-radius: 0.625rem;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  transition: all 0.2s;
}

.btn-small:hover:not(:disabled) {
  background: #8B0000;
  transform: translateY(-1px);
}

.btn-small:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.btn-primary {
  background: #C41E3A;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #8B0000;
  transform: translateY(-2px);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
