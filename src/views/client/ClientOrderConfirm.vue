<template>
  <div class="order-confirm-container">
    <!-- Header -->
    <div class="confirm-header">
      <button @click="goBack" class="btn-back">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1>Confirmar Pedido</h1>
    </div>

    <!-- Order Summary -->
    <div class="order-content">
      <div class="table-info">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="8" width="18" height="12" rx="2" />
          <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
        </svg>
        <div>
          <h2>Mesa {{ tableNumber }}</h2>
          <p>Revise seu pedido antes de enviar</p>
        </div>
      </div>

      <!-- Items List -->
      <div class="order-items">
        <h3>Itens do Pedido</h3>
        <div 
          v-for="item in cartStore.cartItems" 
          :key="item.product.id"
          class="order-item"
        >
          <div class="item-details">
            <span class="item-name">{{ item.product.nome }}</span>
            <span class="item-qty">x{{ item.quantity }}</span>
          </div>
          <div class="item-price">
            R$ {{ formatPrice(item.product.preco * item.quantity) }}
          </div>
        </div>
      </div>

      <!-- Customer Info -->
      <div class="customer-info">
        <h3>Seus Dados (Opcional)</h3>
        <div class="form-group">
          <label>Nome:</label>
          <input 
            v-model="customerName" 
            type="text" 
            placeholder="Seu nome"
          >
        </div>
        <div class="form-group">
          <label>Observações:</label>
          <textarea 
            v-model="observations" 
            placeholder="Ex: Sem cebola, ponto da carne, etc."
            rows="3"
          ></textarea>
        </div>
      </div>

      <!-- Payment Method -->
      <div class="payment-section">
        <h3>Forma de Pagamento</h3>
        <div class="payment-options">
          <button 
            v-for="method in paymentMethods" 
            :key="method.value"
            @click="selectPayment(method.value)"
            class="payment-option"
            :class="{ active: selectedPayment === method.value }"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="4" width="22" height="16" rx="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            <span>{{ method.label }}</span>
          </button>
        </div>
      </div>

      <!-- Total -->
      <div class="order-total">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>R$ {{ formatPrice(cartStore.subtotal) }}</span>
        </div>
        <div class="total-row main">
          <span>Total:</span>
          <span>R$ {{ formatPrice(cartStore.total) }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="order-actions">
        <button @click="goBack" class="btn-secondary">
          Voltar ao Cardápio
        </button>
        <button 
          @click="confirmOrder" 
          class="btn-confirm"
          :disabled="submitting"
        >
          <svg v-if="!submitting" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div v-else class="spinner-small"></div>
          {{ submitting ? 'Enviando...' : 'Confirmar Pedido' }}
        </button>
      </div>
    </div>

    <!-- Success Modal -->
    <transition name="fade">
      <div v-if="showSuccess" class="success-modal">
        <div class="modal-overlay" @click="closeSuccess"></div>
        <div class="modal-content">
          <div class="success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2>Pedido Enviado!</h2>
          <p>Seu pedido foi recebido e será preparado em breve.</p>
          <p class="order-number">Pedido #{{ orderNumber }}</p>
          <button @click="closeSuccess" class="btn-close-modal">
            Fazer Novo Pedido
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { ordersAPI, TABLES } from '@/services/supabase'
import { syncService } from '@/services/syncService'

const router = useRouter()
const route = useRoute()
const cartStore = useCartStore()

const tableId = route.params.tableId
const tableNumber = route.query.tableNumber || 'N/A'

const customerName = ref('')
const observations = ref('')
const selectedPayment = ref('dinheiro')
const submitting = ref(false)
const showSuccess = ref(false)
const orderNumber = ref('')

const paymentMethods = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'debito', label: 'Débito' },
  { value: 'credito', label: 'Crédito' },
  { value: 'pix', label: 'PIX' }
]

const formatPrice = (price) => {
  return parseFloat(price).toFixed(2).replace('.', ',')
}

const selectPayment = (method) => {
  selectedPayment.value = method
  cartStore.setPaymentMethod(method)
}

const confirmOrder = async () => {
  if (cartStore.isEmpty) {
    alert('Carrinho vazio')
    return
  }

  submitting.value = true

  try {
    // Preparar dados do pedido
    const cartData = cartStore.finalizeCart()
    
    const orderData = {
      mesa_id: tableId,
      status: 'active',
      valor_total: cartData.total,
      desconto: cartData.desconto || 0,
      forma_pagamento: selectedPayment.value,
      itens: cartData.items,
      cliente_nome: customerName.value || null,
      observacoes: observations.value || null,
      origem: 'cliente' // Marca que veio do cliente
    }

    console.log('📤 Enviando pedido:', orderData)

    // ✅ Usar syncService para criar pedido (funciona offline)
    const result = await syncService.insert(TABLES.PEDIDOS, orderData)

    if (result.offline) {
      alert('Você está offline. O pedido será enviado quando a conexão for restaurada.')
    }

    // Pegar ID do pedido
    const orderId = result.data?.id || result.data?.[0]?.id || `temp_${Date.now()}`
    orderNumber.value = orderId.toString().slice(0, 8)

    console.log('✅ Pedido criado:', orderId)

    // Atualizar status da mesa para ocupada
    await syncService.update(TABLES.MESAS, tableId, {
      status: 'occupied',
      pedido_atual_id: orderId
    })

    // Limpar carrinho
    cartStore.clearCart()

    // Mostrar modal de sucesso
    showSuccess.value = true

  } catch (error) {
    console.error('❌ Erro ao enviar pedido:', error)
    alert('Erro ao enviar pedido. Tente novamente.')
  } finally {
    submitting.value = false
  }
}

const closeSuccess = () => {
  showSuccess.value = false
  router.push({
    name: 'client-menu',
    params: { tableId },
    query: { tableNumber }
  })
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.order-confirm-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
}

.confirm-header {
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
  flex-shrink: 0;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.3);
}

.confirm-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.order-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 1.5rem;
}

.table-info {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.table-info svg {
  color: #C41E3A;
  flex-shrink: 0;
}

.table-info h2 {
  margin: 0 0 0.25rem 0;
  color: #1f2937;
  font-size: 1.5rem;
}

.table-info p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.order-items,
.customer-info,
.payment-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.order-items h3,
.customer-info h3,
.payment-section h3 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.1rem;
}

.order-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.order-item:last-child {
  border-bottom: none;
}

.item-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.item-name {
  color: #1f2937;
  font-weight: 500;
}

.item-qty {
  color: #6b7280;
  font-size: 0.875rem;
}

.item-price {
  color: #C41E3A;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  color: #6b7280;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #C41E3A;
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

.payment-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.payment-option {
  background: white;
  border: 2px solid #e5e7eb;
  padding: 1rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #6b7280;
}

.payment-option:hover {
  border-color: #C41E3A;
}

.payment-option.active {
  background: #C41E3A;
  border-color: #C41E3A;
  color: white;
}

.payment-option span {
  font-weight: 600;
  font-size: 0.875rem;
}

.order-total {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  color: #6b7280;
}

.total-row.main {
  border-top: 2px solid #e5e7eb;
  padding-top: 1rem;
  margin-top: 0.5rem;
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
}

.order-actions {
  display: flex;
  gap: 1rem;
}

.btn-secondary,
.btn-confirm {
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-secondary {
  background: #e5e7eb;
  color: #6b7280;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.btn-confirm {
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Success Modal */
.success-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  background: white;
  padding: 2rem;
  border-radius: 16px;
  text-align: center;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.success-icon {
  color: #10b981;
  margin-bottom: 1rem;
  animation: checkmark 0.5s ease-in-out;
}

@keyframes checkmark {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

.modal-content h2 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
}

.modal-content p {
  margin: 0 0 1rem 0;
  color: #6b7280;
}

.order-number {
  background: #f8fafc;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: bold;
  color: #C41E3A;
  margin-bottom: 1.5rem !important;
}

.btn-close-modal {
  background: linear-gradient(135deg, #C41E3A, #FF6B35);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.btn-close-modal:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .order-content {
    padding: 1rem;
  }
  
  .order-actions {
    flex-direction: column;
  }
  
  .payment-options {
    grid-template-columns: 1fr;
  }
}
</style>