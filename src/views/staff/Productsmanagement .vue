<template>
  <div class="products-management-container">
    <!-- Header -->
    <div class="management-header">
      <button @click="goBack" class="btn-back">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1>Gerenciar Produtos</h1>
      <button @click="openCreateModal" class="btn-add">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Novo Produto
      </button>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="search-box">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar produto..."
        >
      </div>

      <select v-model="filterCategory" class="filter-select">
        <option value="">Todas Categorias</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">
          {{ cat.name }}
        </option>
      </select>

      <select v-model="filterStatus" class="filter-select">
        <option value="">Todos Status</option>
        <option value="active">Ativos</option>
        <option value="inactive">Inativos</option>
        <option value="low-stock">Estoque Baixo</option>
        <option value="out-stock">Sem Estoque</option>
      </select>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon active">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ activeProducts }}</span>
          <span class="stat-label">Ativos</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon warning">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ lowStockProducts }}</span>
          <span class="stat-label">Estoque Baixo</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon danger">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ outOfStockProducts }}</span>
          <span class="stat-label">Sem Estoque</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon inactive">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ inactiveProducts }}</span>
          <span class="stat-label">Inativos</span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando produtos...</p>
    </div>

    <!-- Products Table -->
    <div v-else-if="filteredProducts.length > 0" class="products-table">
      <table>
        <thead>
          <tr>
            <th>Imagem</th>
            <th>Produto</th>
            <th>Categoria</th>
            <th>Preço</th>
            <th>Estoque</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="product in filteredProducts" 
            :key="product.id"
            :class="{ 'inactive-row': !product.ativo }"
          >
            <td class="image-cell">
              <div class="product-image">
                <img 
                  v-if="product.imagem_url" 
                  :src="product.imagem_url" 
                  :alt="product.nome"
                >
                <div v-else class="placeholder-image">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                </div>
              </div>
            </td>
            <td>
              <div class="product-info">
                <span class="product-name">{{ product.nome }}</span>
                <span v-if="product.descricao" class="product-desc">{{ product.descricao }}</span>
              </div>
            </td>
            <td>
              <span class="category-badge">
                {{ getCategoryName(product.categoria_id) }}
              </span>
            </td>
            <td class="price-cell">R$ {{ formatPrice(product.preco) }}</td>
            <td>
              <div class="stock-info">
                <span class="stock-value" :class="getStockClass(product)">
                  {{ product.estoque_atual }}
                </span>
                <span class="stock-min">Min: {{ product.estoque_minimo }}</span>
              </div>
            </td>
            <td>
              <span class="status-badge" :class="{ active: product.ativo, inactive: !product.ativo }">
                {{ product.ativo ? 'Ativo' : 'Inativo' }}
              </span>
            </td>
            <td class="actions-cell">
              <button @click="openEditModal(product)" class="btn-icon edit" title="Editar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button @click="toggleStatus(product)" class="btn-icon toggle" :title="product.ativo ? 'Desativar' : 'Ativar'">
                <svg v-if="product.ativo" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
              <button @click="deleteProduct(product)" class="btn-icon delete" title="Excluir">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
      <p>Nenhum produto encontrado</p>
      <button @click="openCreateModal" class="btn-primary">
        Criar Primeiro Produto
      </button>
    </div>

    <!-- Product Modal -->
    <transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ editingProduct ? 'Editar Produto' : 'Novo Produto' }}</h2>
            <button @click="closeModal" class="btn-close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveProduct" class="modal-form">
            <div class="form-grid">
              <div class="form-group full">
                <label>Nome do Produto *</label>
                <input 
                  v-model="formData.nome" 
                  type="text" 
                  required
                  placeholder="Ex: Hambúrguer Artesanal"
                >
              </div>

              <div class="form-group full">
                <label>Descrição</label>
                <textarea 
                  v-model="formData.descricao" 
                  rows="3"
                  placeholder="Descreva o produto..."
                ></textarea>
              </div>

              <div class="form-group">
                <label>Categoria *</label>
                <select v-model="formData.categoria_id" required>
                  <option value="">Selecione...</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                    {{ cat.name }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>Preço (R$) *</label>
                <input 
                  v-model="formData.preco" 
                  type="number" 
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                >
              </div>

              <div class="form-group">
                <label>Estoque Atual *</label>
                <input 
                  v-model="formData.estoque_atual" 
                  type="number"
                  min="0"
                  required
                  placeholder="0"
                >
              </div>

              <div class="form-group">
                <label>Estoque Mínimo *</label>
                <input 
                  v-model="formData.estoque_minimo" 
                  type="number"
                  min="0"
                  required
                  placeholder="0"
                >
              </div>

              <div class="form-group full">
                <label>URL da Imagem</label>
                <input 
                  v-model="formData.imagem_url" 
                  type="url"
                  placeholder="https://exemplo.com/imagem.jpg"
                >
              </div>

              <div class="form-group full">
                <label class="checkbox-label">
                  <input 
                    v-model="formData.ativo" 
                    type="checkbox"
                  >
                  <span>Produto Ativo</span>
                </label>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" @click="closeModal" class="btn-secondary">
                Cancelar
              </button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Salvando...' : 'Salvar Produto' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, TABLES } from '@/services/supabase'
import { syncService } from '@/services/syncService'

const router = useRouter()

const products = ref([])
const categories = ref([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const editingProduct = ref(null)
const searchQuery = ref('')
const filterCategory = ref('')
const filterStatus = ref('')

const formData = ref({
  nome: '',
  descricao: '',
  categoria_id: '',
  preco: 0,
  estoque_atual: 0,
  estoque_minimo: 5,
  imagem_url: '',
  ativo: true
})

// Computed
const activeProducts = computed(() => {
  return products.value.filter(p => p.ativo).length
})

const inactiveProducts = computed(() => {
  return products.value.filter(p => !p.ativo).length
})

const lowStockProducts = computed(() => {
  return products.value.filter(p => 
    p.ativo && p.estoque_atual > 0 && p.estoque_atual <= p.estoque_minimo
  ).length
})

const outOfStockProducts = computed(() => {
  return products.value.filter(p => p.ativo && p.estoque_atual === 0).length
})

const filteredProducts = computed(() => {
  let filtered = [...products.value]

  // Filtro de busca
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p =>
      p.nome.toLowerCase().includes(query) ||
      (p.descricao && p.descricao.toLowerCase().includes(query))
    )
  }

  // Filtro de categoria
  if (filterCategory.value) {
    filtered = filtered.filter(p => p.categoria_id === filterCategory.value)
  }

  // Filtro de status
  if (filterStatus.value === 'active') {
    filtered = filtered.filter(p => p.ativo)
  } else if (filterStatus.value === 'inactive') {
    filtered = filtered.filter(p => !p.ativo)
  } else if (filterStatus.value === 'low-stock') {
    filtered = filtered.filter(p => 
      p.ativo && p.estoque_atual > 0 && p.estoque_atual <= p.estoque_minimo
    )
  } else if (filterStatus.value === 'out-stock') {
    filtered = filtered.filter(p => p.ativo && p.estoque_atual === 0)
  }

  return filtered
})

// Methods
const formatPrice = (price) => {
  return parseFloat(price).toFixed(2).replace('.', ',')
}

const getCategoryName = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId)
  return category?.name || 'Sem categoria'
}

const getStockClass = (product) => {
  if (product.estoque_atual === 0) return 'out-stock'
  if (product.estoque_atual <= product.estoque_minimo) return 'low-stock'
  return 'normal-stock'
}

const loadData = async () => {
  loading.value = true

  try {
    // Carregar produtos
    const { data: productsData, error: productsError } = await supabase
      .from(TABLES.PRODUTOS)
      .select('*')
      .order('nome', { ascending: true })

    if (productsError) throw productsError
    products.value = productsData || []

    // Carregar categorias
    const { data: categoriesData, error: categoriesError } = await supabase
      .from(TABLES.CATEGORIAS)
      .select('*')
      .order('name', { ascending: true })

    if (categoriesError) throw categoriesError
    categories.value = categoriesData || []

    console.log('✅ Dados carregados:', products.value.length, 'produtos')
  } catch (error) {
    console.error('❌ Erro ao carregar dados:', error)
    alert('Erro ao carregar dados. Tente novamente.')
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  editingProduct.value = null
  formData.value = {
    nome: '',
    descricao: '',
    categoria_id: '',
    preco: 0,
    estoque_atual: 0,
    estoque_minimo: 5,
    imagem_url: '',
    ativo: true
  }
  showModal.value = true
}

const openEditModal = (product) => {
  editingProduct.value = product
  formData.value = {
    nome: product.nome,
    descricao: product.descricao || '',
    categoria_id: product.categoria_id,
    preco: product.preco,
    estoque_atual: product.estoque_atual,
    estoque_minimo: product.estoque_minimo,
    imagem_url: product.imagem_url || '',
    ativo: product.ativo
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingProduct.value = null
}

const saveProduct = async () => {
  saving.value = true

  try {
    const productData = {
      ...formData.value,
      preco: parseFloat(formData.value.preco),
      estoque_atual: parseInt(formData.value.estoque_atual),
      estoque_minimo: parseInt(formData.value.estoque_minimo)
    }

    if (editingProduct.value) {
      // Atualizar
      const result = await syncService.update(
        TABLES.PRODUTOS,
        editingProduct.value.id,
        productData
      )

      if (result.offline) {
        alert('Atualização será sincronizada quando voltar online')
      }

      // Atualizar localmente
      const index = products.value.findIndex(p => p.id === editingProduct.value.id)
      if (index !== -1) {
        products.value[index] = { ...editingProduct.value, ...productData }
      }

      console.log('✅ Produto atualizado:', editingProduct.value.id)
    } else {
      // Criar
      const result = await syncService.insert(TABLES.PRODUTOS, productData)

      if (result.offline) {
        alert('Produto será criado quando voltar online')
      }

      // Adicionar localmente
      if (result.data) {
        products.value.push(result.data)
      }

      console.log('✅ Produto criado')
    }

    closeModal()
  } catch (error) {
    console.error('❌ Erro ao salvar produto:', error)
    alert('Erro ao salvar produto. Tente novamente.')
  } finally {
    saving.value = false
  }
}

const toggleStatus = async (product) => {
  try {
    const newStatus = !product.ativo
    const result = await syncService.update(TABLES.PRODUTOS, product.id, {
      ativo: newStatus
    })

    if (result.offline) {
      alert('Atualização será sincronizada quando voltar online')
    }

    // Atualizar localmente
    product.ativo = newStatus
    console.log(`✅ Produto ${newStatus ? 'ativado' : 'desativado'}:`, product.id)
  } catch (error) {
    console.error('❌ Erro ao alterar status:', error)
    alert('Erro ao alterar status. Tente novamente.')
  }
}

const deleteProduct = async (product) => {
  if (!confirm(`Tem certeza que deseja excluir "${product.nome}"?`)) {
    return
  }

  try {
    const result = await syncService.delete(TABLES.PRODUTOS, product.id)

    if (result.offline) {
      alert('Exclusão será sincronizada quando voltar online')
    }

    // Remover localmente
    const index = products.value.findIndex(p => p.id === product.id)
    if (index !== -1) {
      products.value.splice(index, 1)
    }

    console.log('✅ Produto excluído:', product.id)
  } catch (error) {
    console.error('❌ Erro ao excluir produto:', error)
    alert('Erro ao excluir produto. Tente novamente.')
  }
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.products-management-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  padding-bottom: 2rem;
}

.management-header {
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  color: white;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
}

.btn-back {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 8px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.management-header h1 {
  margin: 0;
  font-size: 1.5rem;
  flex: 1;
}

.btn-add {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 600;
}

.filters-bar {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: white;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  padding: 0.75rem;
  border-radius: 8px;
}

.search-box input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  padding: 1rem;
}

.stat-card {
  background: white;
  padding: 1rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #C41E3A;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.products-table {
  padding: 1rem;
}

table {
  width: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #6b7280;
}

td {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
}
</style>