<template>
  <div class="menu-management">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <ChefHat :size="32" />
            Gerenciamento do Cardápio
          </h1>
          <p class="page-subtitle">Organize categorias e produtos do seu cardápio</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" @click="refreshData">
            <RefreshCw :size="20" :class="{ 'spinning': loading }" />
            Atualizar
          </button>
          <button class="btn-primary" @click="openCategoryModal()">
            <Plus :size="20" />
            Nova Categoria
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Carregando cardápio...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <AlertCircle :size="48" />
      <h3>Erro ao carregar dados</h3>
      <p>{{ error }}</p>
      <button class="btn-primary" @click="refreshData">Tentar Novamente</button>
    </div>

    <!-- Main Content -->
    <div v-else class="content-container">
      
      <!-- Estatísticas Rápidas -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #10b981, #059669);">
            <LayoutGrid :size="24" />
          </div>
          <div class="stat-info">
            <p class="stat-label">Total de Categorias</p>
            <p class="stat-value">{{ categories.length }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #3b82f6, #2563eb);">
            <Package :size="24" />
          </div>
          <div class="stat-info">
            <p class="stat-label">Produtos Ativos</p>
            <p class="stat-value">{{ activeProductsCount }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
            <AlertTriangle :size="24" />
          </div>
          <div class="stat-info">
            <p class="stat-label">Produtos Inativos</p>
            <p class="stat-value">{{ inactiveProductsCount }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed);">
            <TrendingUp :size="24" />
          </div>
          <div class="stat-info">
            <p class="stat-label">Produtos em Destaque</p>
            <p class="stat-value">{{ featuredProductsCount }}</p>
          </div>
        </div>
      </div>

      <!-- Lista de Categorias -->
      <div class="categories-section">
        <div v-if="categories.length === 0" class="empty-state">
          <LayoutGrid :size="64" />
          <h3>Nenhuma categoria cadastrada</h3>
          <p>Comece criando sua primeira categoria de produtos</p>
          <button class="btn-primary" @click="openCategoryModal()">
            <Plus :size="20" />
            Criar Primeira Categoria
          </button>
        </div>

        <div v-else class="categories-list">
          <div 
            v-for="category in sortedCategories" 
            :key="category.id" 
            class="category-card"
            :class="{ 'inactive': !category.ativo }">
            
            <div class="category-header">
              <div class="category-info">
                <div class="category-icon">
                  <component :is="getCategoryIcon(category.nome)" :size="28" />
                </div>
                <div>
                  <h3 class="category-name">{{ category.nome }}</h3>
                  <p class="category-description" v-if="category.descricao">
                    {{ category.descricao }}
                  </p>
                  <div class="category-meta">
                    <span class="badge" :class="category.ativo ? 'badge-success' : 'badge-warning'">
                      {{ category.ativo ? 'Ativa' : 'Inativa' }}
                    </span>
                    <span class="category-count">
                      {{ getCategoryProductCount(category.id) }} produtos
                    </span>
                  </div>
                </div>
              </div>

              <div class="category-actions">
                <button 
                  class="btn-icon" 
                  @click="toggleCategoryStatus(category)"
                  :title="category.ativo ? 'Desativar' : 'Ativar'">
                  <EyeOff v-if="category.ativo" :size="20" />
                  <Eye v-else :size="20" />
                </button>
                <button 
                  class="btn-icon" 
                  @click="openCategoryModal(category)"
                  title="Editar categoria">
                  <Edit2 :size="20" />
                </button>
                <button 
                  class="btn-icon delete" 
                  @click="deleteCategory(category)"
                  title="Excluir categoria">
                  <Trash2 :size="20" />
                </button>
              </div>
            </div>

            <!-- Produtos da Categoria -->
            <div v-if="getCategoryProducts(category.id).length > 0" class="category-products">
              <div class="products-header">
                <h4>Produtos desta categoria</h4>
                <button class="btn-link" @click="goToProducts(category.id)">
                  Ver todos
                  <ChevronRight :size="16" />
                </button>
              </div>

              <div class="products-grid">
                <div 
                  v-for="product in getCategoryProducts(category.id).slice(0, 6)" 
                  :key="product.id"
                  class="product-mini-card"
                  :class="{ 'inactive': !product.ativo }">
                  
                  <div class="product-mini-info">
                    <p class="product-mini-name">{{ product.nome }}</p>
                    <p class="product-mini-price">R$ {{ formatPrice(product.preco_venda) }}</p>
                  </div>

                  <div class="product-mini-badges">
                    <span v-if="!product.ativo" class="badge-small badge-warning">Inativo</span>
                    <span v-if="product.estoque_atual <= 0" class="badge-small badge-danger">Sem estoque</span>
                    <span v-else-if="product.estoque_atual < product.estoque_minimo" class="badge-small badge-warning">
                      Estoque baixo
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="empty-category">
              <p>Nenhum produto nesta categoria</p>
              <button class="btn-link" @click="goToProducts(category.id)">
                <Plus :size="16" />
                Adicionar produtos
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Ações Rápidas -->
      <div class="quick-actions">
        <h3 class="section-title">Ações Rápidas</h3>
        <div class="actions-grid">
          <router-link to="/products" class="action-card">
            <div class="action-icon" style="background: linear-gradient(135deg, #10b981, #059669);">
              <Package :size="32" />
            </div>
            <div class="action-content">
              <h4>Gerenciar Produtos</h4>
              <p>Adicione, edite ou remova produtos</p>
            </div>
            <ChevronRight :size="24" class="action-arrow" />
          </router-link>

          <router-link to="/stock" class="action-card">
            <div class="action-icon" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
              <TrendingUp :size="32" />
            </div>
            <div class="action-content">
              <h4>Controle de Estoque</h4>
              <p>Gerencie o estoque dos produtos</p>
            </div>
            <ChevronRight :size="24" class="action-arrow" />
          </router-link>
        </div>
      </div>
    </div>

    <!-- Modal de Categoria -->
    <div v-if="showCategoryModal" class="modal-overlay" @click.self="closeCategoryModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ editingCategory ? 'Editar Categoria' : 'Nova Categoria' }}</h2>
          <button class="btn-icon" @click="closeCategoryModal">
            <X :size="24" />
          </button>
        </div>

        <form @submit.prevent="saveCategory" class="modal-body">
          <div class="form-group">
            <label class="form-label">Nome da Categoria *</label>
            <input 
              v-model="categoryForm.nome" 
              type="text" 
              class="form-input"
              placeholder="Ex: Espetinhos, Bebidas, Acompanhamentos"
              required>
          </div>

          <div class="form-group">
            <label class="form-label">Descrição</label>
            <textarea 
              v-model="categoryForm.descricao" 
              class="form-input"
              rows="3"
              placeholder="Descrição opcional da categoria"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Ordem de Exibição</label>
            <input 
              v-model.number="categoryForm.ordem" 
              type="number" 
              class="form-input"
              min="0"
              placeholder="0">
            <p class="form-hint">Categorias com menor número aparecem primeiro</p>
          </div>

          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input 
                v-model="categoryForm.ativo" 
                type="checkbox"
                class="form-checkbox">
              <span>Categoria ativa</span>
            </label>
            <p class="form-hint">Categorias inativas não aparecem para os clientes</p>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="closeCategoryModal">
              Cancelar
            </button>
            <button type="submit" class="btn-primary" :disabled="savingCategory">
              <component :is="savingCategory ? RefreshCw : Check" :size="20" :class="{ 'spinning': savingCategory }" />
              {{ savingCategory ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { 
  ChefHat, 
  RefreshCw, 
  Plus, 
  AlertCircle, 
  LayoutGrid,
  Package,
  AlertTriangle,
  TrendingUp,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  ChevronRight,
  X,
  Check,
  Flame,
  Coffee,
  Utensils
} from 'lucide-vue-next'
import { supabase, TABLES } from '@/services/supabase'

export default {
  name: 'MenuView',
  components: {
    ChefHat,
    RefreshCw,
    Plus,
    AlertCircle,
    LayoutGrid,
    Package,
    AlertTriangle,
    TrendingUp,
    Eye,
    EyeOff,
    Edit2,
    Trash2,
    ChevronRight,
    X,
    Check,
    Flame,
    Coffee,
    Utensils
  },
  data() {
    return {
      loading: false,
      error: null,
      categories: [],
      products: [],
      showCategoryModal: false,
      editingCategory: null,
      savingCategory: false,
      categoryForm: {
        nome: '',
        descricao: '',
        ordem: 0,
        ativo: true
      }
    }
  },
  computed: {
    sortedCategories() {
      return [...this.categories].sort((a, b) => {
        // Ordena por ordem, depois por nome
        if (a.ordem !== b.ordem) {
          return a.ordem - b.ordem
        }
        return a.nome.localeCompare(b.nome)
      })
    },
    activeProductsCount() {
      return this.products.filter(p => p.ativo).length
    },
    inactiveProductsCount() {
      return this.products.filter(p => !p.ativo).length
    },
    featuredProductsCount() {
      return this.products.filter(p => p.destaque).length
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    async loadData() {
      this.loading = true
      this.error = null

      try {
        // Carregar categorias
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('pwa_categorias')
          .select('*')
          .order('ordem', { ascending: true })

        if (categoriesError) throw categoriesError
        this.categories = categoriesData || []

        // Carregar produtos
        const { data: productsData, error: productsError } = await supabase
          .from(TABLES.PRODUTOS)
          .select('*')
          .order('nome', { ascending: true })

        if (productsError) throw productsError
        this.products = productsData || []

      } catch (err) {
        console.error('Erro ao carregar dados:', err)
        this.error = err.message || 'Erro ao carregar dados do cardápio'
      } finally {
        this.loading = false
      }
    },

    refreshData() {
      this.loadData()
    },

    getCategoryProducts(categoryId) {
      return this.products.filter(p => p.categoria_id === categoryId)
    },

    getCategoryProductCount(categoryId) {
      return this.getCategoryProducts(categoryId).length
    },

    getCategoryIcon(categoryName) {
      const name = categoryName?.toLowerCase() || ''
      
      if (name.includes('espetinho')) return Flame
      if (name.includes('bebida')) return Coffee
      if (name.includes('acompanhamento')) return Utensils
      
      return LayoutGrid
    },

    openCategoryModal(category = null) {
      this.editingCategory = category
      
      if (category) {
        this.categoryForm = {
          nome: category.nome,
          descricao: category.descricao || '',
          ordem: category.ordem || 0,
          ativo: category.ativo
        }
      } else {
        this.categoryForm = {
          nome: '',
          descricao: '',
          ordem: this.categories.length,
          ativo: true
        }
      }
      
      this.showCategoryModal = true
    },

    closeCategoryModal() {
      this.showCategoryModal = false
      this.editingCategory = null
      this.categoryForm = {
        nome: '',
        descricao: '',
        ordem: 0,
        ativo: true
      }
    },

    async saveCategory() {
      if (!this.categoryForm.nome.trim()) {
        alert('Por favor, preencha o nome da categoria')
        return
      }

      this.savingCategory = true

      try {
        if (this.editingCategory) {
          // Atualizar categoria existente
          const { error } = await supabase
            .from('pwa_categorias')
            .update(this.categoryForm)
            .eq('id', this.editingCategory.id)

          if (error) throw error

          alert('Categoria atualizada com sucesso!')
        } else {
          // Criar nova categoria
          const { error } = await supabase
            .from('pwa_categorias')
            .insert([this.categoryForm])

          if (error) throw error

          alert('Categoria criada com sucesso!')
        }

        this.closeCategoryModal()
        await this.loadData()

      } catch (err) {
        console.error('Erro ao salvar categoria:', err)
        alert('Erro ao salvar categoria: ' + err.message)
      } finally {
        this.savingCategory = false
      }
    },

    async toggleCategoryStatus(category) {
      try {
        const { error } = await supabase
          .from('pwa_categorias')
          .update({ ativo: !category.ativo })
          .eq('id', category.id)

        if (error) throw error

        await this.loadData()
      } catch (err) {
        console.error('Erro ao alterar status:', err)
        alert('Erro ao alterar status da categoria')
      }
    },

    async deleteCategory(category) {
      const productsCount = this.getCategoryProductCount(category.id)
      
      if (productsCount > 0) {
        alert(`Não é possível excluir esta categoria pois ela possui ${productsCount} produto(s).\n\nRemova ou mova os produtos antes de excluir a categoria.`)
        return
      }

      if (!confirm(`Tem certeza que deseja excluir a categoria "${category.nome}"?`)) {
        return
      }

      try {
        const { error } = await supabase
          .from('pwa_categorias')
          .delete()
          .eq('id', category.id)

        if (error) throw error

        alert('Categoria excluída com sucesso!')
        await this.loadData()

      } catch (err) {
        console.error('Erro ao excluir categoria:', err)
        alert('Erro ao excluir categoria: ' + err.message)
      }
    },

    goToProducts(categoryId) {
      this.$router.push({ 
        path: '/products',
        query: { categoria: categoryId }
      })
    },

    formatPrice(price) {
      return Number(price || 0).toFixed(2).replace('.', ',')
    }
  }
}
</script>

<style scoped>
/* Layout Principal */
.menu-management {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem;
}

/* Header */
.page-header {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.header-left {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 2rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

/* Buttons */
.btn-primary {
  background: #C41E3A;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  background: #a01a30;
  transform: translateY(-2px);
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #4b5563;
  border: 2px solid #e5e7eb;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  border-color: #C41E3A;
  color: #C41E3A;
  transform: translateY(-2px);
}

.btn-icon {
  background: transparent;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: #f3f4f6;
  color: #C41E3A;
}

.btn-icon.delete:hover {
  background: #fee2e2;
  color: #ef4444;
}

.btn-link {
  background: transparent;
  border: none;
  color: #C41E3A;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.btn-link:hover {
  background: rgba(196, 30, 58, 0.1);
}

/* Loading & Error */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.loading-spinner {
  width: 64px;
  height: 64px;
  border: 4px solid #e5e7eb;
  border-top-color: #C41E3A;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinning {
  animation: spin 1s linear infinite;
}

.error-container {
  color: #ef4444;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.25rem 0;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

/* Categories */
.categories-section {
  margin-bottom: 2rem;
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.category-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.category-card.inactive {
  opacity: 0.7;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.category-info {
  display: flex;
  gap: 1rem;
  flex: 1;
}

.category-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: linear-gradient(135deg, #C41E3A15, #FF6B3515);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #C41E3A;
  flex-shrink: 0;
}

.category-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 0.25rem 0;
}

.category-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
}

.category-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.category-count {
  font-size: 0.875rem;
  color: #6b7280;
}

.category-actions {
  display: flex;
  gap: 0.5rem;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-success {
  background: #d1fae5;
  color: #065f46;
}

.badge-warning {
  background: #fef3c7;
  color: #92400e;
}

.badge-danger {
  background: #fee2e2;
  color: #991b1b;
}

.badge-small {
  padding: 0.125rem 0.5rem;
  font-size: 0.7rem;
}

/* Products */
.category-products {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #f3f4f6;
}

.products-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.products-header h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #4b5563;
  margin: 0;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.product-mini-card {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.product-mini-card:hover {
  border-color: #C41E3A;
  box-shadow: 0 2px 8px rgba(196, 30, 58, 0.1);
}

.product-mini-card.inactive {
  opacity: 0.6;
}

.product-mini-info {
  margin-bottom: 0.5rem;
}

.product-mini-name {
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
}

.product-mini-price {
  color: #C41E3A;
  font-weight: 700;
  margin: 0;
  font-size: 1rem;
}

.product-mini-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.empty-category {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
}

.empty-category p {
  margin: 0 0 1rem 0;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #9ca3af;
}

.empty-state h3 {
  margin: 1rem 0 0.5rem;
  color: #4b5563;
}

.empty-state p {
  margin: 0 0 1.5rem;
}

/* Quick Actions */
.quick-actions {
  margin-top: 3rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 1rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.action-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  text-decoration: none;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(196, 30, 58, 0.15);
  border-color: #C41E3A;
}

.action-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.action-content {
  flex: 1;
}

.action-content h4 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 0.25rem 0;
}

.action-content p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.action-arrow {
  color: #9ca3af;
  transition: transform 0.3s ease;
}

.action-card:hover .action-arrow {
  transform: translateX(4px);
  color: #C41E3A;
}

/* Modal */
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
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #f3f4f6;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 2px solid #f3f4f6;
}

/* Form */
.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #C41E3A;
  box-shadow: 0 0 0 3px rgba(196, 30, 58, 0.1);
}

.form-hint {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-weight: 600;
  color: #374151;
}

.form-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

/* Responsive */
@media (max-width: 768px) {
  .menu-management {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .header-actions button {
    width: 100%;
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .category-header {
    flex-direction: column;
  }

  .category-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>