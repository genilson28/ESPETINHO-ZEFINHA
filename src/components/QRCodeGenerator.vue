<template>
  <div class="qr-generator-page">
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
        Imprimir Todos
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando mesas e gerando QR Codes...</p>
    </div>

    <!-- QR Codes Grid -->
    <div v-else-if="tablesStore.tables.length > 0" class="qr-grid">
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
            :id="`qr-canvas-${table.id}`"
            class="qr-canvas"
            width="300"
            height="300"
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
    <div v-else class="empty-state">
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
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTablesStore } from '@/stores/tables'
import QRCode from 'qrcode'

const router = useRouter()
const tablesStore = useTablesStore()

const loading = ref(true)
const printMode = ref(false)
const qrCodesGenerated = ref(false)

const getTableURL = (table) => {
  const baseURL = import.meta.env.VITE_APP_URL || window.location.origin
  return `${baseURL}/client-menu/${table.id}?tableNumber=${table.numero}`
}

const waitForCanvas = (canvasId, maxAttempts = 20) => {
  return new Promise((resolve, reject) => {
    let attempts = 0
    
    const checkCanvas = () => {
      const canvas = document.getElementById(canvasId)
      
      if (canvas) {
        console.log(`✅ Canvas encontrado: ${canvasId}`)
        resolve(canvas)
      } else if (attempts >= maxAttempts) {
        console.error(`❌ Canvas não encontrado após ${maxAttempts} tentativas: ${canvasId}`)
        reject(new Error(`Canvas ${canvasId} não encontrado`))
      } else {
        attempts++
        setTimeout(checkCanvas, 100)
      }
    }
    
    checkCanvas()
  })
}

const generateQRCode = async (table) => {
  try {
    const canvasId = `qr-canvas-${table.id}`
    console.log(`🔄 Buscando canvas para mesa ${table.numero} (ID: ${canvasId})`)
    
    const canvas = await waitForCanvas(canvasId)
    const url = getTableURL(table)
    
    await QRCode.toCanvas(canvas, url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1f2937',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
    
    console.log(`✅ QR Code gerado com sucesso para mesa ${table.numero}`)
    return true
  } catch (error) {
    console.error(`❌ Erro ao gerar QR Code para mesa ${table.numero}:`, error)
    return false
  }
}

const generateAllQRCodes = async () => {
  if (qrCodesGenerated.value) {
    console.log('⏭️ QR Codes já foram gerados')
    return
  }
  
  console.log('🚀 Iniciando geração de QR Codes...')
  console.log(`📊 Total de mesas: ${tablesStore.tables.length}`)
  
  // Aguarda o DOM estar completamente renderizado
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 300))
  
  let successCount = 0
  let failCount = 0
  
  for (const table of tablesStore.tables) {
    const success = await generateQRCode(table)
    if (success) {
      successCount++
    } else {
      failCount++
    }
    // Pequeno delay entre cada geração
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  qrCodesGenerated.value = true
  console.log(`✅ Geração concluída: ${successCount} sucesso, ${failCount} falhas`)
}

const downloadQR = async (table) => {
  const canvasId = `qr-canvas-${table.id}`
  const canvas = document.getElementById(canvasId)
  
  if (!canvas) {
    console.error('Canvas não encontrado para download')
    alert('Erro: QR Code não encontrado. Tente recarregar a página.')
    return
  }

  try {
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Erro ao gerar blob do canvas')
      }
      
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
  
  nextTick(() => {
    window.print()
    printMode.value = false
  })
}

const goBack = () => {
  router.push('/')
}

const goToTables = () => {
  router.push({ name: 'tables' })
}

// Watch para gerar QR codes quando as mesas mudarem
watch(() => tablesStore.tables.length, async (newLength) => {
  if (newLength > 0 && !loading.value && !qrCodesGenerated.value) {
    console.log('📢 Mesas carregadas, gerando QR Codes...')
    await generateAllQRCodes()
  }
})

onMounted(async () => {
  console.log('🎬 Componente montado')
  loading.value = true
  
  try {
    // Carrega as mesas
    console.log('📥 Carregando mesas...')
    if (tablesStore.tables.length === 0) {
      await tablesStore.fetchTables()
    }
    
    console.log(`📊 Mesas carregadas: ${tablesStore.tables.length}`)
    
    // Remove o loading para renderizar os canvas
    loading.value = false
    
    // Aguarda o próximo tick para garantir que os canvas foram renderizados
    await nextTick()
    
    // Delay adicional para garantir
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Gera os QR codes
    await generateAllQRCodes()
    
  } catch (error) {
    console.error('❌ Erro ao carregar mesas:', error)
    alert('Erro ao carregar mesas. Tente novamente.')
    loading.value = false
  }
})
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.qr-generator-page {
  min-height: 100vh;
  background: #f8fafc;
  width: 100%;
  padding-top: 80px;
}

.generator-header {
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  color: white;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: fixed;
  top: 0;
  left: 280px;
  right: 0;
  z-index: 1000;
  flex-wrap: wrap;
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
  min-width: 0;
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

.qr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
  max-width: 100%;
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
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e5e7eb;
  gap: 0.75rem;
}

.card-header h2 {
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.btn-download {
  background: #C41E3A;
  color: white;
  border: none;
  border-radius: 8px;
  width: 36px;
  height: 36px;
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

.qr-wrapper {
  width: 100%;
  max-width: 220px;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  border-radius: 12px;
  padding: 1rem;
  margin: 0 auto 1.25rem;
}

.qr-canvas {
  max-width: 100%;
  max-height: 100%;
  width: auto !important;
  height: auto !important;
  display: block;
}

.card-footer {
  width: 100%;
  text-align: center;
}

.qr-instructions {
  margin: 0 0 0.5rem 0;
  color: #6b7280;
  font-weight: 600;
  font-size: 0.875rem;
}

.qr-url {
  margin: 0;
  color: #9ca3af;
  font-size: 0.7rem;
  word-break: break-all;
  overflow-wrap: break-word;
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

@media (max-width: 768px) {
  .generator-header {
    left: 0;
  }

  .qr-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1.25rem;
    padding: 1.5rem;
  }
  
  .generator-header {
    padding: 1rem 1.5rem;
  }
  
  .generator-header h1 {
    font-size: 1.25rem;
  }
  
  .btn-print {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }
  
  .qr-card {
    padding: 1.25rem;
  }
  
  .qr-wrapper {
    max-width: 180px;
  }
}

@media (max-width: 480px) {
  .qr-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }
  
  .generator-header {
    padding: 0.75rem 1rem;
  }
  
  .generator-header h1 {
    font-size: 1.1rem;
  }
  
  .btn-print span {
    display: none;
  }
  
  .btn-print {
    width: 44px;
    padding: 0.75rem;
  }
  
  .qr-wrapper {
    max-width: 200px;
  }
}

@media print {
  .qr-generator-page {
    background: white;
    padding-top: 0;
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
