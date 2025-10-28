<template>
  <div class="products-container">
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

    <div class="quick-actions">
      <button class="action-btn" @click="openCreateModal">
        <Plus :size="24" />
        <div class="action-content">
          <div class="action-label">Novo Produto</div>
          <div class="action-description">Cadastrar novo produto</div>
        </div>
      </button>
    </div>

    <!-- BARRA DE PESQUISA -->
    <div class="search-bar">
      <div class="search-input-wrapper">
        <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar por nome, categoria..." 
          class="search-input"
        />
        <button v-if="searchQuery" @click="searchQuery = ''" class="search-clear">✕</button>
      </div>
      <div class="search-info">
        {{ filteredProducts.length }} {{ filteredProducts.length === 1 ? 'produto' : 'produtos' }} encontrado{{ filteredProducts.length === 1 ? '' : 's' }}
      </div>
    </div>

    <div v-if="loading" class="loading"><p>Carregando produtos...</p></div>
    <div v-else-if="error" class="error-message">{{ error }}<button @click="fetchProducts">Tentar novamente</button></div>

    <div v-else class="products-table">
      <table>
        <thead>
          <tr>
            <th>Foto</th><th>Nome</th><th>Categoria</th><th>Preço</th><th>Estoque Atual</th><th>Estoque Mínimo</th><th>Status</th><th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in paginatedProducts" :key="product.id">
            <td><div class="product-image-cell"><img v-if="product.imagem_url" :src="product.imagem_url" :alt="product.nome" class="product-thumbnail" /><div v-else class="product-no-image">{{ getCategoryEmoji(product.categoria) }}</div></div></td>
            <td>{{ product.nome }}</td>
            <td><span class="category-badge">{{ getCategoryLabel(product.categoria) }}</span></td>
            <td>R$ {{ formatPrice(product.preco) }}</td>
            <td><span class="stock-display" :class="product.estoque_atual < product.estoque_minimo ? 'low' : 'ok'">{{ product.estoque_atual }}</span></td>
            <td>{{ product.estoque_minimo }}</td>
            <td><span class="status-badge" :class="product.ativo ? 'active' : 'inactive'">{{ product.ativo ? 'Ativo' : 'Inativo' }}</span></td>
            <td class="actions"><button class="btn-edit" @click="openEditModal(product)">✏️</button><button class="btn-delete" @click="deleteProduct(product.id)">🗑️</button></td>
          </tr>
        </tbody>
      </table>

      <div v-if="filteredProducts.length > 0" class="pagination">
        <button class="pagination-btn" @click="previousPage" :disabled="currentPage === 1"><ChevronLeft :size="20" />Anterior</button>
        <div class="pagination-info">Página {{ currentPage }} de {{ totalPages }} <span class="items-info">({{ filteredProducts.length }} produtos)</span></div>
        <button class="pagination-btn" @click="nextPage" :disabled="currentPage === totalPages">Próxima<ChevronRight :size="20" /></button>
      </div>
      <div v-if="filteredProducts.length === 0" class="empty-state"><p>Nenhum produto encontrado</p></div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingProduct ? 'Editar Produto' : 'Novo Produto' }}</h2>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>

        <form @submit.prevent="saveProduct" class="modal-form">
          <div class="form-group image-upload-section">
            <label class="form-label">Foto do Produto</label>
            
            <div v-if="(imagePreview || formData.imagem_url) && !showImageEditor" class="image-preview-container">
              <img :src="imagePreview || formData.imagem_url" alt="Preview" class="image-preview" />
              <div class="image-actions">
                <button v-if="selectedImageFile" type="button" @click="showImageEditor = true" class="btn-edit-image">✏️ Editar</button>
                <button type="button" @click="removeImage" class="btn-remove-image"><X :size="20" /></button>
              </div>
            </div>

            <div v-else-if="!showImageEditor" class="upload-area" @click="triggerFileInput">
              <input ref="fileInput" type="file" accept="image/*" @change="handleImageUpload" class="file-input-hidden" />
              <div class="upload-content">
                <Upload :size="48" class="upload-icon" />
                <p class="upload-text">Clique ou arraste uma imagem</p>
                <p class="upload-hint">PNG, JPG, WEBP até 5MB</p>
              </div>
            </div>

            <div v-if="showImageEditor" class="image-editor">
              <div class="editor-header">
                <h3>Ajustar Imagem</h3>
                <button type="button" @click="cancelImageEdit" class="btn-cancel-edit">Cancelar</button>
              </div>
              <div class="editor-preview">
                <div class="crop-container">
                  <img ref="editorImage" :src="originalImage" :style="{ transform: `scale(${cropData.zoom}) rotate(${cropData.rotation}deg)` }" alt="Editor" />
                </div>
              </div>
              <div class="editor-controls">
                <div class="control-group">
                  <label>Zoom: {{ cropData.zoom.toFixed(1) }}x</label>
                  <input type="range" min="0.5" max="3" step="0.1" :value="cropData.zoom" @input="updateZoom" class="zoom-slider" />
                </div>
                <div class="control-group">
                  <button type="button" @click="rotateImage" class="btn-rotate">🔄 Girar 90°</button>
                </div>
                <button type="button" @click="applyImageCrop" class="btn-apply-crop">✓ Aplicar</button>
              </div>
            </div>

            <p v-if="uploadError" class="upload-error">{{ uploadError }}</p>
            <p v-if="uploading" class="upload-progress">Enviando... {{ uploadProgress }}%</p>
          </div>

          <div class="form-group">
            <label>Nome do Produto *</label>
            <input v-model="formData.nome" type="text" placeholder="Ex: Espetinho de Carne" required />
          </div>
          <div class="form-group">
            <label>Categoria *</label>
            <select v-model="formData.categoria" required>
              <option value="">Selecione</option>
              <option value="espetinho">Espetinho</option>
              <option value="bebida">Bebida</option>
              <option value="acompanhamento">Acompanhamento</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Preço (R$) *</label>
              <input v-model.number="formData.preco" type="number" step="0.01" min="0" required />
            </div>
            <div class="form-group">
              <label>Estoque Atual *</label>
              <input v-model.number="formData.estoque_atual" type="number" min="0" required />
            </div>
            <div class="form-group">
              <label>Estoque Mínimo *</label>
              <input v-model.number="formData.estoque_minimo" type="number" min="0" required />
            </div>
          </div>
          <div class="form-group">
            <label><input v-model="formData.ativo" type="checkbox" /> Produto Ativo</label>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn-submit" :disabled="submitting || uploading">{{ submitting ? 'Salvando...' : uploading ? 'Enviando...' : 'Salvar' }}</button>
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
import { Plus, Package, ArrowLeft, ChevronLeft, ChevronRight, Upload, X } from 'lucide-vue-next'

const router = useRouter()
const userStore = useUserStore()
const products = ref([])
const loading = ref(false)
const error = ref('')
const showModal = ref(false)
const submitting = ref(false)
const formError = ref('')
const editingProduct = ref(null)
const fileInput = ref(null)
const imagePreview = ref('')
const selectedImageFile = ref(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadError = ref('')
const showImageEditor = ref(false)
const originalImage = ref(null)
const editorImage = ref(null)
const cropData = ref({ zoom: 1, rotation: 0 })
const currentPage = ref(1)
const itemsPerPage = 10
const searchQuery = ref('')
const formData = ref({ nome: '', categoria: '', preco: 0, estoque_atual: 0, estoque_minimo: 10, ativo: true, imagem_url: '' })

// Filtrar produtos pela busca
const filteredProducts = computed(() => {
  if (!searchQuery.value.trim()) {
    return products.value
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  return products.value.filter(product => {
    return (
      product.nome.toLowerCase().includes(query) ||
      product.categoria.toLowerCase().includes(query) ||
      getCategoryLabel(product.categoria).toLowerCase().includes(query)
    )
  })
})

// Produtos paginados (baseado nos filtrados)
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredProducts.value.slice(start, start + itemsPerPage)
})

// Total de páginas (baseado nos filtrados)
const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage))

onMounted(async () => {
  if (!userStore.isAdmin && userStore.profile?.role !== 'gerente') {
    error.value = 'Acesso negado'
    return
  }
  await fetchProducts()
})

async function fetchProducts() {
  loading.value = true
  error.value = ''
  try {
    const { data, error: fetchError } = await supabase.from(TABLES.PRODUTOS).select('*').order('categoria').order('nome')
    if (fetchError) throw fetchError
    products.value = data || []
    currentPage.value = 1
  } catch (err) {
    error.value = 'Erro ao carregar produtos'
  } finally {
    loading.value = false
  }
}

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

function openCreateModal() {
  editingProduct.value = null
  formData.value = { nome: '', categoria: '', preco: 0, estoque_atual: 0, estoque_minimo: 10, ativo: true, imagem_url: '' }
  imagePreview.value = ''
  selectedImageFile.value = null
  uploadError.value = ''
  showImageEditor.value = false
  showModal.value = true
}

function openEditModal(product) {
  editingProduct.value = product
  formData.value = { ...product }
  imagePreview.value = ''
  selectedImageFile.value = null
  uploadError.value = ''
  showImageEditor.value = false
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingProduct.value = null
  imagePreview.value = ''
  selectedImageFile.value = null
  uploadError.value = ''
  formError.value = ''
  showImageEditor.value = false
}

function triggerFileInput() {
  fileInput.value?.click()
}

function handleImageUpload(event) {
  const file = event.target.files[0]
  uploadError.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    uploadError.value = 'Selecione uma imagem válida'
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    uploadError.value = 'Imagem deve ter no máximo 5MB'
    return
  }
  selectedImageFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    originalImage.value = e.target.result
    imagePreview.value = e.target.result
    cropData.value = { zoom: 1, rotation: 0 }
    showImageEditor.value = true
  }
  reader.readAsDataURL(file)
}

function removeImage() {
  imagePreview.value = ''
  selectedImageFile.value = null
  formData.value.imagem_url = ''
  uploadError.value = ''
  showImageEditor.value = false
  originalImage.value = null
  cropData.value = { zoom: 1, rotation: 0 }
  if (fileInput.value) fileInput.value.value = ''
}

function applyImageCrop() {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = new Image()
  img.onload = () => {
    const size = 800
    canvas.width = size
    canvas.height = size
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, size, size)
    ctx.save()
    ctx.translate(size / 2, size / 2)
    ctx.rotate((cropData.value.rotation * Math.PI) / 180)
    const scale = cropData.value.zoom
    const drawWidth = img.width * scale
    const drawHeight = img.height * scale
    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
    ctx.restore()
    canvas.toBlob((blob) => {
      if (blob) {
        const processedFile = new File([blob], selectedImageFile.value.name, { type: 'image/jpeg', lastModified: Date.now() })
        selectedImageFile.value = processedFile
        imagePreview.value = canvas.toDataURL('image/jpeg', 0.9)
        showImageEditor.value = false
      }
    }, 'image/jpeg', 0.9)
  }
  img.src = originalImage.value
}

function cancelImageEdit() {
  showImageEditor.value = false
  cropData.value = { zoom: 1, rotation: 0 }
}

function updateZoom(event) {
  cropData.value.zoom = parseFloat(event.target.value)
}

function rotateImage() {
  cropData.value.rotation = (cropData.value.rotation + 90) % 360
}

async function uploadImageToSupabase(file) {
  try {
    uploading.value = true
    uploadProgress.value = 0
    uploadError.value = ''
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `produtos/${fileName}`
    const { error: storageError } = await supabase.storage.from('imagens-produtos').upload(filePath, file, { cacheControl: '3600', upsert: false })
    if (storageError) throw storageError
    const { data: { publicUrl } } = supabase.storage.from('imagens-produtos').getPublicUrl(filePath)
    uploadProgress.value = 100
    return publicUrl
  } catch (err) {
    uploadError.value = 'Erro ao fazer upload'
    throw err
  } finally {
    uploading.value = false
  }
}

async function saveProduct() {
  submitting.value = true
  formError.value = ''
  try {
    if (selectedImageFile.value) {
      const imageUrl = await uploadImageToSupabase(selectedImageFile.value)
      formData.value.imagem_url = imageUrl
    }
    const productData = { nome: formData.value.nome, categoria: formData.value.categoria, preco: formData.value.preco, estoque_atual: formData.value.estoque_atual, estoque_minimo: formData.value.estoque_minimo, ativo: formData.value.ativo, imagem_url: formData.value.imagem_url }
    if (editingProduct.value) {
      const { error: updateError } = await supabase.from(TABLES.PRODUTOS).update(productData).eq('id', editingProduct.value.id)
      if (updateError) throw updateError
      await userStore.logAction('update', `Produto atualizado: ${productData.nome}`)
    } else {
      const { error: insertError } = await supabase.from(TABLES.PRODUTOS).insert([productData])
      if (insertError) throw insertError
      await userStore.logAction('create', `Produto criado: ${productData.nome}`)
    }
    await fetchProducts()
    closeModal()
  } catch (err) {
    formError.value = 'Erro ao salvar: ' + err.message
  } finally {
    submitting.value = false
  }
}

async function deleteProduct(id) {
  if (!confirm('Deletar este produto?')) return
  try {
    const product = products.value.find(p => p.id === id)
    if (product?.imagem_url) {
      try {
        const urlParts = product.imagem_url.split('/')
        const filePath = urlParts.slice(-2).join('/')
        await supabase.storage.from('imagens-produtos').remove([filePath])
      } catch (err) {
        console.warn('Erro ao deletar imagem')
      }
    }
    const { error: deleteError } = await supabase.from(TABLES.PRODUTOS).delete().eq('id', id)
    if (deleteError) throw deleteError
    await userStore.logAction('delete', `Produto deletado: ${product.nome}`)
    await fetchProducts()
  } catch (err) {
    alert('Erro ao deletar')
  }
}

function formatPrice(value) {
  return parseFloat(value || 0).toFixed(2).replace('.', ',')
}

function getCategoryLabel(category) {
  const labels = { espetinho: 'Espetinho', bebida: 'Bebida', acompanhamento: 'Acompanhamento' }
  return labels[category] || category
}

function getCategoryEmoji(category) {
  const emojis = { espetinho: '🍢', bebida: '🥤', acompanhamento: '🍟' }
  return emojis[category] || '📦'
}
</script>

<style scoped>
.products-container{padding:2rem;max-width:1400px;margin:0 auto}
.page-header{display:flex;align-items:center;gap:1rem;margin-bottom:2rem}
.btn-back{display:flex;align-items:center;gap:.5rem;padding:.75rem 1.5rem;background:#fff;border:2px solid #e5e7eb;border-radius:12px;font-weight:600;color:#374151;cursor:pointer;transition:all .2s}
.btn-back:hover{background:#f9fafb;border-color:#C41E3A;color:#C41E3A}
.section-title{display:flex;align-items:center;gap:.75rem;font-size:2rem;font-weight:800;color:#1a202c;margin:0}
.quick-actions{display:flex;gap:1rem;margin-bottom:2rem}
.action-btn{display:flex;align-items:center;gap:1rem;padding:1.25rem 1.5rem;background:linear-gradient(135deg,#C41E3A,#8B1429);color:#fff;border:none;border-radius:12px;font-weight:600;cursor:pointer;transition:all .3s;box-shadow:0 4px 12px rgba(196,30,58,.2)}
.action-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(196,30,58,.3)}
.action-label{font-size:1.125rem;font-weight:700}
.action-description{font-size:.875rem;opacity:.9}

/* ESTILOS DA BARRA DE PESQUISA */
.search-bar{background:#fff;border-radius:12px;padding:1.5rem;margin-bottom:2rem;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.search-input-wrapper{position:relative;display:flex;align-items:center;margin-bottom:0.75rem}
.search-icon{position:absolute;left:1rem;color:#9ca3af;pointer-events:none}
.search-input{width:100%;padding:0.875rem 1rem 0.875rem 3rem;border:2px solid #e5e7eb;border-radius:10px;font-size:1rem;transition:all .2s;background:#f9fafb}
.search-input:focus{outline:none;border-color:#C41E3A;background:#fff;box-shadow:0 0 0 3px rgba(196,30,58,.1)}
.search-clear{position:absolute;right:1rem;background:#f3f4f6;border:none;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#6b7280;transition:all .2s;font-size:14px}
.search-clear:hover{background:#e5e7eb;color:#374151}
.search-info{font-size:0.875rem;color:#6b7280;font-weight:600;padding-left:0.5rem}

.products-table{background:#fff;border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,.08);overflow:hidden}
table{width:100%;border-collapse:collapse}
thead{background:#f9fafb}
th{padding:1rem;text-align:left;font-weight:700;color:#374151;border-bottom:2px solid #e5e7eb}
td{padding:1rem;border-bottom:1px solid #f3f4f6}
.product-image-cell{display:flex;align-items:center;justify-content:center}
.product-thumbnail{width:60px;height:60px;object-fit:cover;border-radius:8px;border:2px solid #e5e7eb}
.product-no-image{width:60px;height:60px;display:flex;align-items:center;justify-content:center;background:#f3f4f6;border-radius:8px;font-size:2rem}
.category-badge{display:inline-block;padding:.375rem .75rem;background:#e0e7ff;color:#3730a3;border-radius:50px;font-size:.875rem;font-weight:600}
.stock-display{font-weight:700}
.stock-display.ok{color:#10b981}
.stock-display.low{color:#f59e0b}
.status-badge{display:inline-block;padding:.375rem .75rem;border-radius:50px;font-size:.875rem;font-weight:600}
.status-badge.active{background:#d1fae5;color:#065f46}
.status-badge.inactive{background:#fee2e2;color:#991b1b}
.actions{display:flex;gap:.5rem}
.btn-edit,.btn-delete{padding:.5rem;background:none;border:none;cursor:pointer;font-size:1.25rem;transition:transform .2s}
.btn-edit:hover,.btn-delete:hover{transform:scale(1.2)}
.pagination{display:flex;justify-content:space-between;align-items:center;padding:1.5rem;border-top:2px solid #f3f4f6}
.pagination-btn{display:flex;align-items:center;gap:.5rem;padding:.75rem 1.25rem;background:#fff;border:2px solid #e5e7eb;border-radius:8px;font-weight:600;color:#374151;cursor:pointer;transition:all .2s}
.pagination-btn:hover:not(:disabled){border-color:#C41E3A;color:#C41E3A;transform:translateY(-2px)}
.pagination-btn:disabled{opacity:.5;cursor:not-allowed}
.pagination-info{font-weight:600;color:#374151}
.items-info{color:#9ca3af;font-size:.875rem}
.modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}
.modal-content{background:#fff;border-radius:16px;width:100%;max-width:600px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)}
.modal-header{display:flex;justify-content:space-between;align-items:center;padding:1.5rem;border-bottom:2px solid #f3f4f6}
.modal-header h2{font-size:1.5rem;font-weight:800;color:#1a202c;margin:0}
.modal-close{background:none;border:none;font-size:1.5rem;cursor:pointer;color:#9ca3af;padding:.5rem;transition:color .2s}
.modal-close:hover{color:#374151}
.modal-form{padding:1.5rem}
.image-upload-section{margin-bottom:1.5rem}
.image-preview-container{position:relative;width:100%;max-width:300px;margin:0 auto}
.image-preview{width:100%;height:250px;object-fit:cover;border-radius:12px;border:3px solid #e5e7eb}
.image-actions{display:flex;gap:.5rem;justify-content:center;margin-top:.75rem}
.btn-edit-image{padding:.5rem 1rem;background:#3b82f6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;transition:all .2s;display:flex;align-items:center;gap:.5rem}
.btn-edit-image:hover{background:#2563eb;transform:translateY(-2px)}
.btn-remove-image{padding:.5rem 1rem;background:#ef4444;color:#fff;border:none;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:.5rem;transition:all .2s}
.btn-remove-image:hover{background:#dc2626;transform:translateY(-2px)}
.image-editor{background:#f9fafb;border-radius:12px;padding:1.5rem;border:2px solid #e5e7eb}
.editor-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem}
.editor-header h3{font-size:1.125rem;font-weight:700;color:#374151;margin:0}
.btn-cancel-edit{padding:.5rem 1rem;background:#fff;border:2px solid #e5e7eb;border-radius:8px;cursor:pointer;font-weight:600;color:#374151;transition:all .2s}
.btn-cancel-edit:hover{border-color:#9ca3af;background:#f9fafb}
.editor-preview{margin-bottom:1.5rem}
.crop-container{width:100%;height:300px;background:#fff;border-radius:8px;border:2px solid #e5e7eb;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative}
.crop-container img{max-width:100%;max-height:100%;transition:transform .3s ease}
.editor-controls{display:flex;flex-direction:column;gap:1rem}
.control-group{display:flex;flex-direction:column;gap:.5rem}
.control-group label{font-size:.875rem;font-weight:600;color:#374151}
.zoom-slider{width:100%;height:6px;border-radius:3px;background:#e5e7eb;outline:none;-webkit-appearance:none}
.zoom-slider::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#C41E3A;cursor:pointer;transition:all .2s}
.zoom-slider::-webkit-slider-thumb:hover{transform:scale(1.2);box-shadow:0 0 0 4px rgba(196,30,58,.2)}
.zoom-slider::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:#C41E3A;cursor:pointer;border:none;transition:all .2s}
.btn-rotate{width:100%;padding:.75rem;background:#fff;border:2px solid #e5e7eb;border-radius:8px;font-weight:600;color:#374151;cursor:pointer;transition:all .2s}
.btn-rotate:hover{border-color:#C41E3A;color:#C41E3A;background:#fef2f2}
.btn-apply-crop{width:100%;padding:1rem;background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:1rem;cursor:pointer;transition:all .2s;box-shadow:0 4px 12px rgba(16,185,129,.2)}
.btn-apply-crop:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(16,185,129,.3)}
.upload-area{border:3px dashed #d1d5db;border-radius:12px;padding:3rem;text-align:center;cursor:pointer;transition:all .2s;background:#f9fafb}
.upload-area:hover{border-color:#C41E3A;background:#fff}
.file-input-hidden{display:none}
.upload-content{display:flex;flex-direction:column;align-items:center;gap:.75rem}
.upload-icon{color:#9ca3af}
.upload-text{font-weight:600;color:#374151;margin:0}
.upload-hint{font-size:.875rem;color:#9ca3af;margin:0}
.upload-error{color:#ef4444;font-size:.875rem;margin-top:.5rem}
.upload-progress{color:#10b981;font-weight:600;margin-top:.5rem}
.form-group{margin-bottom:1.5rem}
.form-label{display:block;font-weight:600;color:#374151;margin-bottom:.5rem}
.form-group label{display:block;font-weight:600;color:#374151;margin-bottom:.5rem}
.form-group input,.form-group select{width:100%;padding:.75rem;border:2px solid #e5e7eb;border-radius:8px;font-size:1rem;transition:border-color .2s}
.form-group input:focus,.form-group select:focus{outline:none;border-color:#C41E3A}
.form-row{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
.form-actions{display:flex;justify-content:flex-end;gap:1rem;margin-top:2rem}
.btn-cancel{padding:.75rem 1.5rem;background:#fff;border:2px solid #e5e7eb;border-radius:8px;font-weight:600;color:#374151;cursor:pointer;transition:all .2s}
.btn-cancel:hover{background:#f9fafb;border-color:#9ca3af}
.btn-submit{padding:.75rem 1.5rem;background:linear-gradient(135deg,#C41E3A,#8B1429);color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;transition:all .3s}
.btn-submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 4px 12px rgba(196,30,58,.3)}
.btn-submit:disabled{opacity:.6;cursor:not-allowed}
.form-error{color:#ef4444;margin-top:1rem;text-align:center}
.loading,.error-message,.empty-state{text-align:center;padding:4rem 2rem;color:#9ca3af}
@media (max-width:768px){
.products-container{padding:1rem}
.form-row{grid-template-columns:1fr}
table{font-size:.875rem}
th,td{padding:.75rem .5rem}
.product-thumbnail,.product-no-image{width:50px;height:50px}
.search-input{font-size:0.9rem;padding:0.75rem 1rem 0.75rem 2.75rem}
.pagination{flex-direction:column;gap:1rem}
.pagination-btn{width:100%;justify-content:center}
}
</style>
