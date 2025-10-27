<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Mesas</h1>
            <p class="text-sm text-gray-500 mt-1">
              Olá, {{ userName }} 👋
            </p>
          </div>
          
          <!-- Botão Sair -->
          <button
            @click="handleLogout"
            class="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Sair
          </button>
        </div>
      </div>
    </header>

    <!-- Filtros e Stats -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Total de Mesas</p>
              <p class="text-2xl font-bold text-gray-900">{{ totalMesas }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Mesas Ocupadas</p>
              <p class="text-2xl font-bold text-red-600">{{ mesasOcupadas }}</p>
            </div>
            <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Mesas Livres</p>
              <p class="text-2xl font-bold text-green-600">{{ mesasLivres }}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtro -->
      <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div class="flex items-center gap-4">
          <label class="text-sm font-medium text-gray-700">Filtrar:</label>
          <div class="flex gap-2">
            <button
              @click="filtro = 'todas'"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                filtro === 'todas' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              Todas ({{ totalMesas }})
            </button>
            <button
              @click="filtro = 'ocupadas'"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                filtro === 'ocupadas' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              Ocupadas ({{ mesasOcupadas }})
            </button>
            <button
              @click="filtro = 'livres'"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                filtro === 'livres' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              Livres ({{ mesasLivres }})
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Grid de Mesas -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <button
          v-for="mesa in mesasFiltradas"
          :key="mesa.id"
          @click="abrirMesa(mesa)"
          :class="[
            'relative p-6 rounded-xl shadow-md transition-all duration-200 transform hover:scale-105',
            mesa.status === 'ocupada'
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          ]"
        >
          <!-- Número da Mesa -->
          <div class="text-center">
            <svg class="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
            </svg>
            <p class="text-2xl font-bold">{{ mesa.numero }}</p>
            <p class="text-xs opacity-90 mt-1">
              {{ mesa.status === 'ocupada' ? 'Ocupada' : 'Livre' }}
            </p>
          </div>

          <!-- Badge de capacidade -->
          <div class="absolute top-2 right-2 bg-white bg-opacity-30 backdrop-blur-sm px-2 py-1 rounded-full">
            <p class="text-xs font-medium">{{ mesa.capacidade }} pessoas</p>
          </div>

          <!-- Indicador de pedidos ativos -->
          <div v-if="mesa.status === 'ocupada' && mesa.pedidos_ativos > 0" 
               class="absolute top-2 left-2 bg-white text-red-600 px-2 py-1 rounded-full">
            <p class="text-xs font-bold">{{ mesa.pedidos_ativos }} pedido(s)</p>
          </div>
        </button>
      </div>

      <!-- Mensagem se não houver mesas -->
      <div v-if="mesasFiltradas.length === 0 && !loading" 
           class="text-center py-12 bg-white rounded-lg border border-gray-200">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
        </svg>
        <p class="text-gray-500 text-lg">Nenhuma mesa encontrada</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { supabase } from '@/services/supabase'

// ✅ CONFIGURAÇÃO: Altere aqui o nome da sua tabela
const TABELA_MESAS = 'pwa_mesas' // ou 'mesas' se for a outra

const router = useRouter()
const userStore = useUserStore()

// State
const mesas = ref([])
const loading = ref(true)
const filtro = ref('todas')
let realtimeSubscription = null

// Computed
const userName = computed(() => userStore.profile?.nome || 'Garçom')

const totalMesas = computed(() => mesas.value.length)
const mesasOcupadas = computed(() => mesas.value.filter(m => m.status === 'ocupada').length)
const mesasLivres = computed(() => mesas.value.filter(m => m.status === 'livre').length)

const mesasFiltradas = computed(() => {
  if (filtro.value === 'ocupadas') {
    return mesas.value.filter(m => m.status === 'ocupada')
  }
  if (filtro.value === 'livres') {
    return mesas.value.filter(m => m.status === 'livre')
  }
  return mesas.value
})

// Methods
async function carregarMesas() {
  try {
    loading.value = true
    
    console.log('🔍 Buscando mesas da tabela:', TABELA_MESAS)
    
    const { data, error } = await supabase
      .from(TABELA_MESAS)
      .select('*')
      // Removido filtro .eq('ativo', true) pois a coluna não existe
      .order('numero', { ascending: true })
    
    console.log('📦 Resposta do Supabase:', { data, error, total: data?.length || 0 })

    if (error) throw error

    mesas.value = data || []
  } catch (error) {
    console.error('❌ Erro ao carregar mesas:', error)
  } finally {
    loading.value = false
  }
}

function setupRealtime() {
  console.log('🔄 Configurando realtime para tabela:', TABELA_MESAS)
  
  realtimeSubscription = supabase
    .channel('mesas_garcom')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABELA_MESAS
      },
      (payload) => {
        console.log('🔔 Mudança detectada:', payload)
        
        if (payload.eventType === 'INSERT') {
          mesas.value.push(payload.new)
        } else if (payload.eventType === 'UPDATE') {
          const index = mesas.value.findIndex(m => m.id === payload.new.id)
          if (index !== -1) {
            mesas.value[index] = payload.new
          }
        } else if (payload.eventType === 'DELETE') {
          mesas.value = mesas.value.filter(m => m.id !== payload.old.id)
        }
        
        // Ordenar por número
        mesas.value.sort((a, b) => a.numero - b.numero)
      }
    )
    .subscribe()
}

function abrirMesa(mesa) {
  console.log('🍽️ Abrindo mesa:', mesa.numero)
  
  // Vai para o PDV com o ID da mesa
  router.push({
    name: 'pdv',
    query: { mesa: mesa.id }
  })
}

async function handleLogout() {
  if (confirm('Deseja realmente sair?')) {
    try {
      await userStore.logout()
      router.push('/login')
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error)
    }
  }
}

// Lifecycle
onMounted(async () => {
  await carregarMesas()
  setupRealtime()
})

onUnmounted(() => {
  if (realtimeSubscription) {
    realtimeSubscription.unsubscribe()
  }
})
</script>

<style scoped>
/* Animações suaves */
button {
  transition: all 0.2s ease;
}

/* Efeito de pulso para mesas ocupadas */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.bg-red-500 {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
