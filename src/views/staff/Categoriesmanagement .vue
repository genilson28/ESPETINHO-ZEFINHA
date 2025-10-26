<template>
  <div class="categories-container">
    <!-- Header -->
    <div class="header">
      <button @click="goBack" class="btn-back">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1>Gerenciar Categorias</h1>
      <button @click="openCreateModal" class="btn-add">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Nova Categoria
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Carregando categorias...</p>
    </div>

    <!-- Categories Grid -->
    <div v-else-if="categories.length > 0" class="categories-grid">
      <div 
        v-for="category in categories" 
        :key="category.id"
        class="category-card"
      >
        <div class="category-header">
          <h3>{{ category.name }}</h3>
          <div class="actions">
            <button @click="openEditModal(category)" class="btn-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button @click="deleteCategory(category)" class="btn-icon delete">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
        <p v-if="category.description" class="description">{{ category.description }}</p>
        <div class="products-count">
          {{ getProductsCount(category.id) }} produto(s)
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      <p>Nenhuma categoria cadastrada</p>
      <button @click="openCreateModal" class="btn-primary">
        Criar Primeira Categoria
      </button>
    </div>

    <!-- Modal -->
    <transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ editingCategory ? 'Editar Categoria' : 'Nova Categoria' }}</h2>
            <button @click="closeModal" class="btn-close">×</button>
          </div>
          <form @submit.prevent="saveCategory" class="modal-form">
            <div class="form-group">
              <label>Nome da Categoria *</label>
              <input 
                v-model="formData.name" 
                type="text" 
                required
                placeholder="Ex: Lanches, Bebidas, Sobremesas"
              >
            </div>
            <div class="form-group">
              <label>Descrição</label>
              <textarea 
                v-model="formData.description" 
                rows="3"
                placeholder="Descrição opcional da categoria"
              ></textarea>
            </div>
            <div class="modal-footer">
              <button type="button" @click="closeModal" class="btn-secondary">
                Cancelar
              </button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Salvando...' : 'Salvar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, TABLES } from '@/services/supabase'
import { syncService } from '@/services/syncService'

const router = useRouter()

const categories = ref([])
const products = ref([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const editingCategory = ref(null)

const formData = ref({
  name: '',
  description: ''
})

const getProductsCount = (categoryId) => {
  return products.value.filter(p => p.categoria_id === categoryId).length
}

const loadData = async () => {
  loading.value = true

  try {
    // Carregar categorias
    const { data: catsData, error: catsError } = await supabase
      .from(TABLES.CATEGORIAS)
      .select('*')
      .order('name', { ascending: true })

    if (catsError) throw catsError
    categories.value = catsData || []

    // Carregar produtos
    const { data: prodsData, error: prodsError } = await supabase
      .from(TABLES.PRODUTOS)
      .select('id, categoria_id')

    if (prodsError) throw prodsError
    products.value = prodsData || []

    console.log('✅ Categorias carregadas:', categories.value.length)
  } catch (error) {
    console.error('❌ Erro ao carregar dados:', error)
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  editingCategory.value = null
  formData.value = {
    name: '',
    description: ''
  }
  showModal.value = true
}

const openEditModal = (category) => {
  editingCategory.value = category
  formData.value = {
    name: category.name,
    description: category.description || ''
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingCategory.value = null
}

const saveCategory = async () => {
  saving.value = true

  try {
    if (editingCategory.value) {
      // Atualizar
      const result = await syncService.update(
        TABLES.CATEGORIAS,
        editingCategory.value.id,
        formData.value
      )

      if (result.offline) {
        alert('Atualização será sincronizada quando voltar online')
      }

      // Atualizar localmente
      const index = categories.value.findIndex(c => c.id === editingCategory.value.id)
      if (index !== -1) {
        categories.value[index] = { ...editingCategory.value, ...formData.value }
      }

      console.log('✅ Categoria atualizada:', editingCategory.value.id)
    } else {
      // Criar
      const result = await syncService.insert(TABLES.CATEGORIAS, formData.value)

      if (result.offline) {
        alert('Categoria será criada quando voltar online')
      }

      // Adicionar localmente
      if (result.data) {
        categories.value.push(result.data)
      }

      console.log('✅ Categoria criada')
    }

    closeModal()
  } catch (error) {
    console.error('❌ Erro ao salvar categoria:', error)
    alert('Erro ao salvar categoria. Tente novamente.')
  } finally {
    saving.value = false
  }
}

const deleteCategory = async (category) => {
  const productsCount = getProductsCount(category.id)

  if (productsCount > 0) {
    alert(`Não é possível excluir esta categoria pois ela possui ${productsCount} produto(s) associado(s).`)
    return
  }

  if (!confirm(`Tem certeza que deseja excluir a categoria "${category.name}"?`)) {
    return
  }

  try {
    const result = await syncService.delete(TABLES.CATEGORIAS, category.id)

    if (result.offline) {
      alert('Exclusão será sincronizada quando voltar online')
    }

    // Remover localmente
    const index = categories.value.findIndex(c => c.id === category.id)
    if (index !== -1) {
      categories.value.splice(index, 1)
    }

    console.log('✅ Categoria excluída:', category.id)
  } catch (error) {
    console.error('❌ Erro ao excluir categoria:', error)
    alert('Erro ao excluir categoria. Tente novamente.')
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
.categories-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  padding-bottom: 2rem;
}

.header {
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  color: white;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
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
}

.header h1 {
  margin: 0;
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

.loading {
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

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
}

.category-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.category-header h3 {
  margin: 0;
  color: #1f2937;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: transparent;
  border: 1px solid #e5e7eb;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.btn-icon.delete:hover {
  background: #ef444420;
  border-color: #ef4444;
  color: #ef4444;
}

.description {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
}

.products-count {
  color: #C41E3A;
  font-weight: 600;
  font-size: 0.875rem;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #6b7280;
}

.empty svg {
  opacity: 0.5;
  margin-bottom: 1rem;
}

.btn-primary {
  background: #C41E3A;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
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
  max-width: 500px;
  width: 100%;
  margin: 1rem;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #6b7280;
}

.modal-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #6b7280;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn-secondary {
  background: #e5e7eb;
  color: #6b7280;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>