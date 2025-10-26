<template>
  <div class="products-container">
    <!-- Header com botão voltar -->
    <div class="page-header">
      <button class="btn-back" @click="$router.push('/')" title="Voltar ao Dashboard">
        <ArrowLeft :size="20" />
        Voltar
      </button>
      
      <h2 class="section-title">
        <Package :size="24" />
        Produtos
      </h2>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <button class="action-btn" @click="openCreateModal">
        <Plus :size="24" />
        <div class="action-content">
          <div class="action-label">Novo Produto</div>
          <div class="action-description">Cadastrar novo produto</div>
        </div>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <p>Carregando produtos...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-message">
      {{ error }}
      <button @click="fetchProducts">Tentar novamente</button>
    </div>

    <!-- Products Table -->
    <div v-else class="products-table">
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Preço</th>
            <th>Estoque Atual</th>
            <th>Estoque Mínimo</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in paginatedProducts" :key="product.id">
            <td>{{ product.nome }}</td>
            <td>
              <span class="category-badge">
                {{ getCategoryLabel(product.categoria) }}
              </span>
            </td>
            <td>R$ {{ formatPrice(product.preco) }}</td>
            <td>
              <span 
                class="stock-display"
                :class="product.estoque_atual < product.estoque_minimo ? 'low' : 'ok'"
              >
                {{ product.estoque_atual }}
              </span>
            </td>
            <td>{{ product.estoque_minimo }}</td>
            <td>
              <span class="status-badge" :class="product.ativo ? 'active' : 'inactive'">
                {{ product.ativo ? 'Ativo' : 'Inativo' }}
              </span>
            </td>
            <td class="actions">
              <button class="btn-edit" @click="openEditModal(product)" title="Editar">✏️</button>
              <button class="btn-delete" @click="deleteProduct(product.id)" title="Deletar">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Paginação -->
      <div v-if="products.length > 0" class="pagination">
        <button 
          class="pagination-btn"
          @click="previousPage"
          :disabled="currentPage === 1">
          <ChevronLeft :size="20" />
          Anterior
        </button>

        <div class="pagination-info">
          Página {{ currentPage }} de {{ totalPages }} 
          <span class="items-info">({{ products.length }} produtos no total)</span>
        </div>

        <button 
          class="pagination-btn"
          @click="nextPage"
          :disabled="currentPage === totalPages">
          Próxima
          <ChevronRight :size="20" />
        </button>
      </div>

      <div v-if="products.length === 0" class="empty-state">
        <p>Nenhum produto cadastrado</p>
      </div>
    </div>

    <!-- Modal Create/Edit -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingProduct ? 'Editar Produto' : 'Novo Produto' }}</h2>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>

        <form @submit.prevent="saveProduct" class="modal-form">
          <div class="form-group">
            <label>Nome do Produto *</label>
            <input
              v-model="formData.nome"
              type="text"
              placeholder="Ex: Espetinho de Carne"
              required
            />
          </div>

          <div class="form-group">
            <label>Categoria *</label>
            <select v-model="formData.categoria" required>
              <option value="">Selecione uma categoria</option>
              <option value="espetinho">Espetinho</option>
              <option value="bebida">Bebida</option>
              <option value="acompanhamento">Acompanhamento</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Preço (R$) *</label>
              <input
                v-model.number="formData.preco"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
            </div>

            <div class="form-group">
              <label>Estoque Atual *</label>
              <input
                v-model.number="formData.estoque_atual"
                type="number"
                min="0"
                placeholder="0"
                required
              />
            </div>

            <div class="form-group">
              <label>Estoque Mínimo *</label>
              <input
                v-model.number="formData.estoque_minimo"
                type="number"
                min="0"
                placeholder="10"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label>
              <input
                v-model="formData.ativo"
                type="checkbox"
              />
              Produto Ativo
            </label>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="closeModal">
              Cancelar
            </button>
            <button type="submit" class="btn-submit" :disabled="submitting">
              {{ submitting ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>

        <p v-if="formError" class="form-error">{{ formError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase, TABLES } from '@/services/supabase'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { Plus, Package, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const router = useRouter()
const userStore = useUserStore()

const products = ref([])
const loading = ref(false)
const error = ref('')
const showModal = ref(false)
const submitting = ref(false)
const formError = ref('')
const editingProduct = ref(null)

// Paginação
const currentPage = ref(1)
const itemsPerPage = 10

const formData = ref({
  nome: '',
  categoria: '',
  preco: 0,
  estoque_atual: 0,
  estoque_minimo: 10,
  ativo: true
})

// Computed - Produtos paginados
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return products.value.slice(start, end)
})

// Computed - Total de páginas
const totalPages = computed(() => {
  return Math.ceil(products.value.length / itemsPerPage)
})

onMounted(async () => {
  if (!userStore.isAdmin && userStore.profile?.role !== 'gerente') {
    error.value = 'Acesso negado. Apenas administradores e gerentes podem gerenciar produtos.'
    return
  }
  
  await fetchProducts()
})

async function fetchProducts() {
  loading.value = true
  error.value = ''
  
  try {
    const { data, error: fetchError } = await supabase
      .from(TABLES.PRODUTOS)
      .select('*')
      .order('categoria')
      .order('nome')

    if (fetchError) throw fetchError

    products.value = data || []
    
    // Reset para primeira página ao recarregar
    currentPage.value = 1
  } catch (err) {
    console.error('Erro ao buscar produtos:', err)
    error.value = 'Erro ao carregar produtos'
  } finally {
    loading.value = false
  }
}

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    // Scroll para o topo da tabela
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    // Scroll para o topo da tabela
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function openCreateModal() {
  editingProduct.value = null
  formData.value = {
    nome: '',
    categoria: '',
    preco: 0,
    estoque_atual: 0,
    estoque_minimo: 10,
    ativo: true
  }
  formError.value = ''
  showModal.value = true
}

function openEditModal(product) {
  editingProduct.value = product
  formData.value = { ...product }
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingProduct.value = null
  formData.value = {
    nome: '',
    categoria: '',
    preco: 0,
    estoque_atual: 0,
    estoque_minimo: 10,
    ativo: true
  }
  formError.value = ''
}

async function saveProduct() {
  submitting.value = true
  formError.value = ''

  try {
    if (!formData.value.nome || !formData.value.categoria) {
      throw new Error('Nome e categoria são obrigatórios')
    }

    if (editingProduct.value) {
      const { error: updateError } = await supabase
        .from(TABLES.PRODUTOS)
        .update({
          nome: formData.value.nome,
          categoria: formData.value.categoria,
          preco: formData.value.preco,
          estoque_atual: formData.value.estoque_atual,
          estoque_minimo: formData.value.estoque_minimo,
          ativo: formData.value.ativo
        })
        .eq('id', editingProduct.value.id)

      if (updateError) throw updateError
    } else {
      const { error: insertError } = await supabase
        .from(TABLES.PRODUTOS)
        .insert([{
          nome: formData.value.nome,
          categoria: formData.value.categoria,
          preco: formData.value.preco,
          estoque_atual: formData.value.estoque_atual,
          estoque_minimo: formData.value.estoque_minimo,
          ativo: formData.value.ativo
        }])

      if (insertError) throw insertError
    }

    closeModal()
    await fetchProducts()
  } catch (err) {
    console.error('Erro ao salvar produto:', err)
    formError.value = err.message || 'Erro ao salvar produto'
  } finally {
    submitting.value = false
  }
}

async function deleteProduct(productId) {
  if (!confirm('Tem certeza que deseja deletar este produto?')) return

  try {
    const { error } = await supabase
      .from(TABLES.PRODUTOS)
      .delete()
      .eq('id', productId)

    if (error) throw error

    await fetchProducts()
  } catch (err) {
    console.error('Erro ao deletar produto:', err)
    error.value = 'Erro ao deletar produto'
  }
}

function getCategoryLabel(category) {
  const labels = {
    espetinho: 'Espetinho',
    bebida: 'Bebida',
    acompanhamento: 'Acompanhamento'
  }
  return labels[category] || category
}

function formatPrice(price) {
  return parseFloat(price).toFixed(2).replace('.', ',')
}
</script>

<style scoped>
.products-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  padding-bottom: 6rem;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.btn-back {
  background: white;
  color: #4b5563;
  border: 2px solid #e5e7eb;
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.btn-back:hover {
  border-color: #C41E3A;
  color: #C41E3A;
  transform: translateX(-4px);
}

.section-title {
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.action-btn {
  background: white;
  color: #1f2937;
  border: 2px solid #e5e7eb;
  padding: 1.25rem;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
  text-align: left;
}

.action-btn:hover {
  border-color: #C41E3A;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.1);
}

.action-content {
  flex: 1;
}

.action-label {
  font-weight: 600;
  color: #1f2937;
}

.action-description {
  font-size: 0.85rem;
  color: #6b7280;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
  padding: 1rem;
  margin-bottom: 1rem;
}

.error-message button {
  margin-top: 1rem;
  background: #991b1b;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.products-table {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f3f4f6;
}

th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  color: #6b7280;
}

tbody tr:hover {
  background: #f9fafb;
}

.category-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  background: #dbeafe;
  color: #0c4a6e;
}

.stock-display {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.stock-display.ok {
  background: #d1fae5;
  color: #065f46;
}

.stock-display.low {
  background: #fed7aa;
  color: #92400e;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.inactive {
  background: #e5e7eb;
  color: #6b7280;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-edit, .btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  transition: transform 0.3s;
}

.btn-edit:hover, .btn-delete:hover {
  transform: scale(1.2);
}

/* Paginação */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-top: 2px solid #f3f4f6;
}

.pagination-btn {
  background: white;
  color: #4b5563;
  border: 2px solid #e5e7eb;
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #C41E3A;
  color: #C41E3A;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-info {
  font-weight: 600;
  color: #374151;
  text-align: center;
}

.items-info {
  display: block;
  font-size: 0.85rem;
  font-weight: 400;
  color: #6b7280;
  margin-top: 0.25rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
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
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background: white;
}

.modal-header h2 {
  color: #1f2937;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
}

.modal-form {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-group input[type="checkbox"] {
  width: auto;
  margin-right: 0.5rem;
}

.form-group input[type="checkbox"] + label,
.form-group label:has(input[type="checkbox"]) {
  display: flex;
  align-items: center;
  margin-bottom: 0;
}

.form-group input,
.form-group select {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #C41E3A;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel {
  background: #e5e7eb;
  color: #374151;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-cancel:hover {
  background: #d1d5db;
}

.btn-submit {
  background: #C41E3A;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-submit:hover:not(:disabled) {
  background: #a51830;
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.form-error {
  color: #ef4444;
  margin: 0;
  padding: 1rem;
  background: #fef2f2;
  border-radius: 8px;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .products-container {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .btn-back {
    width: 100%;
    justify-content: center;
  }

  .pagination {
    flex-direction: column;
    gap: 1rem;
  }

  .pagination-btn {
    width: 100%;
    justify-content: center;
  }

  table {
    font-size: 0.85rem;
  }

  th, td {
    padding: 0.75rem 0.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .btn-cancel, .btn-submit {
    width: 100%;
  }
}
</style>