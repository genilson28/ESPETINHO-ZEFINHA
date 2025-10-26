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
      <button @click="printAll" class="btn-print" :disabled="!allQRsGenerated">
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
      <p>Carregando mesas e gerando QR Codes...</p>
      <p class="loading-progress" v-if="generatingQRs">{{ qrProgress }}</p>
    </div>

    <!-- QR Codes Grid - SÓ RENDERIZA DEPOIS DE GERAR -->
    <div v-else-if="allQRsGenerated && qrCodes.length > 0" class="qr-grid">
      <div 
        v-for="qrData in qrCodes" 
        :key="qrData.table.id"
        class="qr-card"
        :class="{ 'print-only': printMode }"
      >
        <div class="card-header">
          <h2>Mesa {{ qrData.table.numero }}</h2>
          <button 
            @click="downloadQR(qrData)" 
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
          <img 
            :src="qrData.dataUrl" 
            :alt="`QR Code Mesa ${qrData.table.numero}`"
            class="qr-image"
          />
        </div>

        <div class="card-footer">
          <p class="qr-instructions">
            Escaneie o QR Code para fazer seu pedido
          </p>
          <p class="qr-url">{{ qrData.url }}</p>
          <!-- DEBUG: Testar URL -->
          <a :href="qrData.url" target="_blank" class="debug-link">
            🔗 Testar URL
          </a>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && tablesStore.tables.length === 0" class="empty-state">
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTablesStore } from '@/stores/tables'
import QRCode from 'qrcode'

const router = useRouter()
const tablesStore = useTablesStore()

const loading = ref(true)
const generatingQRs = ref(false)
const allQRsGenerated = ref(false)
const printMode = ref(false)
const qrCodes = ref([])
const qrProgress = ref('')

const getTableURL = (table) => {
  let baseURL = import.meta.env.VITE_APP_URL || window.location.origin
  
  // Remove barra final se existir
  if (baseURL.endsWith('/')) {
    baseURL = baseURL.slice(0, -1)
  }
  
  // Usa o ID da mesa como parâmetro da rota
  return `${baseURL}/client-menu/${table.id}`
}

const generateQRCode = async (table) => {
  try {
    const url = getTableURL(table)
    
    // Gera o QR code como Data URL (não precisa de DOM/canvas)
    const dataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1f2937',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
    
    console.log(`✅ QR Code gerado para mesa ${table.numero}`)
    
    return {
      table,
      url,
      dataUrl
    }
  } catch (error) {
    console.error(`❌ Erro ao gerar QR Code para mesa ${table.numero}:`, error)
    return null
  }
}

const generateAllQRCodes = async () => {
  console.log('🚀 Iniciando geração de QR Codes...')
  console.log(`📊 Total de mesas: ${tablesStore.tables.length}`)
  
  generatingQRs.value = true
  const qrCodesData = []
  
  for (let i = 0; i < tablesStore.tables.length; i++) {
    const table = tablesStore.tables[i]
    qrProgress.value = `Gerando QR Code ${i + 1} de ${tablesStore.tables.length}...`
    
    const qrData = await generateQRCode(table)
    if (qrData) {
      qrCodesData.push(qrData)
    }
    
    // Pequeno delay para não travar a interface
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  
  qrCodes.value = qrCodesData
  generatingQRs.value = false
  allQRsGenerated.value = true
  
  console.log(`✅ Todos os ${qrCodesData.length} QR Codes foram gerados com sucesso!`)
}

const downloadQR = async (qrData) => {
  try {
    const link = document.createElement('a')
    link.href = qrData.dataUrl
    link.download = `mesa-${qrData.table.numero}-qrcode.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    console.log('✅ QR Code baixado para mesa', qrData.table.numero)
  } catch (error) {
    console.error('❌ Erro ao baixar QR Code:', error)
    alert('Erro ao baixar QR Code. Tente novamente.')
  }
}

const printAll = () => {
  if (!allQRsGenerated.value) {
    alert('Aguarde a geração de todos os QR Codes antes de imprimir.')
    return
  }
  
  printMode.value = true
  
  setTimeout(() => {
    window.print()
    printMode.value = false
  }, 100)
}

const goBack = () => {
  router.back()
}

const goToTables = () => {
  router.push({ name: 'tables' })
}

onMounted(async () => {
  console.log('🎬 Componente QR Generator montado')
  loading.value = true
  
  try {
    console.log('📥 Carregando mesas...')
    
    if (tablesStore.tables.length === 0) {
      await tablesStore.fetchTables()
    }
    
    console.log(`📊 Mesas carregadas: ${tablesStore.tables.length}`)
    
    // Gera TODOS os QR codes ANTES de remover o loading
    await generateAllQRCodes()
    
    // Só remove o loading depois que tudo está pronto
    loading.value = false
    
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

.btn-print:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-back:hover,
.btn-print:hover:not(:disabled) {
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

.loading-progress {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #C41E3A;
  font-weight: 600;
}

.qr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
  padding: 1rem;
  max-width: 100%;
  margin: 0 auto;
  width: 100%;
}

@media (min-width: 768px) {
  .qr-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    padding: 1.5rem;
    max-width: 1400px;
  }
}

@media (min-width: 1200px) {
  .qr-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.qr-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 100%;
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
  font-size: 1.125rem;
  font-weight: 700;
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

.qr-wrapper {
  width: 100%;
  max-width: 180px;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 8px;
  padding: 0.75rem;
  margin: 0.5rem auto;
}

.qr-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  display: block;
}

.card-footer {
  width: 100%;
  text-align: center;
}

.qr-instructions {
  margin: 0 0 0.25rem 0;
  color: #6b7280;
  font-weight: 600;
  font-size: 0.75rem;
}

.qr-url {
  margin: 0;
  color: #9ca3af;
  font-size: 0.625rem;
  word-break: break-all;
  line-height: 1.3;
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
  .qr-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.75rem;
    padding: 0.75rem;
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
    padding: 0.875rem;
  }
  
  .card-header h2 {
    font-size: 1rem;
  }
  
  .qr-wrapper {
    max-width: 150px;
  }
}

@media (max-width: 480px) {
  .qr-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .generator-header h1 {
    font-size: 0.95rem;
  }
  
  .qr-card {
    padding: 0.75rem;
  }
  
  .card-header {
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
  }
  
  .card-header h2 {
    font-size: 0.875rem;
  }
  
  .btn-download {
    width: 32px;
    height: 32px;
  }
  
  .btn-download svg {
    width: 16px;
    height: 16px;
  }
  
  .qr-wrapper {
    max-width: 120px;
    padding: 0.5rem;
    margin: 0.25rem auto;
  }
  
  .qr-instructions {
    font-size: 0.7rem;
  }
  
  .qr-url {
    font-size: 0.55rem;
  }
}

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
