<template>
  <div class="qr-generator-container">
    <!-- Header -->
    <div class="generator-header">
      <button @click="goBack" class="btn-back">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1>QR Codes das Mesas</h1>
      <button @click="printAll" class="btn-print">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 6 2 18 2 18 9"/>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
          <rect x="6" y="14" width="12" height="8"/>
        </svg>
        <span>Imprimir</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando mesas...</p>
    </div>

    <!-- QR Codes Grid -->
    <div v-else class="qr-grid">
      <div 
        v-for="table in tablesStore.tables" 
        :key="table.id"
        class="qr-card"
        :class="{ 'print-only': printMode }"
      >
        <div class="card-header">
          <h2>Mesa {{ table.numero }}</h2>
          <button 
            @click="downloadQR(table)" 
            class="btn-download"
            title="Baixar QR Code"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        </div>

        <div class="qr-wrapper">
          <canvas 
            :ref="el => setQRRef(table.id, el)"
            :id="`qr-${table.id}`"
            class="qr-canvas"
          ></canvas>
        </div>

        <div class="card-footer">
          <p class="qr-instructions">
            Escaneie o QR Code para fazer seu pedido
          </p>
          <p class="qr-url">{{ getTableURL(table) }}</p>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && tablesStore.tables.length === 0" class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="8" width="18" height="12" rx="2" />
        <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
      </svg>
      <p>Nenhuma mesa cadastrada</p>
      <button @click="goToTables" class="btn-action">
        Cadastrar Mesas
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useTablesStore } from '@/stores/tables'
import QRCode from 'qrcode'

const router = useRouter()
const tablesStore = useTablesStore()

const loading = ref(true)
const printMode = ref(false)
const qrRefs = ref({})

// Função para setar refs dinamicamente
const setQRRef = (tableId, el) => {
  if (el) {
    qrRefs.value[tableId] = el
  }
}

const getTableURL = (table) => {
  // Usar URL base do ambiente ou window.location
  const baseURL = import.meta.env.VITE_APP_URL || window.location.origin
  return `${baseURL}/client-menu/${table.id}?tableNumber=${table.numero}`
}

const generateQRCode = async (table) => {
  const canvas = qrRefs.value[table.id]
  if (!canvas) {
    console.error('Canvas não encontrado para mesa', table.id)
    return
  }

  try {
    const url = getTableURL(table)
    
    await QRCode.toCanvas(canvas, url, {
      width: 240,
      margin: 2,
      color: {
        dark: '#1f2937',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
    
    console.log('✅ QR Code gerado para mesa', table.numero)
  } catch (error) {
    console.error('❌ Erro ao gerar QR Code:', error)
  }
}

const generateAllQRCodes = async () => {
  await nextTick() // Aguardar refs estarem disponíveis
  
  for (const table of tablesStore.tables) {
    await generateQRCode(table)
  }
}

const downloadQR = async (table) => {
  const canvas = qrRefs.value[table.id]
  if (!canvas) return

  try {
    // Converter canvas para blob
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `mesa-${table.numero}-qrcode.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log('✅ QR Code baixado para mesa', table.numero)
    })
  } catch (error) {
    console.error('❌ Erro ao baixar QR Code:', error)
    alert('Erro ao baixar QR Code. Tente novamente.')
  }
}

const printAll = () => {
  printMode.value = true
  
  // Aguardar próximo tick para aplicar estilos de impressão
  nextTick(() => {
    window.print()
    printMode.value = false
  })
}

const goBack = () => {
  router.back()
}

const goToTables = () => {
  router.push({ name: 'tables' })
}

onMounted(async () => {
  loading.value = true
  
  try {
    // Carregar mesas se ainda não foram carregadas
    if (tablesStore.tables.length === 0) {
      await tablesStore.fetchTables()
    }
    
    // Gerar QR Codes
    await generateAllQRCodes()
    
    console.log('✅ QR Codes gerados:', tablesStore.tables.length)
  } catch (error) {
    console.error('❌ Erro ao carregar mesas:', error)
    alert('Erro ao carregar mesas. Tente novamente.')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.qr-generator-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  padding-bottom: 2rem;
  overflow-x: hidden;
}

.generator-header {
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

.btn-back,
.btn-print {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 0.875rem;
  white-space: nowrap;
}

.btn-back {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
}

.btn-back:hover,
.btn-print:hover {
  background: rgba(255, 255, 255, 0.3);
}

.generator-header h1 {
  margin: 0;
  font-size: 1.5rem;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #C41E3A;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ✅ GRID RESPONSIVO - SEM SCROLL HORIZONTAL */
.qr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.qr-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;
}

.qr-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.card-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e5e7eb;
}

.card-header h2 {
  margin: 0;
  color: #1f2937;
  font-size: 1.5rem;
}

.btn-download {
  background: #C41E3A;
  color: white;
  border: none;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.btn-download:hover {
  background: #a51830;
  transform: scale(1.1);
}

/* ✅ QR WRAPPER RESPONSIVO */
.qr-wrapper {
  width: 100%;
  max-width: 240px;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.qr-canvas {
  max-width: 100%;
  max-height: 100%;
  height: auto;
  width: auto;
}

.card-footer {
  width: 100%;
  text-align: center;
}

.qr-instructions {
  margin: 0 0 0.5rem 0;
  color: #6b7280;
  font-weight: 600;
  font-size: 0.9rem;
}

.qr-url {
  margin: 0;
  color: #9ca3af;
  font-size: 0.7rem;
  word-break: break-all;
  line-height: 1.4;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #6b7280;
}

.empty-state svg {
  opacity: 0.5;
  margin-bottom: 1rem;
}

.empty-state p {
  margin: 0 0 1.5rem 0;
  font-size: 1.1rem;
}

.btn-action {
  background: #C41E3A;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-action:hover {
  background: #a51830;
  transform: translateY(-2px);
}

/* ✅ RESPONSIVO MOBILE */
@media (max-width: 768px) {
  .qr-grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
    padding: 1rem;
  }
  
  .generator-header {
    padding: 0.75rem;
  }
  
  .generator-header h1 {
    font-size: 1.125rem;
  }
  
  .btn-print span {
    display: none;
  }
  
  .btn-print {
    width: 44px;
    padding: 0.75rem;
  }
  
  .qr-card {
    padding: 1.25rem;
  }
  
  .card-header h2 {
    font-size: 1.25rem;
  }
}

@media (max-width: 480px) {
  .generator-header h1 {
    font-size: 1rem;
  }
  
  .qr-card {
    padding: 1rem;
  }
  
  .qr-wrapper {
    max-width: 200px;
  }
}

/* ✅ IMPRESSÃO */
@media print {
  .qr-generator-container {
    background: white;
    padding: 0;
  }
  
  .generator-header,
  .btn-download,
  .btn-print {
    display: none !important;
  }
  
  .qr-grid {
    display: block;
    padding: 0;
  }
  
  .qr-card {
    page-break-inside: avoid;
    page-break-after: always;
    margin: 0 0 2rem 0;
    padding: 2rem;
    box-shadow: none !important;
    border: 2px solid #e5e7eb;
  }
  
  .qr-card:last-child {
    page-break-after: auto;
    margin-bottom: 0;
  }
  
  .qr-wrapper {
    background: white;
    max-width: 300px;
  }
}
</style>