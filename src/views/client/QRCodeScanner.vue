<template>
  <div class="qr-scanner-container">
    <!-- Header -->
    <div class="scanner-header">
      <button v-if="showBackButton" @click="goBack" class="btn-back">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1>Escanear QR Code da Mesa</h1>
    </div>

    <!-- Scanner Area -->
    <div class="scanner-wrapper">
      <div v-if="!scanning && !error" class="scanner-placeholder">
        <div class="placeholder-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M3 9h18M9 3v18"/>
          </svg>
        </div>
        <p>Aponte a câmera para o QR Code da mesa</p>
        <button @click="startScanning" class="btn-start">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          Iniciar Scanner
        </button>
      </div>

      <!-- Video Element -->
      <div v-show="scanning" class="video-container">
        <video ref="videoElement" class="scanner-video" autoplay playsinline></video>
        <div class="scanner-overlay">
          <div class="scanner-frame"></div>
          <p class="scanner-hint">Posicione o QR Code dentro do quadrado</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="error" class="error-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3>Erro ao acessar câmera</h3>
        <p>{{ error }}</p>
        <button @click="startScanning" class="btn-retry">Tentar Novamente</button>
      </div>

      <!-- Success State -->
      <div v-if="scanned && !error" class="success-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <h3>QR Code Detectado!</h3>
        <p>Redirecionando para o cardápio...</p>
      </div>
    </div>

    <!-- Instructions -->
    <div class="scanner-instructions">
      <h3>Como usar:</h3>
      <ol>
        <li>Permita o acesso à câmera quando solicitado</li>
        <li>Aponte a câmera para o QR Code da mesa</li>
        <li>Aguarde o reconhecimento automático</li>
        <li>Você será redirecionado para fazer seu pedido</li>
      </ol>
    </div>

    <!-- Manual Input -->
    <div class="manual-input">
      <p>Não consegue escanear?</p>
      <div class="input-group">
        <input 
          v-model="manualTableNumber" 
          type="number" 
          placeholder="Digite o número da mesa"
          @keyup.enter="submitManualTable"
        >
        <button @click="submitManualTable" class="btn-submit">
          Ir para Mesa
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { BrowserQRCodeReader } from '@zxing/browser'
import { useTablesStore } from '@/stores/tables'

const router = useRouter()
const tablesStore = useTablesStore()

const videoElement = ref(null)
const scanning = ref(false)
const scanned = ref(false)
const error = ref(null)
const manualTableNumber = ref('')
const showBackButton = ref(true)

let codeReader = null
let stream = null

const startScanning = async () => {
  error.value = null
  scanning.value = true
  
  try {
    // Solicitar permissão de câmera
    const constraints = {
      video: {
        facingMode: 'environment', // Câmera traseira em celulares
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    }
    
    stream = await navigator.mediaDevices.getUserMedia(constraints)
    
    if (videoElement.value) {
      videoElement.value.srcObject = stream
      
      // Inicializar leitor de QR Code
      codeReader = new BrowserQRCodeReader()
      
      // Começar a decodificar
      codeReader.decodeFromVideoDevice(
        undefined, // usa câmera padrão
        videoElement.value,
        (result, err) => {
          if (result) {
            handleQRCodeDetected(result.text)
          }
          
          if (err && err.name !== 'NotFoundException') {
            console.error('Erro ao decodificar:', err)
          }
        }
      )
    }
  } catch (err) {
    console.error('Erro ao acessar câmera:', err)
    
    if (err.name === 'NotAllowedError') {
      error.value = 'Permissão de câmera negada. Por favor, permita o acesso à câmera.'
    } else if (err.name === 'NotFoundError') {
      error.value = 'Nenhuma câmera encontrada no dispositivo.'
    } else {
      error.value = 'Erro ao acessar a câmera. Tente novamente.'
    }
    
    scanning.value = false
  }
}

const stopScanning = () => {
  scanning.value = false
  
  // Parar todas as tracks da stream
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
    stream = null
  }
  
  // Resetar leitor
  if (codeReader) {
    codeReader.reset()
    codeReader = null
  }
  
  console.log('🛑 Scanner parado')
}

const handleQRCodeDetected = async (qrData) => {
  console.log('📱 QR Code detectado:', qrData)
  
  scanned.value = true
  stopScanning()
  
  try {
    // Extrair informações do QR Code
    // Formato esperado: mesa-{tableId} ou mesa-numero-{tableNumber}
    let tableId = null
    let tableNumber = null
    
    if (qrData.includes('mesa-')) {
      const parts = qrData.split('-')
      if (parts.length === 2) {
        // Formato: mesa-{id}
        tableId = parts[1]
      } else if (parts.length === 3 && parts[1] === 'numero') {
        // Formato: mesa-numero-{number}
        tableNumber = parseInt(parts[2])
      }
    } else {
      // Tentar parsear como URL
      try {
        const url = new URL(qrData)
        const params = new URLSearchParams(url.search)
        tableId = params.get('mesa') || params.get('tableId')
        tableNumber = params.get('numero') || params.get('tableNumber')
      } catch {
        // Se não for URL, tenta usar o valor direto
        tableNumber = parseInt(qrData)
      }
    }
    
    // Buscar mesa no store
    let table = null
    
    if (tableId) {
      table = tablesStore.getTableById(tableId)
    } else if (tableNumber) {
      table = tablesStore.getTableByNumber(tableNumber)
    }
    
    if (table) {
      console.log('✅ Mesa encontrada:', table)
      
      // Verificar se mesa está disponível ou ocupada
      if (table.status === 'available' || table.status === 'occupied') {
        // Redirecionar para o cardápio da mesa
        setTimeout(() => {
          router.push({
            name: 'client-menu',
            params: { tableId: table.id },
            query: { tableNumber: table.numero }
          })
        }, 1000)
      } else {
        alert('Mesa não disponível no momento.')
        scanned.value = false
        startScanning()
      }
    } else {
      alert('Mesa não encontrada. Verifique o QR Code.')
      scanned.value = false
      startScanning()
    }
  } catch (err) {
    console.error('Erro ao processar QR Code:', err)
    alert('Erro ao processar QR Code. Tente novamente.')
    scanned.value = false
    startScanning()
  }
}

const submitManualTable = async () => {
  if (!manualTableNumber.value) {
    alert('Por favor, digite o número da mesa')
    return
  }
  
  const tableNumber = parseInt(manualTableNumber.value)
  const table = tablesStore.getTableByNumber(tableNumber)
  
  if (table) {
    console.log('✅ Mesa encontrada manualmente:', table)
    
    if (table.status === 'available' || table.status === 'occupied') {
      router.push({
        name: 'client-menu',
        params: { tableId: table.id },
        query: { tableNumber: table.numero }
      })
    } else {
      alert('Mesa não disponível no momento.')
    }
  } else {
    alert('Mesa não encontrada. Verifique o número.')
  }
}

const goBack = () => {
  stopScanning()
  router.back()
}

onMounted(async () => {
  // Carregar mesas se ainda não foram carregadas
  if (tablesStore.tables.length === 0) {
    await tablesStore.fetchTables()
  }
})

onUnmounted(() => {
  stopScanning()
})
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.qr-scanner-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  display: flex;
  flex-direction: column;
}

.scanner-header {
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  color: white;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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

.btn-back:hover {
  background: rgba(255, 255, 255, 0.3);
}

.scanner-header h1 {
  margin: 0;
  font-size: 1.25rem;
}

.scanner-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  position: relative;
}

.scanner-placeholder {
  text-align: center;
  max-width: 400px;
}

.placeholder-icon {
  color: #C41E3A;
  margin-bottom: 1.5rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.95); }
}

.scanner-placeholder p {
  color: #6b7280;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.btn-start {
  background: #C41E3A;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
}

.btn-start:hover {
  background: #a51830;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(196, 30, 58, 0.4);
}

.video-container {
  position: relative;
  width: 100%;
  max-width: 500px;
  aspect-ratio: 1;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.scanner-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
}

.scanner-frame {
  width: 250px;
  height: 250px;
  border: 3px solid #10b981;
  border-radius: 16px;
  position: relative;
  animation: scanPulse 2s ease-in-out infinite;
}

@keyframes scanPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  50% { box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); }
}

.scanner-frame::before,
.scanner-frame::after {
  content: '';
  position: absolute;
  width: 40px;
  height: 40px;
  border: 4px solid #10b981;
}

.scanner-frame::before {
  top: -4px;
  left: -4px;
  border-right: none;
  border-bottom: none;
  border-radius: 16px 0 0 0;
}

.scanner-frame::after {
  bottom: -4px;
  right: -4px;
  border-left: none;
  border-top: none;
  border-radius: 0 0 16px 0;
}

.scanner-hint {
  color: white;
  margin-top: 2rem;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.error-state,
.success-state {
  text-align: center;
  padding: 2rem;
  max-width: 400px;
}

.error-state svg {
  color: #ef4444;
  margin-bottom: 1rem;
}

.success-state svg {
  color: #10b981;
  margin-bottom: 1rem;
  animation: checkmark 0.5s ease-in-out;
}

@keyframes checkmark {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

.error-state h3,
.success-state h3 {
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.error-state p,
.success-state p {
  color: #6b7280;
  margin: 0 0 1.5rem 0;
}

.btn-retry {
  background: #C41E3A;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-retry:hover {
  background: #a51830;
}

.scanner-instructions {
  background: white;
  padding: 2rem;
  margin: 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.scanner-instructions h3 {
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.scanner-instructions ol {
  color: #6b7280;
  padding-left: 1.5rem;
  margin: 0;
}

.scanner-instructions li {
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.manual-input {
  background: white;
  padding: 2rem;
  margin: 0 2rem 2rem 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.manual-input p {
  color: #6b7280;
  margin: 0 0 1rem 0;
  font-weight: 600;
}

.input-group {
  display: flex;
  gap: 0.75rem;
}

.input-group input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.input-group input:focus {
  outline: none;
  border-color: #C41E3A;
}

.btn-submit {
  background: #C41E3A;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.btn-submit:hover {
  background: #a51830;
}

@media (max-width: 768px) {
  .scanner-wrapper {
    padding: 1rem;
  }
  
  .scanner-instructions,
  .manual-input {
    margin: 1rem;
  }
  
  .video-container {
    max-width: 100%;
  }
}
</style>