<template>
  <div class="p-6 pb-24">
    <!-- Header com Botão de Voltar -->
    <div class="flex items-center gap-3 mb-6">
      <button 
        @click="goBack" 
        class="btn-back"
        title="Voltar para Dashboard">
        <ArrowLeft :size="20" />
      </button>
      <h2 class="text-xl font-bold text-red-600 flex items-center gap-2">
        <Package :size="24" />
        Controle de Estoque
      </h2>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8 text-gray-500">
      Carregando produtos...
    </div>

    <!-- Products by Category -->
    <div v-else>
      <div v-for="category in categories" :key="category" class="mb-8">
        <h3 class="text-lg font-semibold text-yellow-600 mb-4 capitalize">
          {{ getCategoryName(category) }}
        </h3>
        <div class="space-y-3">
          <div 
            v-for="product in getProductsByCategory(category)" 
            :key="product.id" 
            class="stock-card"
            :class="{ 'low-stock': product.estoque_atual < product.estoque_minimo }">
            
            <div class="text-3xl">
              <Utensils v-if="category === 'espetinho'" :size="32" />
              <Coffee v-else-if="category === 'bebida'" :size="32" />
              <ChefHat v-else :size="32" />
            </div>
            
            <div class="flex-1">
              <div class="font-bold text-gray-800">{{ product.nome }}</div>
              <div class="text-sm text-gray-500 mb-1">R$ {{ formatPrice(product.preco) }}</div>
              <div class="flex items-center gap-2 mt-1">
                <span 
                  class="stock-badge" 
                  :class="{ 'low-stock-badge': product.estoque_atual < product.estoque_minimo }">
                  {{ product.estoque_atual }} unidades
                </span>
                <AlertCircle 
                  v-if="product.estoque_atual < product.estoque_minimo" 
                  :size="16" 
                  color="#ef4444" 
                />
              </div>
            </div>
            
            <div class="flex gap-2">
              <button 
                @click="decreaseStock(product)" 
                class="btn-stock btn-stock-decrease"
                :disabled="product.estoque_atual <= 0">
                <Minus :size="16" />
              </button>
              <button 
                @click="increaseStock(product)" 
                class="btn-stock btn-stock-increase">
                <Plus :size="16" />
              </button>
            </div>
          </div>

          <!-- Empty State for Category -->
          <div 
            v-if="getProductsByCategory(category).length === 0" 
            class="text-center py-4 text-gray-400">
            Nenhum produto nesta categoria
          </div>
        </div>
      </div>

      <!-- Empty State Global -->
      <div v-if="products.length === 0" class="text-center py-12">
        <Package :size="48" class="mx-auto mb-4 text-gray-300" />
        <h3 class="text-lg font-semibold text-gray-600 mb-2">Nenhum produto cadastrado</h3>
        <p class="text-gray-400">Adicione produtos para começar</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Package, Plus, Minus, AlertCircle, Utensils, Coffee, ChefHat, ArrowLeft } from 'lucide-vue-next'
import { supabase, TABLES } from '@/services/supabase'

// Router
const router = useRouter()

// Estados
const products = ref([])
const loading = ref(true)

// Categorias disponíveis
const categories = computed(() => {
  const cats = [...new Set(products.value.map(p => p.categoria))]
  return cats.filter(cat => cat)
})

// Filtrar produtos por categoria
const getProductsByCategory = (category) => {
  return products.value.filter(p => p.categoria === category)
}

// Nome formatado da categoria
const getCategoryName = (category) => {
  const names = {
    'espetinho': 'Espetinhos',
    'bebida': 'Bebidas',
    'acompanhamento': 'Acompanhamentos'
  }
  return names[category] || category
}

// Formatar preço
const formatPrice = (price) => {
  return parseFloat(price).toFixed(2).replace('.', ',')
}

// Voltar para Dashboard
const goBack = () => {
  try {
    router.push('/dashboard')
  } catch (err) {
    console.error('Erro ao voltar:', err)
    // Fallback: usar history.back()
    window.history.back()
  }
}

// Aumentar estoque
const increaseStock = async (product) => {
  try {
    const newStock = product.estoque_atual + 1
    
    const { error } = await supabase
      .from(TABLES.PRODUTOS)
      .update({ estoque_atual: newStock })
      .eq('id', product.id)
    
    if (error) throw error
    
    // Atualizar localmente
    product.estoque_atual = newStock
  } catch (error) {
    console.error('Erro ao aumentar estoque:', error)
    alert('Erro ao atualizar estoque')
  }
}

// Diminuir estoque
const decreaseStock = async (product) => {
  if (product.estoque_atual <= 0) return
  
  try {
    const newStock = product.estoque_atual - 1
    
    const { error } = await supabase
      .from(TABLES.PRODUTOS)
      .update({ estoque_atual: newStock })
      .eq('id', product.id)
    
    if (error) throw error
    
    // Atualizar localmente
    product.estoque_atual = newStock
  } catch (error) {
    console.error('Erro ao diminuir estoque:', error)
    alert('Erro ao atualizar estoque')
  }
}

// Carregar produtos
const loadProducts = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from(TABLES.PRODUTOS)
      .select('*')
      .eq('ativo', true)
      .order('categoria')
      .order('nome')
    
    if (error) throw error
    products.value = data || []
  } catch (error) {
    console.error('Erro ao carregar produtos:', error)
    alert('Erro ao carregar produtos')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProducts()
})
</script>

<style scoped>
/* Botão de Voltar */
.btn-back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #C41E3A;
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.btn-back:hover {
  background: #a01a30;
  transform: scale(1.05);
}

.btn-back:active {
  transform: scale(0.95);
}

/* Stock Card */
.stock-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  border: 2px solid #C41E3A20;
  transition: all 0.3s ease;
}

.stock-card:hover {
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.1);
  transform: translateY(-2px);
}

.stock-card.low-stock {
  border-color: #ef4444;
  background: #fef2f2;
}

.stock-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  background: #10b98120;
  color: #10b981;
}

.stock-badge.low-stock-badge {
  background: #ef444420;
  color: #ef4444;
}

.btn-stock {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-stock:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-stock-decrease {
  border: 2px solid #C41E3A;
  background: white;
  color: #C41E3A;
}

.btn-stock-decrease:hover:not(:disabled) {
  background: #C41E3A;
  color: white;
}

.btn-stock-increase {
  border: none;
  background: #C41E3A;
  color: white;
}

.btn-stock-increase:hover {
  background: #a51830;
  transform: scale(1.05);
}
</style>