// services/validation.js
/**
 * ============================================
 * SERVIÇO DE VALIDAÇÃO DE DADOS
 * ============================================
 * Valida integridade de dados antes de operações críticas
 * Previne erros de foreign key e inconsistências
 */

import { supabase, TABLES } from './supabase'

/**
 * Serviço centralizado de validações
 */
export const validationService = {
  /**
   * Valida se uma mesa existe no banco de dados
   * @param {number|string} mesaId - ID da mesa a validar
   * @returns {Promise<boolean>} - true se mesa existe
   * @throws {Error} - Se mesa não existir
   */
  async validateMesaExists(mesaId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.MESAS)
        .select('id, numero, status')
        .eq('id', parseInt(mesaId))
        .single()
      
      if (error || !data) {
        throw new Error(`Mesa ${mesaId} não encontrada no banco de dados`)
      }
      
      console.log(`✅ Mesa validada: #${data.numero} (ID: ${data.id})`)
      return true
    } catch (error) {
      console.error(`❌ Validação falhou para mesa ${mesaId}:`, error.message)
      throw error
    }
  },

  /**
   * Valida estrutura dos dados do carrinho
   * @param {Object} cartData - Dados do carrinho
   * @returns {boolean} - true se dados são válidos
   * @throws {Error} - Se dados inválidos
   */
  validateCartData(cartData) {
    // Validar items
    if (!cartData.items || !Array.isArray(cartData.items)) {
      throw new Error('Dados inválidos: items deve ser um array')
    }

    if (cartData.items.length === 0) {
      throw new Error('Dados inválidos: carrinho não pode estar vazio')
    }

    // Validar cada item
    cartData.items.forEach((item, index) => {
      if (!item.product || !item.product.id) {
        throw new Error(`Item ${index}: produto inválido`)
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        throw new Error(`Item ${index}: quantidade inválida`)
      }
      if (typeof item.product.preco !== 'number' || item.product.preco < 0) {
        throw new Error(`Item ${index}: preço inválido`)
      }
    })

    // Validar subtotal
    if (typeof cartData.subtotal !== 'number' || cartData.subtotal < 0) {
      throw new Error('Subtotal inválido: deve ser um número positivo')
    }

    // Validar total
    if (typeof cartData.total !== 'number' || cartData.total < 0) {
      throw new Error('Total inválido: deve ser um número positivo')
    }

    // Validar desconto
    if (cartData.discount_value !== undefined) {
      if (typeof cartData.discount_value !== 'number' || cartData.discount_value < 0) {
        throw new Error('Desconto inválido: deve ser um número positivo')
      }
    }

    console.log('✅ Dados do carrinho validados com sucesso')
    return true
  },

  /**
   * Valida snapshot do carrinho antes de salvar
   * @param {number|string} mesaId - ID da mesa
   * @param {Object} cartData - Dados do carrinho
   * @returns {Promise<boolean>} - true se válido
   * @throws {Error} - Se validação falhar
   */
  async validateCartSnapshot(mesaId, cartData) {
    console.log(`🔍 Validando snapshot do carrinho para mesa ${mesaId}...`)
    
    try {
      // 1. Validar se mesa existe
      await this.validateMesaExists(mesaId)
      
      // 2. Validar estrutura dos dados
      this.validateCartData(cartData)
      
      // 3. Validar integridade dos valores
      const calculatedSubtotal = cartData.items.reduce((sum, item) => {
        return sum + (item.product.preco * item.quantity)
      }, 0)

      const tolerance = 0.01 // Tolerância de 1 centavo para arredondamentos
      if (Math.abs(calculatedSubtotal - cartData.subtotal) > tolerance) {
        throw new Error(
          `Inconsistência detectada: subtotal calculado (${calculatedSubtotal.toFixed(2)}) ` +
          `difere do fornecido (${cartData.subtotal.toFixed(2)})`
        )
      }

      console.log(`✅ Snapshot validado: Mesa ${mesaId}, Total: R$ ${cartData.total.toFixed(2)}`)
      return true
    } catch (error) {
      console.error('❌ Validação do snapshot falhou:', error.message)
      throw error
    }
  },

  /**
   * Valida se produtos existem e têm estoque
   * @param {Array} items - Array de items do carrinho
   * @returns {Promise<boolean>} - true se todos válidos
   * @throws {Error} - Se algum produto inválido
   */
  async validateProductsStock(items) {
    console.log(`🔍 Validando estoque de ${items.length} produto(s)...`)
    
    const productIds = items.map(item => item.product.id)
    
    const { data: products, error } = await supabase
      .from(TABLES.PRODUTOS)
      .select('id, nome, estoque_atual')
      .in('id', productIds)
    
    if (error) {
      throw new Error('Erro ao validar produtos: ' + error.message)
    }

    // Verificar cada item
    for (const item of items) {
      const product = products.find(p => p.id === item.product.id)
      
      if (!product) {
        throw new Error(`Produto ${item.product.nome} (ID: ${item.product.id}) não encontrado`)
      }

      if (product.estoque_atual < item.quantity) {
        throw new Error(
          `Estoque insuficiente para ${product.nome}: ` +
          `solicitado ${item.quantity}, disponível ${product.estoque_atual}`
        )
      }
    }

    console.log('✅ Todos os produtos têm estoque disponível')
    return true
  },

  /**
   * Valida dados antes de criar pedido
   * @param {Object} orderData - Dados do pedido
   * @returns {Promise<boolean>} - true se válido
   * @throws {Error} - Se validação falhar
   */
  async validateOrderData(orderData) {
    console.log('🔍 Validando dados do pedido...')
    
    // Validar mesa
    if (!orderData.mesa_id) {
      throw new Error('Mesa não especificada no pedido')
    }
    await this.validateMesaExists(orderData.mesa_id)

    // Validar itens
    if (!orderData.itens || !Array.isArray(orderData.itens) || orderData.itens.length === 0) {
      throw new Error('Pedido deve conter ao menos um item')
    }

    // Validar estrutura de cada item
    orderData.itens.forEach((item, index) => {
      if (!item.produto_id) {
        throw new Error(`Item ${index}: produto_id não especificado`)
      }
      if (typeof item.quantidade !== 'number' || item.quantidade <= 0) {
        throw new Error(`Item ${index}: quantidade inválida`)
      }
      if (typeof item.preco_unitario !== 'number' || item.preco_unitario < 0) {
        throw new Error(`Item ${index}: preço unitário inválido`)
      }
    })

    // Validar valor total
    if (typeof orderData.valor_total !== 'number' || orderData.valor_total < 0) {
      throw new Error('Valor total do pedido inválido')
    }

    // Validar forma de pagamento
    const validPayments = ['dinheiro', 'debito', 'credito', 'pix']
    const paymentMatch = orderData.observacoes?.match(/Pagamento: (\w+)/)
    if (paymentMatch) {
      const payment = paymentMatch[1].toLowerCase()
      if (!validPayments.includes(payment)) {
        throw new Error(`Forma de pagamento inválida: ${payment}`)
      }
    }

    console.log('✅ Dados do pedido validados com sucesso')
    return true
  }
}

export default validationService
