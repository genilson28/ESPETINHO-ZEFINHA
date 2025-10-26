// services/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// ✅ CORRIGIDO: Nomes das tabelas com prefixo pwa_
export const TABLES = {
  USUARIOS: 'pwa_usuarios',
  USUARIOS_LOGS: 'pwa_usuarios_logs',
  PERMISSOES: 'pwa_permissoes',
  MESAS: 'pwa_mesas',
  CATEGORIAS: 'pwa_categorias',
  PRODUTOS: 'pwa_produtos',
  PEDIDOS: 'pwa_pedidos',
  PEDIDOS_ITENS: 'pwa_pedidos_itens',
  CAIXA: 'pwa_caixa',
  FINANCEIRO: 'pwa_financeiro',
  ATIVIDADES: 'pwa_atividades'
}

// ✅ NOVO: API de Produtos
export const productsAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from(TABLES.PRODUTOS)
      .select('*')
      .order('nome', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLES.PRODUTOS)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async getByCategory(categoryId) {
    const { data, error } = await supabase
      .from(TABLES.PRODUTOS)
      .select('*')
      .eq('categoria_id', categoryId)
      .order('nome', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async getAvailable() {
    const { data, error } = await supabase
      .from(TABLES.PRODUTOS)
      .select('*')
      .gt('estoque_atual', 0)
      .eq('ativo', true)
      .order('nome', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async updateStock(productId, newStock) {
    const { data, error } = await supabase
      .from(TABLES.PRODUTOS)
      .update({ estoque_atual: newStock })
      .eq('id', productId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async create(productData) {
    const { data, error } = await supabase
      .from(TABLES.PRODUTOS)
      .insert(productData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(productId, productData) {
    const { data, error } = await supabase
      .from(TABLES.PRODUTOS)
      .update(productData)
      .eq('id', productId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(productId) {
    const { error } = await supabase
      .from(TABLES.PRODUTOS)
      .delete()
      .eq('id', productId)
    
    if (error) throw error
  }
}

// ✅ NOVO: API de Categorias
export const categoriesAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from(TABLES.CATEGORIAS)
      .select('*')
      .order('nome', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLES.CATEGORIAS)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(categoryData) {
    const { data, error } = await supabase
      .from(TABLES.CATEGORIAS)
      .insert(categoryData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(categoryId, categoryData) {
    const { data, error } = await supabase
      .from(TABLES.CATEGORIAS)
      .update(categoryData)
      .eq('id', categoryId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(categoryId) {
    const { error } = await supabase
      .from(TABLES.CATEGORIAS)
      .delete()
      .eq('id', categoryId)
    
    if (error) throw error
  }
}

// ✅ NOVO: API de Pedidos
export const ordersAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from(TABLES.PEDIDOS)
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLES.PEDIDOS)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async getByTable(tableId) {
    const { data, error } = await supabase
      .from(TABLES.PEDIDOS)
      .select('*')
      .eq('mesa_id', tableId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getActiveByTable(tableId) {
    const { data, error } = await supabase
      .from(TABLES.PEDIDOS)
      .select('*')
      .eq('mesa_id', tableId)
      .eq('status', 'active')
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async create(orderData) {
    const { data, error } = await supabase
      .from(TABLES.PEDIDOS)
      .insert(orderData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(orderId, orderData) {
    const { data, error } = await supabase
      .from(TABLES.PEDIDOS)
      .update(orderData)
      .eq('id', orderId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateStatus(orderId, status) {
    const { data, error } = await supabase
      .from(TABLES.PEDIDOS)
      .update({ status })
      .eq('id', orderId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(orderId) {
    const { error } = await supabase
      .from(TABLES.PEDIDOS)
      .delete()
      .eq('id', orderId)
    
    if (error) throw error
  }
}

// ✅ NOVO: API de Itens de Pedidos
export const orderItemsAPI = {
  async getByOrder(orderId) {
    const { data, error } = await supabase
      .from(TABLES.PEDIDOS_ITENS)
      .select('*')
      .eq('pedido_id', orderId)
    
    if (error) throw error
    return data || []
  },

  async create(itemData) {
    const { data, error } = await supabase
      .from(TABLES.PEDIDOS_ITENS)
      .insert(itemData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async createBatch(itemsData) {
    const { data, error } = await supabase
      .from(TABLES.PEDIDOS_ITENS)
      .insert(itemsData)
      .select()
    
    if (error) throw error
    return data
  },

  async update(itemId, itemData) {
    const { data, error } = await supabase
      .from(TABLES.PEDIDOS_ITENS)
      .update(itemData)
      .eq('id', itemId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(itemId) {
    const { error } = await supabase
      .from(TABLES.PEDIDOS_ITENS)
      .delete()
      .eq('id', itemId)
    
    if (error) throw error
  }
}

// ✅ Função para inscrever-se em mudanças em tempo real de múltiplas tabelas
export const subscribeToTables = (tables, callback) => {
  const channels = tables.map(table => {
    return supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: table },
        (payload) => {
          console.log(`🔄 Mudança detectada na tabela ${table}:`, payload)
          callback(payload)
        }
      )
      .subscribe()
  })

  // Retorna função para cancelar todas as inscrições
  return () => {
    channels.forEach(channel => {
      supabase.removeChannel(channel)
    })
  }
}

// ✅ Função para inscrever-se em uma única tabela
export const subscribeToTable = (tableName, callback) => {
  const channel = supabase
    .channel(`public:${tableName}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: tableName },
      (payload) => {
        console.log(`🔄 Mudança detectada na tabela ${tableName}:`, payload)
        callback(payload)
      }
    )
    .subscribe()

  // Retorna função para cancelar a inscrição
  return () => {
    supabase.removeChannel(channel)
  }
}

// ✅ Função para cancelar todas as inscrições ativas
export const unsubscribeAll = () => {
  supabase.removeAllChannels()
}

export default supabase